
export function binSearchIdx<T>(
    data: T[],
    compare: (item: T) => boolean
): number | null {
    // Can't search through an empty array.
    if (data.length <= 0) return null;

    let left = 0;
    let right = data.length - 1;
    let result = -1;

    //let iterations = 0;
    //let from = new Date().getMilliseconds();

    while (left <= right) {
        const mid = (left + right) >> 1;
        const item = data[mid];
        const cmp = compare(item);

        if (cmp) {
            result = mid;
            left = mid + 1;
        } else {
            right = mid - 1;
        }

        //iterations += 1;
    }

    //let till = new Date().getMilliseconds();
    //console.log(`binSearch iterations: ${iterations}\nTime: ${till - from}`);

    return Math.max(0, Math.min(result, data.length - 1));
}