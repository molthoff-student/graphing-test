import { useEffect, useRef, useMemo } from "react";
import { DEFAULT_RECORD, useGraphContext, type GraphRecord, type GraphSetting, type GraphPoint } from "./context";
import { GraphSettings, GraphSliders } from "./settings";
import { binSearchIdx } from "../util/bin_search";
import { downsampleGraphPoints } from "./filter";

/**
 * @constant TAU Value of PI * 2. Use this to prevent calculating it every frame.
 */
const TAU = Math.PI * 2;

function findTillIdx(data: GraphPoint[], date: number) { 
    return binSearchIdx<GraphPoint>(data, (item) => item.date <= date) 
}

function findFromIdx(data: GraphPoint[], date: number) { 
    return binSearchIdx<GraphPoint>(data, (item) => item.date < date) + 1;
}

const drawGraph = (
    canvas: HTMLCanvasElement, 
    ctx: CanvasRenderingContext2D, 
    graph: GraphPoint[],
    graphSettings: GraphSetting,
    currentRecord: GraphRecord,
) => {
    const padding = canvas.height * graphSettings.heightModifier;

    const drawTop = padding;
    const drawBottom = canvas.height - padding;
    const drawHeight = drawBottom - drawTop;

    const min = currentRecord.min.value;
    const max = currentRecord.max.value;
    const range = max - min || 1;

    const minTime = graph[0].date;
    const maxTime = graph[graph.length - 1].date;
    const timeRange = maxTime - minTime || 1;

    const startY = drawBottom - (graph[0].value - min) / range * drawHeight;

    ctx.lineWidth = 1;
    ctx.strokeStyle = "black";
    ctx.beginPath();
    ctx.moveTo(0, startY);
    let graphLength = graph.length;
    for (let idx = 0; idx < graphLength; idx++) {
        const point = graph[idx];
        const x = (point.date - minTime) / timeRange * canvas.width;
        const y = drawBottom - (point.value - min) / range * drawHeight;
        ctx.lineTo(x, y);
    }
    ctx.stroke();
};

const drawOverlay = (
    canvas: HTMLCanvasElement, 
    ctx: CanvasRenderingContext2D, 
    graph: GraphPoint[],
    graphSettings: GraphSetting,
    currentRecord: GraphRecord,
) => {

}

const renderGraph= (
    canvas: HTMLCanvasElement, 
    ctx: CanvasRenderingContext2D, 
    graph: GraphPoint[],
    graphSettings: GraphSetting,
    currentRecord: GraphRecord,
) => {
    const height = canvas.height;
    const width = canvas.width;
    ctx.save();
    ctx.beginPath();
    ctx.rect(
        0, 
        0, 
        width * graphSettings.widthModifier, 
        height
    );
    ctx.clip();
    drawGraph(canvas, ctx, graph, graphSettings, currentRecord);
    ctx.restore();

    drawOverlay(canvas, ctx, graph, graphSettings, currentRecord);
}


/**
 * 
 * @param canvas Canvas we draw on.
 * @param ctx 2D rendering context.
 * @param graph Graph points.
 * @param graphSettings Graph settings.
 * @param currentRecord Current record values.
 */
// const drawGraph = (
//     canvas: HTMLCanvasElement, 
//     ctx: CanvasRenderingContext2D, 
//     graph: GraphPoint[],
//     graphSettings: GraphSetting,
//     currentRecord: GraphRecord,
// ) => {

//     const padding = canvas.height * graphSettings.chartPadding;

//     const drawTop = padding;
//     const drawBottom = canvas.height - padding;
//     const drawHeight = drawBottom - drawTop;

//     const min = currentRecord.min.value;
//     const max = currentRecord.max.value;
//     const range = max - min || 1;

//     const minTime = graph[0].date;
//     const maxTime = graph[graph.length - 1].date;
//     const timeRange = maxTime - minTime || 1;

//     const pipePosX = canvas.width * graphSettings.widthModifier;

//     const drawRecord = (
//         point: GraphPoint,
//         style: string | CanvasGradient | CanvasPattern
//     ) => {
//         const x = (point.date - minTime) / timeRange * pipePosX;
//         const y = drawBottom - (point.value - min) / range * drawHeight;    
//         ctx.lineWidth = 5;
//         ctx.strokeStyle = style;
//         ctx.beginPath();
//         ctx.arc(point.date, point.value, 10, 0, TAU);
//         ctx.stroke();
//     }

//     const drawSeperator = (
//         y: number, 
//         style: string | CanvasGradient | CanvasPattern
//     ) => {
//         ctx.lineWidth = 2;
//         ctx.strokeStyle = style;
//         ctx.beginPath();
//         ctx.moveTo(0, y);
//         ctx.lineTo(pipePosX, y);
//         ctx.stroke();
//     }

//     const drawPipe = (
//         x: number,
//         style: string | CanvasGradient | CanvasPattern
//     ) => {
//         ctx.lineWidth = 2;
//         ctx.strokeStyle = style;
//         ctx.beginPath();
//         ctx.moveTo(x, 0);
//         ctx.lineTo(x, canvas.height);
//         ctx.stroke();        
//     }

//     const drawPoint = (point: GraphPoint) => {
//         const x = (point.date - minTime) / timeRange * pipePosX;
//         const y = drawBottom - (point.value - min) / range * drawHeight;
//         ctx.lineTo(point.date, point.value);
//     }

//     ctx.save()
//     ctx.beginPath();
//     ctx.rect(0, 0, pipePosX, canvas.height);
//     ctx.clip();

//     drawRecord(currentRecord.max, "green");
//     drawRecord(currentRecord.min, "red");    

//     const startY = drawBottom - (graph[0].value - min) / range * drawHeight;

//     ctx.lineWidth = 1;
//     ctx.strokeStyle = "black";
//     ctx.beginPath();
//     ctx.moveTo(0, startY);
//     let graphLength = graph.length;
//     for (let idx = 0; idx < graphLength; idx++) {
//         drawPoint(graph[idx]);
//     }
//     ctx.stroke();
//     const zeroY = drawBottom - (0 - min) / range * drawHeight;
//     drawSeperator(zeroY, "red");
//     const avgY = drawBottom - (currentRecord.avg - min) / range * drawHeight;
//     drawSeperator(avgY, "blue");
//     ctx.restore();
//     drawPipe(pipePosX, "black");
    
//     drawOverlay(canvas, ctx, graph, graphSettings, currentRecord);
// }

type GraphRenderProps = {
    apiLink: string
}
/**
 * 
 * @param apiLink link we want to fetch GraphPoint[] objects from. 
 * @returns 
 */
export function GraphRenderer({ apiLink }: GraphRenderProps) {

    // Import graph context.
    const {
        allTimeRecord, setAllTimeRecord,
        graphTimeLine, //setGraphTimeLine,
        graphSettings, //setGraphSettings
        graphData, setGraphData
    } = useGraphContext();

    // Canvas to draw on.
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const updateGraphData = async () => {
        try {
            const result = await fetch(apiLink);
            const data: GraphPoint[] = await result.json();

            // Update the currentRecord records.
            setAllTimeRecord(prev => {

                let record: GraphRecord = {
                    min: { date: 0, value: Infinity },
                    avg: 0,
                    max: { date: 0, value: -Infinity }
                };

                for (let idx = 0; idx < data.length; idx++) {
                    const point = data[idx];
                    const value = point.value;
                    if (value < record.min.value) record.min = point;
                    if (value > record.max.value) record.max = point;
                }

                record.min = prev.min.value < record.min.value ? prev.min : record.min;
                record.max = prev.max.value > record.max.value ? prev.max : record.max;
                record.avg = (record.min.value + record.max.value) / 2;

                //console.log(record);
                return record;
            });

            setGraphData(prev => {
                const prevLen = prev.length;
                const dataLen = data.length;
                const graph = new Array<GraphPoint>(prevLen + dataLen);
                                
                for (let idx = 0; idx < prevLen; idx ++) {
                    graph[idx] = prev[idx];
                }

                for (let idx = 0; idx < dataLen; idx++) {
                    graph[idx + prevLen] = data[idx];
                }

                return graph;
            });
        } catch (err) {
            console.error(`Failed to fetch graph data: '${err}'\nSource: '${apiLink}'`)
        }
    };

    const [graphView, currentRecord] = useMemo<[GraphPoint[], GraphRecord]>(() => {

        if (graphData.length <= 2) return [graphData, DEFAULT_RECORD];

        const tillDate = graphTimeLine.till ?? graphData[graphData.length - 1].date;
        const fromDate = tillDate - graphTimeLine.time;

        const tillIdx = findTillIdx(graphData, tillDate);
        const fromIdx = findFromIdx(graphData, fromDate);

        if (fromIdx >= tillIdx) return [[], DEFAULT_RECORD];

        const { result, record } = downsampleGraphPoints(graphData, fromIdx, tillIdx, graphSettings.zoomLevel);

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
        if (graphView.length < 2) return;
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.height = window.innerHeight - graphSettings.heightPadding - 10;
        canvas.width = window.innerWidth - graphSettings.widthPadding - 10;
        
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        renderGraph(canvas, ctx, graphView, graphSettings, currentRecord);  
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
                    border: "2px solid black"
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

