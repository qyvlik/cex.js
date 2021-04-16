const JsonRpcServer = require("../../src/jsonrpc/server");

const MatchEngine = require("./match-engine");
const AccountEngine = require('./account-engine');

module.exports = class Server {
    constructor(port) {
        this.server = new JsonRpcServer(port);
        this.engines = new Map();
        this.accounts = new Map();
        this.currencys = new Set();
        this.symbols = new Set();
        this.decimals = 18;
        const that = this;
        const methods = ['ping', 'createCurrency',
            'createMarket', 'recharge', 'withdraw',
            'placeOrder', 'cancelOrder', 'getOrder'];

        for (const method of methods) {
            this.server.addMethod(method, () => {
                return that[method](...arguments)
            });
        }
    }

    ping() {
        return Date.now();
    }

    createCurrency(currency) {
        this.currencys.add(currency);
        this.accounts.set(currency, new AccountEngine(currency));
        return currency;
    }

    createMarket(symbol) {
        const [base, quote] = symbo.split('/');
        if (!this.currencys.has(base)) {
            throw new Error(`base currency ${base} not exist`);
        }
        if (!this.currencys.has(quote)) {
            throw new Error(`quote currency ${quote} not exist`);
        }
        if (this.symbols.has(symbol)) {
            throw new Error(`symbol ${symbol} already exist`);
        }
        this.symbols.add(symbol);
        this.engines.set(symbol, new MatchEngine());
        return symbol;
    }

    recharge({uid, currency, amount, time}) {
        if (!this.currencys.has(currency)) {
            throw new Error(`currency ${currency} not exist`);
        }
        const accounts = this.accounts.get(currency);
        accounts.recharge(uid, amount, time);
        return true;
    }

    withdraw({uid, currency, amount, time}) {
        if (!this.currencys.has(currency)) {
            throw new Error(`currency ${currency} not exist`);
        }
        const accounts = this.accounts.get(currency);
        accounts.withdraw(uid, amount, time);
        return true;
    }

    placeOrder({uid, side, symbol, price, amount}) {
        const engine = this.engines.get(symbol);
        if (typeof engine === 'undefined') {
            throw new Error(`symbol ${symbol} not exist`);
        }
        const order = {uid, side, price, amount};
        order.time = Date.now();
        order.seq = this.seq++;
        return engine.placeOrder(order);
    }

    cancelOrder({symbol, seq}) {
        const engine = this.engines.get(symbol);
        if (typeof engine === 'undefined') {
            throw new Error(`symbol ${symbol} not exist`);
        }
        return engine.cancelOrder(seq);
    }

    getOrder({seq}) {
        const engine = this.engines.get(symbol);
        if (typeof engine === 'undefined') {
            throw new Error(`symbol ${symbol} not exist`);
        }
        return engine.getOrder(seq);
    }
};

