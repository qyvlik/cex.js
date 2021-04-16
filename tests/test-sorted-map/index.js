const SortedMap = require("collections/sorted-map");

const m = new SortedMap();

m.set(5, 50);
m.set(4, 40);
m.set(1, 10);
m.set(3, 30);
m.set(2, 20);

let count = 0;
try {
    m.forEach((val, key) => {
        count++;
        console.info(`val=${val}, key=${key}`);
        if (count >= 3) {
            throw new Error('stop forEach such as break');
        }
    });
} catch (error) {

}

console.info(`end`);

const items = [];
m.forEach((val, key) => {
    items.push([key, val]);
});
console.info(`items=${JSON.stringify(items)}`);
