import { createContext, useContext, useState, type Dispatch, type SetStateAction } from "react";

export type GraphPoint = {
    date: number,
    value: number,
}

export type GraphRecord = {
    min: GraphPoint,
    avg: number,
    max: GraphPoint,
}

export type GraphTimeLine = {
    from?: number;
    till?: number;
    diff: number;
}

export type GraphSetting = {
    pointCount: number,
    widthModifier: number,
    heightModifier: number,
    widthPadding: number,
    heightPadding: number,
}

export type MouseData = {
    debounce: number | null,
    cursorX: number,
    cursorY: number,
    scroll: number,
    lmb: boolean,
    rmb: boolean,
}

export type GraphInformation = {
    allTimeRecord: GraphRecord,
    graphTimeLine: GraphTimeLine,
    graphSettings: GraphSetting,
    graphData: GraphPoint[],
    //mouseData: MouseData,
};

export type GraphContextType = GraphInformation & {
    setAllTimeRecord: Dispatch<SetStateAction<GraphRecord>>;
    setGraphTimeLine: Dispatch<SetStateAction<GraphTimeLine>>;
    setGraphSettings: Dispatch<SetStateAction<GraphSetting>>;
    setGraphData: Dispatch<SetStateAction<GraphPoint[]>>;
    //setMouseData: Dispatch<SetStateAction<MouseData>>;
};

export function GraphContextProvider({ children }: any) {

    const [allTimeRecord, setAllTimeRecord] = useState<GraphRecord>(DEFAULT_RECORD);
    const [graphTimeLine, setGraphTimeLine] = useState<GraphTimeLine>(DEFAULT_DATES);
    const [graphSettings, setGraphSettings] = useState<GraphSetting>(DEFAULT_SETTINGS);
    const [graphData, setGraphData] = useState([] as GraphPoint[]);
    //const [mouseData, setMouseData] = useState<MouseData>(DEFAULT_MOUSE);

    return (
        <GraphContext.Provider
            value={{
                allTimeRecord, setAllTimeRecord,
                graphTimeLine, setGraphTimeLine,
                graphSettings, setGraphSettings,
                graphData, setGraphData,
                //mouseData, setMouseData
            }}
        >
            {children}
        </GraphContext.Provider>
    );
};

export const GraphContext = createContext<GraphContextType | null>(null);

export function useGraphContext() {
    const context = useContext(GraphContext);

    if (!context) {
        throw new Error(`useGraphContext must be used within GraphContextProvider`);
    }

    return context;
}

const SEC = 1000;
const MIN = SEC * 60;
const HRS = MIN * 60;
export const DEFAULT_DATES: GraphTimeLine = {
    from: null,
    diff: HRS,
    till: null,
};

export const DEFAULT_RECORD: GraphRecord = {
    min: { date: 0, value: +Infinity },
    avg: 0, 
    max: { date: 0, value: -Infinity }
}

export const DEFAULT_SETTINGS: GraphSetting = {
    pointCount: 2000,
    widthModifier: 0.8,
    heightModifier: 0.8,
    widthPadding: 10,
    heightPadding: 10,
}

export const DEFAULT_MOUSE: MouseData = {
    debounce: null,
    cursorX: 0,
    cursorY: 0,
    scroll: 0,
    lmb: false,
    rmb: false,
}