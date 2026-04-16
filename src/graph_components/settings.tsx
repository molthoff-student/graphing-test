import { useMemo } from "react";
import { useGraphContext } from "./context";

export function GraphSliders() {
    const {
        graphTimeLine,
        setGraphTimeLine,
        graphData
    } = useGraphContext();

    const [min, max] = useMemo(() => {
        const n = graphData.length - 1;
        if (n < 0) return [0, 0];

        return [
            graphData[0].date,
            graphData[n].date
        ];
    }, [graphData]);

    const end = graphTimeLine.till ?? max;

    //const range = max - min;

    const maxLookback = Math.max(0, end - min);

    const isLive = graphTimeLine.till === null;

    const lookbackValue = Math.min(
        graphTimeLine.time,
        maxLookback
    );

    const onLookbackChange = (e) => {
        const next = Number(e.target.value);

        setGraphTimeLine(prev => ({
            ...prev,
            time: Math.min(next, maxLookback)
        }));
    };

    const tillValue = end;

    const onTillChange = (e) => {
        const nextTill = Number(e.target.value);

        setGraphTimeLine(prev => ({
            ...prev,
            till: nextTill
        }));
    };

    const toggleLive = (checked) => {
        setGraphTimeLine(prev => ({
            ...prev,
            till: checked ? null : max
        }));
    };

    return (
        <div
        style={{
            display: "grid",
            gridTemplateColumns: "2fr 2fr auto",
            gap: 12,
            alignItems: "center"
        }}
        >
        {/* LOOKBACK SLIDER */}
        <div>
            <label>Zoom</label>
            <input
                type="range"
                min={0}
                max={maxLookback}
                value={lookbackValue}
                onChange={onLookbackChange}
                style={{ width: "100%" }}
            />
        </div>

        {/* TILL SLIDER */}
        <div>
            <label>Till</label>
            <input
                type="range"
                min={min}
                max={max}
                value={tillValue}
                onChange={onTillChange}
                style={{ width: "100%" }}
            />
        </div>

        {/* LIVE CHECKBOX */}
        <label style={{ whiteSpace: "nowrap" }}>
            <input
                type="checkbox"
                checked={isLive}
                onChange={(e) => toggleLive(e.target.checked)}
            />
            Live
        </label>
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