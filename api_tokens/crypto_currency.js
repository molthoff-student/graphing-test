// Generate random value
let trend = 0.000001;
const getRandomValue = () => {
    const volatility = 0.02;

    // slowly changing trend
    //trend += (Math.random() - 0.5) * 0.001;

    const u = Math.random();
    const v = Math.random();
    const normal = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);

    return Math.exp(trend + normal * volatility);
};

// Generate item graph based off of previous values.
let previousValue = 10;
function generateItem(ms) {
    let valueChange = getRandomValue();
    let nextValue = previousValue * valueChange;
    previousValue = nextValue;
    return {
        date: ms,
        value: nextValue
    };
}

// Precision in ms.
const precisionFactor = 250;

let previousDate = null;
export default () => {
    if (previousDate === null) {
        previousDate = Date.now();
    }

    const oldDate = previousDate;
    const newDate = Date.now();
    const dateDifference = newDate - oldDate;

    previousDate = newDate;

    let statistics = [];

    for (let ms = 0; ms < dateDifference; ms += precisionFactor) {
        let msec = oldDate + ms;
        let item = generateItem(msec);
        statistics.push(item);
    }

    return statistics;
}