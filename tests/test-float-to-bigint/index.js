BigInt.prototype.toJSON = function () {
    return this.toString()
};


function toBigInt(numStr, decimals) {
    if (numStr.includes('.')) {
        const [integer, decimal] = numStr.split('.');
        console.info(`integer=${integer}, decimal=${decimal}`);
        return BigInt(integer + '' + decimal.padEnd(decimals, '0'));
    }
}

const num = '111.1111';

console.info(toBigInt(num, 18));