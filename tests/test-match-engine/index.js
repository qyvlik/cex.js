const MatchEngine = require('../../src/exchange/match-engine');

BigInt.prototype.toJSON = function() {
    return this.toString()
};

const me = new MatchEngine();
let seq = BigInt(1);


const o1 = {
    uid: 1,
    side: 'BUY',
    price: BigInt('10000'),
    seq: seq++,
    amount: BigInt(1),
    time: Date.now()
};

me.placeOrder(o1);

const o2 = {
    uid: 1,
    side: 'BUY',
    price: BigInt('10000'),
    seq: seq++,
    amount: BigInt(1),
    time: Date.now()
};

me.placeOrder(o2);

const o3 = {
    uid: 1,
    side: 'SELL',
    price: BigInt('10000'),
    seq: seq++,
    amount: BigInt(2),
    time: Date.now()
};

const val = me.placeOrder(o3);

me.asks.forEach(function (order, key) {
    console.log(`ask price=${key.price}, seq=${key.seq}, order=${JSON.stringify(order)}`);
});


me.bids.forEach(function (order, key) {
    console.log(`ask price=${key.price}, seq=${key.seq}, order=${JSON.stringify(order)}`);
});

console.info(`val=${JSON.stringify(val)}`);

const trades = val.trades;
for(const trade of trades) {
    console.info(`trade = ${JSON.stringify(trade)}`);
}