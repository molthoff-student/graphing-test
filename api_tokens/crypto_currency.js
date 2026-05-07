// Generate random value
let trend = 0.000001;
const getRandomValue = () => {
    const volatility = 0.02;
    const u = Math.random();
    const v = Math.random();
    const normal = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);

    return Math.exp(trend + normal * volatility);
};

const decimals = 2;
function truncate(num) {
    const factor = Math.pow(10, decimals);
    return Math.truct(num * factor) / factor;
}

// Generate item graph based off of previous values.
let previousValue = 10;
function generateItem(ms) {
    let valueChange = getRandomValue();
    let nextValue = previousValue * valueChange;
    previousValue = nextValue;
    return {
        date: ms,
        value: truncate(nextValue)
    };
}

// Precision in ms.
const precisionFactor = 250;
const historyTime = (10 * 60 * 1000)
let previousDate = null;
export default () => {
    if (previousDate === null) {
        previousDate = Date.now() - historyTime;
    }

    const oldDate = previousDate;
    const newDate = Date.now();
    const dateDifference = newDate - oldDate;
    console.log(`Date difference: ${dateDifference}`);
    previousDate = newDate;

    let statistics = [];

    for (let ms = 0; ms < dateDifference; ms += precisionFactor) {
        let msec = oldDate + ms;
        let item = generateItem(msec);
        statistics.push(item);
    }

    return statistics;
}