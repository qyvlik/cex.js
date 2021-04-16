const Server = require('../../src/exchange/exchange-server');

BigInt.prototype.toJSON = function () {
    return this.toString()
};
const server = new Server();

const total = 100000;
const uid = 10000;
const symbol = 'BTC/USDT';
server.createCurrency('BTC');
server.createCurrency('USDT');
server.createMarket(symbol);

server.recharge({uid, currency: 'BTC', amount: total});
server.recharge({uid, currency: 'USDT', amount: total});

console.time(`place:${total}`);
let count = total;
while (count-- > 0) {
    server.placeOrder({
        uid,
        side: count % 2 === 0 ? 'BUY' : 'SELL',
        symbol,
        price: "1",
        amount: "1"
    });
}
console.timeEnd(`place:${total}`);