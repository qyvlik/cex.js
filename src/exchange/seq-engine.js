/**
 *
 * @type {module.SeqEngine}
 */
module.exports = class SeqEngine {

    constructor(seq) {
        this.seq = seq || 0;
    }

    increase() {
        return this.seq++;
    }

};