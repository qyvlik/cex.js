BigInt.prototype.toJSON = function () {
    return this.toString()
};

const Server = require('../../src/exchange/exchange-server');
const JsonRpcServer = require("../../src/jsonrpc/server");

(async () => {
    const server = new Server();

    const jsonRpcServer = new JsonRpcServer(8080);

    const methods = ['ping',
        'createCurrency', 'createMarket',
        'placeOrder', 'cancelOrder', 'getOrder',
        'getDepth',
        'recharge', 'withdraw', 'getAccount', 'getAccounts'];

    for (const method of methods) {
        jsonRpcServer.addMethod(method, function () {
            return server[method](...arguments);
        });
    }
})();