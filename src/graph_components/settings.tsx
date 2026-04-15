import { useEffect, useMemo, useState } from "react";
import { useGraphContext, type GraphTimeLine } from "./context";

export function GraphSliders() {
    const { 
        graphTimeLine, setGraphTimeLine,
        graphData
    } = useGraphContext();

    const [min, max] = useMemo<[number, number]>(() => {
        const n = graphData.length - 1;
        if (0 < n) {
            return [
                graphData[0].date, 
                graphData[n].date
            ];
        } else {
            return [0, 0];
        }
    }, [graphData]);

    const changeTimeLine = (
        key: keyof GraphTimeLine,
        value: number
    ) => {
        setGraphTimeLine(prev => {
            const next = { ...prev };
            next[key] = value;
            return next;
        });
    }

    const value = max > 0 ? graphTimeLine.time : 0;
    console.log(`value: ${value}`);
    return (
        <div>
            <input 
                min={min}
                max={max}
                value={value}
                onChange={(e) => {
                    let value = Number(e.target.value);
                    console.log(`onChange: ${value}`);
                    if (!Number.isFinite(value)) return;
                    changeTimeLine('time', value);
                }}
            />
        </div>
    );
}

export function GraphSettings() {
    const { graphSettings, setGraphSettings } = useGraphContext();

    const handleChange = (key: string, raw: unknown) => {
        const value = Number(raw);

        setGraphSettings(prev => {
            const next = { ...prev };

            // If invalid number, fallback safely instead of breaking state
            if (Number.isNaN(value)) return prev;

            next[key] = value;
            return next;
        });
    };

    const entries = Object.entries(graphSettings ?? {});


    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {entries.map(([key, value]) => {
                const safeValue =
                    typeof value === "number" && Number.isFinite(value)
                        ? value
                        : 0;

                return (
                    <div key={key} style={{ display: "flex", gap: "8px" }}>
                        <label style={{ minWidth: "120px" }}>{key}</label>

                        <input
                            type="number"
                            value={safeValue}
                            onChange={(e) =>
                                handleChange(key, e.target.value)
                            }
                        />
                    </div>
                );
            })}
        </div>
    );
}