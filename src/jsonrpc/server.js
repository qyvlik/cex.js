const WebSocket = require('ws');
const util = require('util');

const jsonrpc = '2.0';

module.exports = class Server {
    constructor(port) {
        this.ws = new WebSocket.Server({port});
        this.methods = {};
        const that = this;
        this.ws.on('connection', (session) => {
            session.on('message', async (message) => {
                let reqObj = null;
                try {
                    reqObj = JSON.parse(message);
                } catch (error) {
                    session.send(JSON.stringify({jsonrpc, error: {code: -32700, message: 'Parse error'}}));
                    return;
                }
                let result = {};
                if (Array.isArray(reqObj)) {
                    if (reqObj.length !== 0) {
                        result = {jsonrpc, error: {code: -32600, message: 'Invalid Request'}};
                    } else {
                        result = [];
                        for (const req of reqObj) {
                            result.push(await that.singleCall(req));
                        }
                    }
                } else {
                    result = await that.singleCall(reqObj);
                }
                session.send(JSON.stringify(result));
            });
        });
    }

    addMethod(name, func) {
        if (typeof func !== 'function') throw new Error('func not function');
        this.methods[name] = func;
    }

    async singleCall(req) {
        const {id, method, params} = req;
        if (typeof method === 'undefined') {
            return {jsonrpc, id, error: {code: -32600, message: 'Invalid Request'}};
        }
        const func = this.methods[method];
        if (typeof func !== 'function') {
            return {jsonrpc, id, error: {code: -32601, message: 'Method not found'}};
        }

        let result = null;
        const isPositional = Array.isArray(params);
        const isAsync = util.types.isAsyncFunction(func);

        try {
            if (isPositional) {
                result = isAsync ? func(...params) : await func(...params);
            } else {
                result = isAsync ? func(params) : await func(params);
            }
            return {id, jsonrpc, result};
        } catch (error) {
            console.error(`jsonrpc server call ${method} error:${error}`);
            console.trace(error);

            return {jsonrpc, id, error: {code: -32603, message: error.message, data: error}};
        }
    }

    notification(session, {method, params}) {
        if (session.readyState === WebSocket.OPEN) {
            session.send(JSON.stringify({jsonrpc, method, params}));
        }
    }
}
;