const MatchEngine = require('../../src/exchange/match-engine');

BigInt.prototype.toJSON = function () {
    return this.toString()
};

const me = new MatchEngine('BTC/USDT');
let seq = BigInt(1);

const total = 100000;
console.time(`place:${total}`);
let count = total;
while (count-- > 0) {
    const order = {
        uid: 1,
        side: count % 2 === 0 ? 'BUY' : 'SELL',
        price: BigInt('10000'),
        seq: seq++,
        amount: BigInt(1),
        time: Date.now()
    };
    me.placeOrder(order);
}
console.timeEnd(`place:${total}`);

me.asks.forEach(function (order, key) {
    console.log(`asks price=${key.price}, seq=${key.seq}, order=${JSON.stringify(order)}`);
});
me.bids.forEach(function (order, key) {
    console.log(`bids price=${key.price}, seq=${key.seq}, order=${JSON.stringify(order)}`);
});
