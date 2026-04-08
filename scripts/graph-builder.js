import fs from "fs";
import path from "path";

const PATH = "C:/Users/mick_/Lokale bestanden/School/2026/VSCode/websites/graphing-test/src/assets/";
const NAME = "graph-test";

function createFile() {
    const arrayBegin = '[\n';
    const arrayEnd = ']';

    const file = path.join(PATH, NAME + ".json");
    const stream = fs.createWriteStream(file, {
        encoding: "utf8"
    });

    stream.write(arrayBegin);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const intervalMs = 1000;

    const precisionFactor = intervalMs / 1000;
    const getRandomValue = () => {
        const min = precisionFactor * -1;
        const max = precisionFactor;
        return Math.random() * (max - min) + min
    }

    const totalEntries = (24 * 60 * 60 * 1000) / intervalMs;

    console.log(`
Building chart array...
Generating ${totalEntries} entries.
Polling every ${intervalMs} milliseconds.
    `);

    let index = 0;
    let isWriting = true;

    let previousValue = getRandomValue();

    //while (index < totalEntries && isWriting) {
    while (isWriting) {
        const date = new Date(startOfDay.getTime() + index * intervalMs);

        const json = JSON.stringify({
            date: date.toISOString(),
            value: previousValue
        }, null, 2);

        previousValue = previousValue + getRandomValue();

        if (index < totalEntries - 1) {
            stream.write(json + ",\n");
        } else {
            stream.write(json + "\n");
            isWriting = false;
        }

        index++;
    }

    stream.write(arrayEnd);

    stream.end();

    stream.on("finish", () => {
        console.log(`File "${file}" has been written successfully.`);
    });

    stream.on("error", (err) => {
        console.error("Error writing file:", err);
    });
}

createFile();