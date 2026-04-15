import { type GraphPoint, type GraphRecord } from "./context";

type filteredGraph = {
    result: GraphPoint[],
    record: GraphRecord,
}

function slicedGraphPoints(
    data: GraphPoint[],
    from: number,
    length: number
): filteredGraph {

    let min = +Infinity;
    let max = -Infinity;
    
    const result: GraphPoint[] = new Array(length);
    for (let idx = 0; idx < length; idx++) {
        const point = data[idx + from];
        const value = point.value;
        if (value < min) min = value;
        if (value > max) max = value;
        result[idx] = point;
    }

    let avg = (min + max) / 2;
    const record = {min, avg, max};
    return { result, record};
}

/**
 * Downsamples points from the Graph using the Largest Triangle Three Buckets Algortithm. 
 * 
 * @param data Array to sample
 * @param from First index of the array to sample.
 * @param till Last index of the array to sample.
 * @param size Size of the graph we want to draw.
 * @returns
 */
export function downsampleGraphPoints(
    data: GraphPoint[],
    from: number,
    till: number,
    size: number,
): filteredGraph {
    const visibleLength = till - from + 1;

    // Check if we should downsample
    if (size >= visibleLength || size === 0) return slicedGraphPoints(data, from, visibleLength);

    // Create GraphPoint[] result array
    const result = new Array<GraphPoint>(size);
    let sampledCount = 0;

    const bucketSize = (visibleLength - 2) / (size - 2);

    let previousSelectedIndex = from;

    result[sampledCount++] = data[previousSelectedIndex];

    let min = +Infinity;
    let max = -Infinity;

    for (let bucketIndex = 0; bucketIndex < size - 2; bucketIndex++) {

        let avgIndex = 0;
        let avgValue = 0;

        let nextStart = 
            Math.floor((bucketIndex + 1) * bucketSize) + from + 1;
        let nextEnd = 
            Math.floor((bucketIndex + 2) * bucketSize) + from + 1;

        if (nextEnd > till + 1) nextEnd = till + 1;

        const count = nextEnd - nextStart;

        for (let i = nextStart; i < nextEnd; i++) {
            avgIndex += i;
            avgValue += data[i].value;
        }

        if (0 < count) {
            avgIndex /= count;
            avgValue /= count;
        }

        let currentStart =
            Math.floor(bucketIndex * bucketSize) + from + 1;

        let currentEnd =
            Math.floor((bucketIndex + 1) * bucketSize) + from + 1;

        let maxArea = -1;
        let selectedIndex = currentStart;

        const prevIndex = previousSelectedIndex;
        const prevValue = data[prevIndex].value;

        for (let i = currentStart; i < currentEnd; i++) {
            const candidateValue = data[i].value;

            if (candidateValue < min) min = candidateValue;
            if (candidateValue > max) max = candidateValue;

            const area =
                (prevIndex - avgIndex) 
                * (candidateValue - prevValue)
                - (prevIndex - i)
                * (avgValue - prevValue);

            const absArea = area < 0 ? -area : area;

            if (absArea > maxArea) {
                maxArea = absArea;
                selectedIndex = i;
            }
        }

        result[sampledCount++] = data[selectedIndex];
        previousSelectedIndex = selectedIndex;

    }

    result[sampledCount++] = data[till];

    let avg = (min + max) / 2;
    const record = {min, avg, max};

    return { result, record };
}


// export function downsampleGraphPoints(
//     graphData: GraphPoint[],
//     fromIdx: number,
//     tillIdx: number,
//     zoomLvl: number,
// ): filteredGraph {

//     const zoomLevel = Math.max(1, zoomLvl);
//     const baseThreshold = 1;
//     const threshold = baseThreshold / zoomLevel;

//     let lastKept = graphData[fromIdx];
//     const result: GraphPoint[] = [lastKept];

//     let min = lastKept.value; //+Infinity;
//     let max = lastKept.value; //-Infinity;

//     for (let idx = fromIdx + 1; idx <= tillIdx; idx++) {
//         const point = graphData[idx];

//         const value = point.value;
//         if (value < min) min = value;
//         if (value > max) max = value;

//         const delta = Math.abs(value - lastKept.value);

//         //if (delta < threshold) continue;

//         result.push(point);
//         lastKept = point;
//     }

//     let avg = (min + max) / 2;

//     if (result[result.length - 1] !== lastKept) {
//         result.push(graphData[tillIdx]);
//     }   

//     return {
//         result,
//         record: {min, avg, max}
//     } 
// }