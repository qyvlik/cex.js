const Client = require('../../src/jsonrpc/client');

(async () => {
    const client = new Client();
    await client.open('ws://localhost:8080');


    console.info(`ping=${await client.call('ping', [Date.now()])}`);

})();

