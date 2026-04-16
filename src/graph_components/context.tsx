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
    time?: number,
    till?: number,
}

export type GraphSetting = {
    //pointCount: number,
    zoomLevel: number,
    widthModifier: number,
    heightModifier: number,
    widthPadding: number,
    heightPadding: number,
    //chartPadding: number
}

export type GraphInformation = {
    allTimeRecord: GraphRecord,
    graphTimeLine: GraphTimeLine,
    graphSettings: GraphSetting,
    graphData: GraphPoint[],
};

export type GraphContextType = GraphInformation & {
    setAllTimeRecord: Dispatch<SetStateAction<GraphRecord>>;
    setGraphTimeLine: Dispatch<SetStateAction<GraphTimeLine>>;
    setGraphSettings: Dispatch<SetStateAction<GraphSetting>>;
    setGraphData: Dispatch<SetStateAction<GraphPoint[]>>;
};

export function GraphContextProvider({ children }: any) {

    const [allTimeRecord, setAllTimeRecord] = useState<GraphRecord>(DEFAULT_RECORD);
    const [graphTimeLine, setGraphTimeLine] = useState<GraphTimeLine>(DEFAULT_DATES);
    const [graphSettings, setGraphSettings] = useState<GraphSetting>(DEFAULT_SETTINGS);
    const [graphData, setGraphData] = useState([] as GraphPoint[]);

    return (
        <GraphContext.Provider
            value={{
                allTimeRecord, setAllTimeRecord,
                graphTimeLine, setGraphTimeLine,
                graphSettings, setGraphSettings,
                graphData, setGraphData
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
    time: HRS,
    till: null
}

export const DEFAULT_RECORD: GraphRecord = {
    min: { date: 0, value: +Infinity },
    avg: 0, 
    max: { date: 0, value: -Infinity }
}

export const DEFAULT_SETTINGS: GraphSetting = {
    zoomLevel: 2000,
    widthModifier: 0.80,
    heightModifier: 0.1,
    widthPadding: 10,
    heightPadding: 10,
}