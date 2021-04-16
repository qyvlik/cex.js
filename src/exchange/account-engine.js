/**
 *
 * @type {module.AccountEngine}
 */
module.exports = class AccountEngine {
    constructor(currency) {
        this.currency = currency;
        this.accounts = new Map();
        this.seq = 0;
    }

    create(uid, time) {
        this.accounts.set(uid, {
            uid,
            currency: this.currency,
            available: BigInt(0),
            frozen: BigInt(0),
            time,
            utime: time
        });
    }

    recharge(uid, amount, time) {
        if (!this.accounts.has(uid)) {
            this.create(uid, time);
        }

        const account = this.accounts.get(uid);
        account.available += amount;
        account.utime += time;
    }

    withdraw(uid, amount, time) {
        if (!this.accounts.has(uid)) {
            this.create(uid, time);
        }

        const account = this.accounts.get(uid);
        account.available -= amount;
        account.utime += time;
    }


};