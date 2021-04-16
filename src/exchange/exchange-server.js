const JsonRpcServer = require("../../src/jsonrpc/server");

const MatchEngine = require("./match-engine");

const ZERO = BigInt(0);

module.exports = class ExchangeServer {
    constructor() {
        this.engines = new Map();
        this.accounts = new Map();
        this.currencys = new Set();
        this.symbols = new Set();
        this.decimals = 18;
        this.seq = ZERO;
        const that = this;
    }

    ping() {
        return Date.now();
    }

    createCurrency(currency) {
        this.currencys.add(currency);
        return currency;
    }

    createMarket(symbol) {
        const [base, quote] = symbol.split('/');
        if (!this.currencys.has(base)) {
            throw new Error(`base currency ${base} not exist`);
        }
        if (!this.currencys.has(quote)) {
            throw new Error(`quote currency ${quote} not exist`);
        }
        if (this.symbols.has(symbol)) {
            return symbol;
        }
        this.symbols.add(symbol);
        this.engines.set(symbol, new MatchEngine(symbol));
        return symbol;
    }

    recharge({uid, currency, amount}) {
        if (!this.currencys.has(currency)) {
            throw new Error(`currency ${currency} not exist`);
        }
        amount = BigInt(amount);
        if (amount <= ZERO) {
            throw new Error(`amount ${amount} less than zero`);
        }
        const time = Date.now();
        const account = this.getAccount({uid, currency, time});
        account.available += amount;
        account.utime = time;
        account.version++;
        return true;
    }

    withdraw({uid, currency, amount}) {
        if (!this.currencys.has(currency)) {
            throw new Error(`currency ${currency} not exist`);
        }
        amount = BigInt(amount);
        if (amount <= ZERO) {
            throw new Error(`amount ${amount} less than zero`);
        }
        const time = Date.now();
        const key = `${uid}/${currency}`;
        const account = this.getAccount({uid, currency, time});
        if (typeof account === 'undefined') {
            throw new Error(`account ${key} not exist`);
        }
        account.available -= amount;
        account.utime = time;
        account.version++;
        return true;
    }

    placeOrder({uid, side, symbol, price, amount}) {
        const engine = this.engines.get(symbol);
        if (typeof engine === 'undefined') {
            throw new Error(`symbol ${symbol} not exist`);
        }

        price = BigInt(price);
        if (price <= ZERO) {
            throw new Error(`price ${price} less than zero`);
        }

        amount = BigInt(amount);
        if (amount <= ZERO) {
            throw new Error(`amount ${amount} less than zero`);
        }
        const time = Date.now();
        // sub balance
        const sideIsBuy = side === 'BUY';
        const money = sideIsBuy ? price * amount : ZERO;
        const subCurrency = sideIsBuy ? engine.quote : engine.base;
        const account = this.getAccount({uid, currency: subCurrency, time});
        const frozen = sideIsBuy ? money : amount;
        if (account.available < frozen) {
            throw new Error(`Insufficient funds, available of ${subCurrency} less than ${frozen}`);
        }
        account.available -= frozen;
        account.frozen += frozen;
        account.utime = time;
        account.version++;

        const order = {
            uid,
            side,
            price: price,
            amount: amount,
            time,
            seq: (this.seq += BigInt(1))
        };
        const result = engine.placeOrder(order);

        for (const trade of result.trades) {
            const {taker, maker, time} = trade;
            this.inAndOutBound(taker, time, true);
            this.inAndOutBound(maker, time, false);
        }

        return result;
    }

    inAndOutBound({uid, outbound, inbound, refund}, time, isTaker) {
        {
            const {currency, amount, type} = outbound;
            const account = this.getAccount({uid, currency, time});
            account[type] -= amount;
            account.utime = time;
            account.version++;
        }
        {
            const {currency, amount, type} = inbound;
            const account = this.getAccount({uid, currency, time});
            account[type] += amount;
            account.utime = time;
            account.version++;
        }
        if (isTaker && refund.amount > ZERO) {
            const account = this.getAccount({uid, currency: refund.currency, time});
            account.available += refund.amount;
            account.frozen -= refund.amount;
            account.utime = time;
            account.version++;
        }
    }

    getAccount({uid, currency, time}) {
        const key = `${uid}/${currency}`;
        let account = this.accounts.get(key);
        if (typeof account === 'undefined') {
            account = {
                uid,
                currency: currency,
                available: ZERO,
                frozen: ZERO,
                time,
                utime: time,
                version: ZERO
            };
            this.accounts.set(key, account);
        }
        return account;
    }

    getAccounts({uid}) {
        const time = Date.now();
        const accounts = [];
        for (const currency of this.currencys) {
            const account = this.getAccount({uid, currency, time});
            accounts.add(account);
        }
        return accounts;
    }

    cancelOrder({symbol, seq}) {
        const engine = this.engines.get(symbol);
        if (typeof engine === 'undefined') {
            throw new Error(`symbol ${symbol} not exist`);
        }
        const time = Date.now();
        this.seq++;
        const result = engine.cancelOrder(BigInt(seq));
        const {cancel} = result;
        if (typeof cancel !== 'undefined') {
            const account = this.getAccount({
                uid: cancel.uid, currency: cancel.currency, time
            });
            account.frozen -= cancel.amount;
            account.available += cancel.amount;
            account.utime = time;
            account.version++;
        }

        return result;
    }

    getOrder({symbol, seq}) {
        const engine = this.engines.get(symbol);
        if (typeof engine === 'undefined') {
            throw new Error(`symbol ${symbol} not exist`);
        }
        return engine.getOrder(BigInt(seq));
    }

    getDepth({symbol, limit}) {
        const engine = this.engines.get(symbol);
        if (typeof engine === 'undefined') {
            throw new Error(`symbol ${symbol} not exist`);
        }
        const result = engine.getDepth(limit);
        result.time = Date.now();
        return result;
    }

    getTicker({symbol}) {
        const engine = this.engines.get(symbol);
        if (typeof engine === 'undefined') {
            throw new Error(`symbol ${symbol} not exist`);
        }
        const depth = engine.getDepth(1);
        const last = engine.getTicker();
        return {last, ask: depth.asks[0], bid: depth.bids[0], time: Date.now()};
    }
};

