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
        amount: '1'
    });


    await client.call('recharge', {
        uid: 10000,
        currency: 'USDT',
        amount: '100000'
    });

    {
        const accounts = await client.call('getAccounts', {uid: 10000});
        console.info(`getAccount=${JSON.stringify(accounts)}`);
    }

    const sellCmd = {
        uid: 10000,
        side: 'SELL',
        price: '62000',
        amount: '1',
        symbol: 'BTC/USDT'
    };

    try {
        const placeResult = await client.call('placeOrder', sellCmd);
        console.info(`placeResult=${JSON.stringify(placeResult)}`);

    } catch (error) {
        console.error(`placeOrder failure : ${JSON.stringify(error)}`);
    }

    try {
        const depth = await client.call('getDepth', {symbol: 'BTC/USDT'});
        console.info(`getDepth=${JSON.stringify(depth)}`);

        const ticker = await client.call('getTicker', {symbol: 'BTC/USDT'});
        console.info(`getTicker=${JSON.stringify(ticker)}`);
    } catch (error) {
        console.error(`getDepth failure : ${JSON.stringify(error)}`);
    }

    const buyCmd = {
        uid: 10000,
        side: 'BUY',
        price: '63000',
        amount: '1',
        symbol: 'BTC/USDT'
    };
    try {
        const placeResult = await client.call('placeOrder', buyCmd);
        console.info(`placeResult=${JSON.stringify(placeResult)}`);

        const order = await client.call('getOrder', {symbol: 'BTC/USDT', seq: placeResult.seq});
        console.info(`getOrder=${JSON.stringify(order)}`);

    } catch (error) {
        console.error(`placeOrder failure : ${JSON.stringify(error)}`);
    }

    {
        const accounts = await client.call('getAccounts', {uid: 10000});
        console.info(`getAccount=${JSON.stringify(accounts)}`);
    }


})();

