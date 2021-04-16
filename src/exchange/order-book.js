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
        return 1;
    }
    if (k1.seq > k2.seq) {
        return -1;
    }
    return 0;
}

const asks = new SortedMap(null, equals, compareAsc);

/**
 *
 * @type {module.OrderBook}
 */
module.exports = class OrderBook {
    constructor() {
        this.asks = new SortedMap(null, equals, compareAsc);
        this.bids = new SortedMap(null, equals, compareDesc);
        this.orders = new Map();
    }

    add(order) {
        const {side, price, seq} = order;
        const books = side === 'BUY' ? this.bids : this.asks;
        books.set({price, seq}, order);
        this.orders [seq] = order;
    }

    remove(seq) {
        const orders = this.orders;
        if (orders.has(seq)) {
            const {price, seq, side} = this.orders.get(seq);
            const books = side === 'BUY' ? this.bids : this.asks;
            books.delete({price, seq});
            orders.delete(seq);
            return true;
        }
        return false;
    }

    first(side) {
        const books = side === 'BUY' ? this.bids : this.asks;
        return books.min();
    }

};
