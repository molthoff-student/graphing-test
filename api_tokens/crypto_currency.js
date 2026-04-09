// Generate random value between min and max.
const getRandomValue = () => {
    let multiplier = 1;

    const min = multiplier * -1;
    const max = multiplier;

    let value = Math.random() * (max - min) + min

    return value;
}

// Generate item graph based off of previous values.
let previousValue = 10;
function generateItem(ms) {
    let valueChange = getRandomValue();
    let nextValue = previousValue + valueChange;
    previousValue = nextValue;
    return {
        date: ms,
        value: previousValue
    };
}

// Precision in ms.
const precisionFactor = 1000;

let previousDate = null;
export default () => {
    if (previousDate === null) {
        previousDate = Date.now();
    }
    let newDate = Date.now();
    let dateDifference = newDate - previousDate;
    previousDate = newDate;

    let statistics = [];
    for (let ms = 0; ms < dateDifference; ms += precisionFactor) {
        let msec = previousDate + ms;
        let item = generateItem(msec);
        statistics.push(item);
    }

    return statistics
}