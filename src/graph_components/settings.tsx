import { useMemo } from "react";
import { useGraphContext } from "./context";

export function GraphSliders() {
    const { 
        graphTimeLine, setGraphTimeLine,
        graphData
     } = useGraphContext();

    const graphSize: number | null = useMemo<number | null>(() => {
        return 0;
    }, [graphTimeLine]);

    return (
        <div>

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