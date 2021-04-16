BigInt.prototype.toJSON = function () {
    return this.toString()
};

const Server = require('../../src/exchange/server');

(async () => {
    const s = new Server(8080);

})();