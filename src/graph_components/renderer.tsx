import { useEffect, useRef, useMemo } from "react";
import { DEFAULT_RECORD, useGraphContext, type GraphTimeLine, type GraphRecord, type GraphSetting, type GraphPoint } from "./context";
import { GraphSettings, GraphSliders } from "./settings";

function binSearch(
    data: number[],
    target: number,
    compare: (value: number, target: number) => boolean
) {
    let left = 0;
    let right = data.length - 1;
    let result = -1;

    while (left <= right) {
        const mid = (left + right) >> 1;
        const value = data[mid];

        if (compare(value, target)) {
            result = mid;
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    return Math.max(0, Math.min(result, data.length - 1));
}



// Main function to draw the graph itself.
const drawGraph = (
    canvas: HTMLCanvasElement, 
    ctx: CanvasRenderingContext2D, 
    graph: GraphPoint[],
    graphSettings: GraphSetting,
    currentRecord: GraphRecord,
    _timeLine: GraphTimeLine,
) => {

    const padding = canvas.height * graphSettings.chartPadding;

    const drawTop = padding;
    const drawBottom = canvas.height - padding;
    const drawHeight = drawBottom - drawTop;

    const min = currentRecord.min;
    const max = currentRecord.max;
    const range = max - min || 1;
    const stepSize = canvas.width / (graph.length - 1);

    const zeroY = drawBottom - ((0 - min) / range) * drawHeight;

    ctx.beginPath();
    ctx.moveTo(0, zeroY);
    ctx.lineTo(canvas.width, zeroY);
    ctx.stroke();

    ctx.stroke();
    ctx.beginPath();

    const startY = drawBottom - ((graph[0].value - min) / range) * drawHeight;
    ctx.moveTo(0, startY);

    graph.forEach((item, index) => {
        const x = index * stepSize;

        const normalized = (item.value - min) / range;
        const y = drawBottom - normalized * drawHeight;

        ctx.lineTo(x, y);
    });

    ctx.stroke();
}

type GraphRenderProps = {
    apiLink: string
}

export function GraphRenderer({ apiLink }: GraphRenderProps) {

    // import graph context.
    const {
        allTimeRecord, setAllTimeRecord,
        graphTimeLine, //setGraphTimeLine,
        graphSettings, //setGraphSettings
        graphData, setGraphData
    } = useGraphContext();
    //const [graphData, setGraphData] = useState([] as GraphPoint[]);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const updateGraphData = async () => {
        try {
            const result = await fetch(apiLink);
            const data: GraphPoint[] = await result.json();

            // Update the currentRecord records.
            setAllTimeRecord(prev => {
                let localMin = +Infinity;
                let localMax = -Infinity;

                for (let idx = 0; idx < data.length; idx++) {
                    const value = data[idx].value;
                    if (value < localMin) localMin = value;
                    if (value > localMax) localMax = value;
                }

                const min = Math.min(prev.min, localMin);
                const max = Math.max(prev.max, localMax);
                const avg = (min + max) / 2;

                return {min, avg, max}
            });

            setGraphData(prev => [...prev, ...data]);
        } catch (err) {
            console.error(`Failed to fetch graph data: '${err}'\nSource: '${apiLink}'`)
        }
    };

    const [graphView, currentRecord] = useMemo<[GraphPoint[], GraphRecord]>(() => {
        const zoomLevel = Math.max(1, graphSettings.zoomLevel);

        if (graphData.length <= 2) return [graphData, DEFAULT_RECORD];

        const baseThreshold = 1;
        const threshold = baseThreshold / zoomLevel;

        const dates = graphData.map(p => p.date);

        const fromDate = graphTimeLine.from ?? graphData[0].date;
        const tillDate = graphTimeLine.till ?? graphData[graphData.length - 1].date;

        const fromIdx = binSearch(dates, fromDate, (value, target) => value < target) + 1;
        const tillIdx = binSearch(dates, tillDate, (value, target) => value <= target);

        if (fromIdx >= tillIdx) return [graphData, DEFAULT_RECORD];

        let lastKept = graphData[fromIdx];
        const result: GraphPoint[] = [lastKept];

        let min = lastKept.value;//+Infinity;
        let max = lastKept.value;//-Infinity;

        for (let idx = fromIdx + 1; idx <= tillIdx; idx++) {
            const point = graphData[idx];

            const value = point.value;
            if (value < min) min = value;
            if (value > max) max = value;

            const delta = Math.abs(value - lastKept.value);

            if (delta > threshold) {
                result.push(point);
                lastKept = point;
            }
        }

        let avg = (min + max) / 2;

        // Include last point in range, unless we only have 1 point...
        if (result[result.length - 1] !== lastKept) {
            result.push(graphData[tillIdx]);
        }

        return [result,  {min, avg, max}];
    }, [graphData, graphSettings, graphTimeLine]);

    // Only update the graph every X amount of ms.
    useEffect(() => {
        const interval = setInterval(() => {
            updateGraphData();
        }, 100);

        return () => clearInterval(interval);
    }, [apiLink]);
    
    // render graph
    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        if (graphView.length < 2) return;
        
        if (!canvas) return;
        canvas.height = window.innerHeight * graphSettings.heightModifier;
        canvas.width = window.innerWidth * graphSettings.widthModifier;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawGraph(canvas, ctx, graphView, graphSettings, currentRecord, graphTimeLine);  
    }, [graphView, graphSettings, currentRecord, graphTimeLine]);

    // debugging junk
    const backLog = `Graph data backlog: ${graphData.length}`;
    const itemLog = `Items being rendered: ${graphView.length}`;
    const allTimeLog = `allTimeRecord: ${JSON.stringify(allTimeRecord, null, 2)}`;
    const currentLog = `currentRecord: ${JSON.stringify(currentRecord, null, 2)}`;

    const formatTimestamp = (ms?: number) => {
        const date = new Date(ms ?? 0)
        return `${date.getFullYear()}-${(date.getMonth()+1)
            .toString().padStart(2,"0")}-${date.getDate()
            .toString().padStart(2,"0")} ${date.getHours()
            .toString().padStart(2,"0")}:${date.getMinutes()
            .toString().padStart(2,"0")}:${date.getSeconds()
            .toString().padStart(2,"0")}.${date.getMilliseconds()
            .toString().padStart(3,"0")}`;
    }
    const fromLog = `From: ${formatTimestamp(graphTimeLine.from ?? graphData[0]?.date)}`
    const tillLog = `Till: ${formatTimestamp(graphTimeLine.till ?? graphData[graphData.length - 1]?.date)}`
    return (
        <>
            <canvas
                ref={canvasRef}
                style={{
                    border: "1px solid black"
                }}
            />
            <div>
                <GraphSliders />
                <GraphSettings />
                <p>{apiLink}</p>
                <p>{backLog}</p>
                <p>{itemLog}</p>
                <p>{allTimeLog}</p>
                <p>{currentLog}</p>
                <p>{fromLog}</p>
                <p>{tillLog}</p>
                <ol>
                    {
                        graphView.map((item, index) => {
                            return <li key={index}>{item.value}</li>;
                        })
                    }
                </ol>
            </div>
        </>
    );
}

