import { useEffect, useRef, useMemo } from "react";
import { DEFAULT_RECORD, useGraphContext, type GraphRecord, type GraphSetting, type GraphPoint } from "./context";
import { GraphSettings, GraphSliders } from "./settings";
import { binSearchIdx } from "../util/bin_search";
import { downsampleGraphPoints } from "./filter";

// Helper function to find the index of the GraphPoint with the Date we want to render Till.
function findTillIdx(data: GraphPoint[], target: number) { 
    return binSearchIdx<GraphPoint>(data, (item) => item.date <= target) 
}
// Helper function to find the index of the GraphPoint with the Date we want to render From.
function findFromIdx(data: GraphPoint[], target: number) { 
    return binSearchIdx<GraphPoint>(data, (item) => item.date < target) + 1;
}

// Main function to draw the graph itself.
const drawGraph = (
    canvas: HTMLCanvasElement, 
    ctx: CanvasRenderingContext2D, 
    graph: GraphPoint[],
    graphSettings: GraphSetting,
    currentRecord: GraphRecord,
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

    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, zeroY);
    ctx.lineTo(canvas.width, zeroY);
    ctx.stroke();

    ctx.stroke();
    ctx.beginPath();

    const startY = drawBottom - ((graph[0].value - min) / range) * drawHeight;
    ctx.moveTo(0, startY);

    const minTime = graph[0].date;
    const maxTime = graph[graph.length - 1].date;
    const timeRange = maxTime - minTime || 1;

    graph.forEach((item, index) => {

        // const n = (item.value - min) / range;
        // const x = index * stepSize;
        // const y = drawBottom - n * drawHeight;

        const n = (item.value - min) / range;
        const x = ((item.date - minTime) / timeRange) * canvas.width;
        const y = drawBottom - n * drawHeight;

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

        if (graphData.length <= 2) return [graphData, DEFAULT_RECORD];

        const dates = graphData.map(p => p.date);

        const tillDate = graphTimeLine.till ?? graphData[graphData.length - 1].date;
        const fromDate = tillDate - graphTimeLine.time;

        const tillIdx = findTillIdx(graphData, tillDate);
        const fromIdx = findFromIdx(graphData, fromDate);

        if (fromIdx >= tillIdx) return [graphData, DEFAULT_RECORD];

        const { result, record } = downsampleGraphPoints(graphData, fromIdx, tillIdx, 2000);

        return [result,  record];
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

        drawGraph(canvas, ctx, graphView, graphSettings, currentRecord);  
    }, [graphView, graphSettings, currentRecord, graphTimeLine]);

    // debugging junk
    const backLog = `Graph data point count: ${graphData.length}`;
    const itemLog = `Points being rendered: ${graphView.length}`;
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
    
    const fromLog = `From: ${formatTimestamp(graphView[0]?.date ?? 0)}`
    const tillLog = `Till: ${formatTimestamp(graphView[graphView.length - 1]?.date ?? 0)}`
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

