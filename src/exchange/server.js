const JsonRpcServer = require("../../src/jsonrpc/server");

const MatchEngine = require("./match-engine");

const ZERO = BigInt(0);

module.exports = class Server {
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
            throw new Error(`symbol ${symbol} already exist`);
        }
        this.symbols.add(symbol);
        this.engines.set(symbol, new MatchEngine(symbol));
        return symbol;
    }

    recharge({uid, currency, amount, time}) {
        if (!this.currencys.has(currency)) {
            throw new Error(`currency ${currency} not exist`);
        }
        amount = BigInt(amount);
        if (amount <= ZERO) {
            throw new Error(`amount ${amount} less than zero`);
        }

        const account = this.getAccount({uid, currency});
        account.available += amount;
        account.utime = time;
        return true;
    }

    withdraw({uid, currency, amount, time}) {
        if (!this.currencys.has(currency)) {
            throw new Error(`currency ${currency} not exist`);
        }
        amount = BigInt(amount);
        if (amount <= ZERO) {
            throw new Error(`amount ${amount} less than zero`);
        }
        const key = `${uid}/${currency}`;
        const account = this.accounts.get(key);
        if (typeof account === 'undefined') {
            throw new Error(`account ${key} not exist`);
        }
        account.available -= amount;
        account.utime = time;
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

        // sub balance
        const [base, quote] = symbol.split('/');
        const sideIsBuy = side === 'BUY';
        const money = sideIsBuy ? price * amount : ZERO;
        const subCurrency = sideIsBuy ? quote : base;
        const account = this.getAccount({uid, currency: subCurrency});
        const frozen = sideIsBuy ? money : amount;
        if (account.available < frozen) {
            throw new Error(`Insufficient funds, available of ${subCurrency} less than ${frozen}`);
        }
        account.available -= frozen;
        account.frozen += frozen;

        const order = {
            uid,
            side,
            price: price,
            amount: amount,
            time: Date.now(),
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
            const account = this.getAccount({uid, currency});
            account[type] -= amount;
            account.utime = time;
        }
        {
            const {currency, amount, type} = inbound;
            const account = this.getAccount({uid, currency});
            account[type] += amount;
            account.utime = time;
        }
        if (isTaker && refund.amount > ZERO) {
            const account = this.getAccount({uid, currency: refund.currency});
            account.available += refund.amount;
            account.frozen -= refund.amount;
            account.utime = time;
        }
    }

    getAccount({uid, currency}) {
        const key = `${uid}/${currency}`;
        let account = this.accounts.get(key);
        if (typeof account === 'undefined') {
            const time = Date.now();
            account = {
                uid,
                currency: currency,
                available: ZERO,
                frozen: ZERO,
                time,
                utime: time
            };
            this.accounts.set(key, account);
        }
        return account;
    }

    getAccounts({uid}) {
        const accounts = [];
        for (const currency of this.currencys) {
            const account = this.getAccount({uid, currency});
            accounts.add(account);
        }
        return accounts;
    }

    cancelOrder({symbol, seq}) {
        const engine = this.engines.get(symbol);
        if (typeof engine === 'undefined') {
            throw new Error(`symbol ${symbol} not exist`);
        }
        return engine.cancelOrder(BigInt(seq));
    }

    getOrder({symbol, seq}) {
        const engine = this.engines.get(symbol);
        if (typeof engine === 'undefined') {
            throw new Error(`symbol ${symbol} not exist`);
        }
        return engine.getOrder(BigInt(seq));
    }
};

