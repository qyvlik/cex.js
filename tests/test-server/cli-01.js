const Client = require('../../src/jsonrpc/client');

(async () => {
    const client = new Client();
    await client.open('ws://localhost:8080');

    console.info(`ping=${await client.call('ping', [Date.now()])}`);


    await client.call('createCurrency', ['BTC']);
    await client.call('createCurrency', ['USDT']);
    try {
        await client.call('createMarket', ['BTC/USDT']);
    } catch (error) {
        console.error(`createMarket failure : ${error.message}`);
    }

    await client.call('recharge', {
        uid: 10000,
        currency: 'BTC',
        amount: '10'
    });


    await client.call('recharge', {
        uid: 10000,
        currency: 'USDT',
        amount: '620000'
    });

    {
        const accounts = await client.call('getAccounts', {uid: 10000});
        console.info(`getAccount=${JSON.stringify(accounts)}`);
    }

    const buyCmd = {
        uid: 10000,
        side: 'BUY',
        price: '62000',
        amount: '10',
        symbol: 'BTC/USDT'
    };
    let buyOrderId = null;
    try {
        const placeResult = await client.call('placeOrder', buyCmd);
        console.info(`placeResult=${JSON.stringify(placeResult)}`);

        const order = await client.call('getOrder', {symbol: 'BTC/USDT', seq: placeResult.seq});
        console.info(`getOrder=${JSON.stringify(order)}`);
        buyOrderId = placeResult.seq;
    } catch (error) {
        console.error(`placeOrder failure : ${JSON.stringify(error)}`);
    }

    const sellCmd = {
        uid: 10000,
        side: 'SELL',
        price: '62000',
        amount: '9',
        symbol: 'BTC/USDT'
    };

    try {
        const placeResult = await client.call('placeOrder', sellCmd);
        console.info(`placeResult=${JSON.stringify(placeResult)}`);

    } catch (error) {
        console.error(`placeOrder failure : ${JSON.stringify(error)}`);
    }

    {
        const accounts = await client.call('getAccounts', {uid: 10000});
        console.info(`getAccount=${JSON.stringify(accounts)}`);
    }

    {
        const cancel = await client.call('cancelOrder', {symbol: 'BTC/USDT', seq: buyOrderId});
        console.info(`cancel = ${JSON.stringify(cancel)}`);
        const accounts = await client.call('getAccounts', {uid: 10000});
        console.info(`getAccount=${JSON.stringify(accounts)}`);
    }

})();

