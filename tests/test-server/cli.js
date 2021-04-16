const Client = require('../../src/jsonrpc/client');

(async () => {
    const client = new Client();
    await client.open('ws://localhost:8080');


    console.info(`ping=${await client.call('ping', [Date.now()])}`);


    await client.call('createCurrency', ['BTC']);
    await client.call('createCurrency', ['USDT']);
    await client.call('createMarket', ['BTC/USDT']);

    const cmd = {
        uid: 10000,
        side: 'BUY',
        price: '10000',
        amount: '10000',
        symbol: 'BTC/USDT'
    };

    const placeResult = await client.call('placeOrder', cmd);
    console.info(`placeResult=${JSON.stringify(placeResult)}`);


    const order = await client.call('getOrder', {symbol: 'BTC/USDT', seq: placeResult.seq});
    console.info(`getOrder=${JSON.stringify(order)}`);

})();

