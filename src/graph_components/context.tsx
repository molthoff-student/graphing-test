import { createContext, useContext, useState, type Dispatch, type SetStateAction } from "react";

export type GraphPoint = {
    date: number,
    value: number,
}

export type GraphRecord = {
    max: number,
    min: number,
    avg: number,
}

export type GraphTimeLine = {
    from?: number,
    till?: number,
}

export type GraphSetting = {
    //pointCount: number,
    zoomLevel: number,
    widthModifier: number,
    heightModifier: number,
    chartPadding: number
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

export const DEFAULT_DATES: GraphTimeLine = {
    from: null,
    till: null
}

export const DEFAULT_RECORD: GraphRecord = {
    max: -Infinity, 
    min: +Infinity,
    avg: 0,
}

export const DEFAULT_SETTINGS: GraphSetting = {
    zoomLevel: 10000,
    widthModifier: 0.80,
    heightModifier: 1.00,
    chartPadding: 0.1
}