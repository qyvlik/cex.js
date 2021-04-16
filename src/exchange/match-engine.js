const SortedMap = require("collections/sorted-map");


function equals(k1, k2) {
    return k1.price === k2.price && k1.seq === k2.seq;
}

function compareAsc(k1, k2) {
    if (k1.price < k2.price) {
        return -1;
    }
    if (k1.price > k2.price) {
        return 1;
    }
    if (k1.seq < k2.seq) {
        return -1;
    }
    if (k1.seq > k2.seq) {
        return 1;
    }
    return 0;
}

function compareDesc(k1, k2) {
    if (k1.price < k2.price) {
        return 1;
    }
    if (k1.price > k2.price) {
        return -1;
    }
    if (k1.seq < k2.seq) {
        return -1;
    }
    if (k1.seq > k2.seq) {
        return 1;
    }
    return 0;
}


/**
 *
 * @type {module.MatchEngine}
 */
module.exports = class MatchEngine {

    constructor(symbol) {
        const [base, quote] = symbol.split('/');
        this.symbol = symbol;
        this.base = base;
        this.quote = quote;
        this.asks = new SortedMap(null, equals, compareAsc);
        this.bids = new SortedMap(null, equals, compareDesc);
        this.orders = new Map();
        this.ZERO = BigInt(0);
    }

    placeOrder(order) {
        const taker = Object.assign({}, order);
        taker.remain = taker.amount;
        // uid, side, price, seq, amount, remain, time
        const {side, price, seq} = taker;
        const orders = this.orders;
        const takerBooks = side === 'BUY' ? this.bids : this.asks;
        const makerBooks = side === 'SELL' ? this.bids : this.asks;

        const trades = [];

        if (makerBooks.length <= 0) {
            takerBooks.set({price, seq}, taker);
            orders.set(seq, taker);
            return {seq: taker.seq, trades};
        }

        let maker = makerBooks.min();
        while ((side === 'BUY' && maker.price <= taker.price) || ( side === 'SELL' && maker.price >= taker.price)) {
            const deal = maker.remain < taker.remain ? maker.remain : taker.remain;
            const price = maker.price;
            const money = price * deal;
            maker.remain -= deal;
            taker.remain -= deal;

            const refundMoney = (taker.side === 'BUY' && taker.price > maker.price)
                ? (taker.price - maker.price) * deal : this.ZERO;

            trades.push({
                symbol: this.symbol,
                price: price,
                deal: deal,
                time: taker.time,
                taker: {
                    refund: {
                        amount: refundMoney,
                        currency: this.quote,
                    },
                    outbound: {
                        amount: taker.side === 'BUY' ? money : deal,
                        currency: taker.side === 'BUY' ? this.quote : this.base,
                        type: 'frozen'
                    },
                    inbound: {
                        amount: taker.side === 'BUY' ? deal : money,
                        currency: taker.side === 'BUY' ? this.base : this.quote,
                        type: 'available'
                    },
                    uid: taker.uid,
                    seq: taker.seq,
                    side: taker.side,
                },
                maker: {
                    uid: maker.uid,
                    seq: maker.seq,
                    side: maker.side,
                    outbound: {
                        amount: maker.side === 'BUY' ? money : deal,
                        currency: maker.side === 'BUY' ? this.quote : this.base,
                        type: 'frozen'
                    },
                    inbound: {
                        amount: maker.side === 'BUY' ? deal : money,
                        currency: maker.side === 'BUY' ? this.base : this.quote,
                        type: 'available'
                    },
                },
            });

            if (maker.remain === this.ZERO) {
                makerBooks.delete(maker);
            }

            if (taker.remain === this.ZERO) {
                break;
            }

            if (makerBooks.length === 0) {
                break;
            }
            maker = makerBooks.min();
        }

        if (taker.remain > this.ZERO) {
            takerBooks.set({price, seq}, taker);
            orders.set(seq, taker);
        }
        return {seq: taker.seq, trades};
    }

    cancelOrder(seq) {
        const orders = this.orders;
        if (orders.has(seq)) {
            const {price, side} = this.orders.get(seq);
            const books = side === 'BUY' ? this.bids : this.asks;
            books.delete({price, seq});
            orders.delete(seq);
            return true;
        }
        return false;
    }

    getOrder(seq) {
        return this.orders.get(seq);
    }
};