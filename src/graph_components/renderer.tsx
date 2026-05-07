import { useEffect, useRef, useMemo } from "react";
import { DEFAULT_RECORD, useGraphContext, type GraphRecord, type GraphSetting, type GraphPoint, type MouseData, DEFAULT_MOUSE } from "./context";
import { 
    // GraphSettings, 
    GraphSliders 
} from "./settings";
import { binSearchIdx } from "../util/bin_search";
import { downsampleGraphPoints } from "./filter";

/**
 * @constant TAU Value of PI * 2. Use this to prevent calculating it every frame.
 */
const TAU = Math.PI * 2;

const DARK_MODE = window.matchMedia("(prefers-color-scheme: dark)").matches;

const DARKMODE_DEFAULT = `rgb(20, 20, 20)`;
const LIGHTMODE_DEFAULT = `rgb(255, 255, 255)`;

const NEGATIVE_COLOR = `rgb(220, 0, 0)`;
const POSITIVE_COLOR = `rgb(0, 220, 0)`;
const REGULAR_COLOR = `rgb(192, 157, 0)`;
const BACKGROUND_COLOR = DARK_MODE ? DARKMODE_DEFAULT : LIGHTMODE_DEFAULT;
const DRAWING_COLOR = DARK_MODE ? LIGHTMODE_DEFAULT : DARKMODE_DEFAULT;

const LMB_INDEX = 0;
const RMB_INDEX = 2;

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

    const graphX = 0;
    const graphW = canvas.width * graphSettings.widthModifier;
    const graphH = canvas.height * graphSettings.heightModifier;
    const graphY = (canvas.height - graphH) / 2;
    
    ctx.save();
    ctx.beginPath();
    ctx.rect(graphX, 0, graphW, canvas.height);
    ctx.clip();

    const graphB = canvas.height - graphY;
    const drawHeight = graphB - graphY;

    ctx.lineWidth = 2;
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(graphX, 0, graphW, canvas.height);

    // ctx.strokeStyle = DRAWING_COLOR;
    // ctx.beginPath();
    // ctx.moveTo(graphX, graphY);
    // ctx.lineTo(graphW, graphY);
    // ctx.stroke();
    // ctx.beginPath();
    // ctx.moveTo(graphX, graphB);
    // ctx.lineTo(graphW, graphB);
    // ctx.stroke();

    const minPoint = currentRecord.min;
    const maxPoint = currentRecord.max;

    const min = minPoint.value;
    const max = maxPoint.value;
    const range = max - min || 1;

    const from = graph[0].date;
    const till = graph[graph.length - 1].date;
    const time = till - from || 1;

    const startY = graphB - (graph[0].value - min) / range * drawHeight;

    const zeroY = graphB - (0 - min) / range * drawHeight;

    ctx.strokeStyle = NEGATIVE_COLOR;
    
    ctx.beginPath();
    ctx.moveTo(graphX, zeroY);
    ctx.lineTo(graphW, zeroY);
    ctx.stroke();

    ctx.lineWidth = 2;
    ctx.strokeStyle = NEGATIVE_COLOR;
    ctx.beginPath();
    const minPointX = (minPoint.date - from) / time * graphW;
    const minPointY = graphB - (minPoint.value - min) / range * drawHeight;
    ctx.arc(
        minPointX,
        minPointY,
        10, 0, TAU
    );
    ctx.moveTo(minPointX, minPointY);
    ctx.lineTo(graphW, minPointY);
    ctx.stroke();

    ctx.strokeStyle = POSITIVE_COLOR;
    ctx.beginPath();
    const maxPointX = (maxPoint.date - from) / time * graphW;
    const maxPointY = graphB - (maxPoint.value - min) / range * drawHeight;
    ctx.arc(
        maxPointX,
        maxPointY,
        10, 0, TAU
    );
    ctx.moveTo(maxPointX, maxPointY);
    ctx.lineTo(graphW, maxPointY);
    ctx.stroke();

    ctx.lineWidth = 1;
    ctx.strokeStyle = DRAWING_COLOR;
    ctx.beginPath();
    ctx.moveTo(graphX, startY);
    let graphLength = graph.length;
    for (let idx = 0; idx < graphLength; idx++) {
        const point = graph[idx];
        const x = (point.date - from) / time * graphW;
        const y = graphB - (point.value - min) / range * drawHeight;
        ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
};

const drawOverlay = (
    canvas: HTMLCanvasElement, 
    ctx: CanvasRenderingContext2D, 
    graphSettings: GraphSetting,
    currentRecord: GraphRecord,
) => {
    const overlayX = canvas.width * graphSettings.widthModifier;
    const overlayY = 0;

    const overlayW = canvas.width - overlayX;
    const overlayH = canvas.height - overlayY;

    const overlayR = overlayX + overlayW;
    const overlayB = overlayY + overlayH;

    const count = 30;

    const spacing = Math.floor(overlayB / count);
    const font = Math.floor(spacing * 0.9);

    ctx.save();

    ctx.lineWidth = 2;
    ctx.strokeStyle = DRAWING_COLOR;
    ctx.font = `${font}px Arial`;
    ctx.textAlign = "center";
    ctx.fillStyle = BACKGROUND_COLOR;

    ctx.fillRect(overlayX, 0, overlayW, canvas.height);

    ctx.beginPath();
    ctx.moveTo(overlayX, overlayY);
    ctx.lineTo(overlayX, overlayH);
    ctx.stroke();

    const fontPadding = font * 0.2;
    const middleX = overlayR - overlayW / 2;

    const graphH = canvas.height * graphSettings.heightModifier;
    const graphY = (canvas.height - graphH) / 2;
    const graphB = canvas.height - graphY;

    const min = currentRecord.min.value;
    const avg = currentRecord.avg;
    const max = currentRecord.max.value;

    const decimal = 2;
    // const textWidth = ctx.measureText(max.toFixed(decimal)).width;
    // if (textWidth > overlayW) {
    //     decimal = 2;
    // }

    const calculateValueFromY = (y: number) => {
        const difference = y - graphY;
        const totalRange = graphB - graphY;
        const normalized = difference / totalRange;
        return max - normalized * (max - min);
    }

    for (let i = 0; i <= count; i++) {

        const y = spacing + i * spacing;
        const value = calculateValueFromY(y);
        if (value >= 0) {
        //     ctx.fillStyle = NEGATIVE_COLOR;
        //     ctx.fillText("< 0", middleX, y - fontPadding);
        // } else {
            ctx.fillStyle = DRAWING_COLOR;
            ctx.fillText("€ " + value.toFixed(decimal), middleX, y - fontPadding);

            ctx.beginPath();
            ctx.moveTo(overlayX, y);
            ctx.lineTo(overlayR, y);
            ctx.stroke();
        }
    }
    
    const halfSpacing = spacing / 2;

    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(overlayX, graphY - halfSpacing, overlayW, spacing);
    ctx.fillRect(overlayX, canvas.height / 2 - halfSpacing, overlayW, spacing);
    ctx.fillRect(overlayX, graphB - halfSpacing, overlayW, spacing);

    ctx.strokeStyle = POSITIVE_COLOR;
    ctx.strokeRect(overlayX, graphY - halfSpacing, overlayW, spacing);
    ctx.strokeStyle = REGULAR_COLOR;
    ctx.strokeRect(overlayX, canvas.height / 2 - halfSpacing, overlayW, spacing);
    ctx.strokeStyle = NEGATIVE_COLOR;
    ctx.strokeRect(overlayX, graphB - halfSpacing, overlayW, spacing);

    ctx.fillStyle = DRAWING_COLOR;
    ctx.fillText("€ " + max.toFixed(decimal), middleX, graphY + halfSpacing - fontPadding);
    ctx.fillText("€ " + avg.toFixed(decimal), middleX, canvas.height / 2 + halfSpacing - fontPadding);
    ctx.fillText("€ " + min.toFixed(decimal), middleX, graphB + halfSpacing - fontPadding);

    ctx.textAlign = "left";

    ctx.restore();
}

const renderGraph= (
    canvas: HTMLCanvasElement, 
    ctx: CanvasRenderingContext2D, 
    graph: GraphPoint[],
    graphSettings: GraphSetting,
    currentRecord: GraphRecord,
) => {
    drawGraph(canvas, ctx, graph, graphSettings, currentRecord);
    drawOverlay(canvas, ctx, graphSettings, currentRecord);
}

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
        //allTimeRecord, 
        setAllTimeRecord,
        graphTimeLine, setGraphTimeLine,
        graphSettings, setGraphSettings,
        graphData, setGraphData,
        //mouseData, setMouseData
    } = useGraphContext();

    // Canvas to draw on.
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const mouseRef = useRef<MouseData>(DEFAULT_MOUSE);

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
        const fromDate = graphTimeLine.from ?? tillDate - graphTimeLine.diff;

        const tillIdx = findTillIdx(graphData, tillDate);
        const fromIdx = findFromIdx(graphData, fromDate);

        if (fromIdx >= tillIdx) return [[], DEFAULT_RECORD];

        const { result, record } = downsampleGraphPoints(graphData, fromIdx, tillIdx, graphSettings.pointCount);

        return [result,  record];
    }, [graphData, graphSettings, graphTimeLine]);

    // Only update the graph every X amount of ms.
    useEffect(() => {
        const objId = setInterval(() => {
            updateGraphData();
        }, 100);

        return () => clearInterval(objId);
    }, [apiLink]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const mouse = mouseRef.current;
        if (!mouse) return;

        const onMouseMove = (event: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouse.cursorX = event.clientX - rect.left;
            mouse.cursorY = event.clientY - rect.top;
        };

        const onMouseDown = (event: MouseEvent) => {
            if (event.button === LMB_INDEX) mouse.lmb = true;
            if (event.button === RMB_INDEX) mouse.rmb = true;
        };        

        const onMouseUp = (event: MouseEvent) => {
            if (event.button === LMB_INDEX) mouse.lmb = false;
            if (event.button === RMB_INDEX) mouse.rmb = false;
        };

        const onMouseScroll = (event: WheelEvent) => {
            mouse.scroll = event.deltaY;

            if (mouse.debounce !== null) {
                clearTimeout(mouse.debounce)
            }

            mouse.debounce = window.setTimeout(() => {
                mouse.scroll = 0;
            }, 100);
        }

        canvas.addEventListener("mousemove", onMouseMove);
        canvas.addEventListener("mousedown", onMouseDown);
        canvas.addEventListener("mouseup", onMouseUp);
        canvas.addEventListener("wheel", onMouseScroll);

        return () => {
            canvas.removeEventListener("mousemove", onMouseMove);
            canvas.removeEventListener("mousedown", onMouseDown);
            canvas.removeEventListener("mouseup", onMouseUp);
            canvas.removeEventListener("wheel", onMouseScroll);
        };
    }, []);

    useEffect(() => {
        let objId: number;
        const updateSettings = (_: any) => {
            //console.log(`X: ${mouseRef.current.cursorX}\nY: ${mouseRef.current.cursorY}`);

            const canvas = canvasRef.current;
            if (!canvas) return;

            const mouse = mouseRef.current;
            if (!mouse) return;

            const graphX = 0;
            const graphY = 0;
            const graphW = canvas.width * graphSettings.widthModifier;
            const graphH = canvas.height;

            const side =
                (graphW - graphX) * (mouse.cursorY - graphY) -
                (graphH - graphY) * (mouse.cursorX - graphX);

            let heightModifier = 0;
            // let timeModifier = 0;
            if (mouse.scroll !== 0) {
                if (side < 0) {
                    heightModifier = mouse.scroll * 0.00005;
                } else {
                    if (mouse.lmb) {

                    }
                }
            }     

            setGraphSettings(prev => {
                const minHeightMod = 0.100;
                const maxHeightMod = 0.970;
                const newHeightMod = Math.min(
                    maxHeightMod, Math.max(
                        minHeightMod, prev.heightModifier + heightModifier
                    )
                );
                
                return {
                    ...prev,
                    heightModifier: newHeightMod
                };
            });

            setGraphTimeLine(prev => {

                return {
                    ...prev
                };
            })

            objId = requestAnimationFrame(updateSettings);
        }

        objId = requestAnimationFrame(updateSettings);
        return () => cancelAnimationFrame(objId);
    }, []);
    
    // render graph
    useEffect(() => {
        if (graphView.length < 2) return;
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.height = window.innerHeight * 0.8 - graphSettings.heightPadding - 10;
        canvas.width = window.innerWidth - graphSettings.widthPadding - 10;
        
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        if (canvas.height < 300) {
            const x = canvas.width / 2;
            const y = canvas.height / 2;
            const t = "Canvas height is less then the minimum requirement.";

            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            ctx.fillText(t, x, y);
            return;
        };

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        renderGraph(canvas, ctx, graphView, graphSettings, currentRecord);
    }, [graphView]);

    // // debugging junk
    // const backLog = `Graph data point count: ${graphData.length}`;
    // const itemLog = `Points being rendered: ${graphView.length}`;
    // const allTimeLog = `allTimeRecord: ${JSON.stringify(allTimeRecord, null, 2)}`;
    // const currentLog = `currentRecord: ${JSON.stringify(currentRecord, null, 2)}`;

    // const formatTimestamp = (ms?: number) => {
    //     const date = new Date(ms ?? 0)
    //     return `${date.getFullYear()}-${(date.getMonth()+1)
    //         .toString().padStart(2,"0")}-${date.getDate()
    //         .toString().padStart(2,"0")} ${date.getHours()
    //         .toString().padStart(2,"0")}:${date.getMinutes()
    //         .toString().padStart(2,"0")}:${date.getSeconds()
    //         .toString().padStart(2,"0")}.${date.getMilliseconds()
    //         .toString().padStart(3,"0")}`;
    // }

    // const fromLog = `From: ${formatTimestamp(graphView[0]?.date ?? 0)}`
    // const tillLog = `Till: ${formatTimestamp(graphView[graphView.length - 1]?.date ?? 0)}`
    // const diffLog = `Time: ${JSON.stringify(graphTimeLine)}`

    // const mouseState = JSON.stringify(mouseRef.current);
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
                {/* <GraphSettings />
                <p>{apiLink}</p>
                <p>{mouseState}</p>
                <p>{backLog}</p>
                <p>{itemLog}</p>
                <p>{allTimeLog}</p>
                <p>{currentLog}</p>
                <p>{fromLog}</p>
                <p>{tillLog}</p>
                <p>{diffLog}</p>
                <ol>
                    {
                        graphView.map((item, index) => {
                            return <li key={index}>{item.value}</li>;
                        })
                    }
                </ol> */}
            </div>
        </>
    );
}