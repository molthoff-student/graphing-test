import { useEffect, useMemo } from "react";
import { useGraphContext } from "./context";

type GraphSliderData = {
    name: string,
    min: number,
    max: number,
    value: number,
    onChange: React.ChangeEventHandler<HTMLInputElement>,
}
export function GraphSliders() {
    const {
        graphTimeLine,
        setGraphTimeLine,
        graphData
    } = useGraphContext();

    const [min, max] = useMemo(() => {
        if (graphData.length < 2) return [0, 0];
        return [
            graphData[0].date,
            graphData[graphData.length - 1].date
        ];
    }, [graphData]);

    const tillValue = graphTimeLine.till ?? max;
    const diffValue = graphTimeLine.from !== null ? tillValue - graphTimeLine.from! : graphTimeLine.diff;
    const toggle = graphTimeLine.from !== null;

    const changeTill = (event: React.ChangeEvent<HTMLInputElement>) => {
        const num = Number(event.target.value);
        if (!Number.isFinite(num)) return;

        const newTill = num === max ? null : num;

        setGraphTimeLine(prev => {
            const till = newTill ?? max;

            const from = prev.from;
            const newFrom =
                from !== null
                    ? Math.max(min, till - prev.diff)
                    : null;

            return {
                ...prev,
                till: newTill,
                from: newFrom,
                diff: newFrom !== null
                    ? till - newFrom
                    : prev.diff
            };
        });
    };

    const changeDiff = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(event.target.value);
        if (!Number.isFinite(value)) return;

        setGraphTimeLine(prev => {
            const till = prev.till ?? max;

            const newFrom =
                prev.from !== null
                    ? Math.max(min, till - value)
                    : null;

            return {
                ...prev,
                diff: value,
                from: newFrom
            };
        });
    };

    useEffect(() => {
        if (graphTimeLine.from === null) return;

        const till = graphTimeLine.till ?? max;
        const expectedDiff = till - graphTimeLine.from;

        if (graphTimeLine.diff !== expectedDiff) {
        setGraphTimeLine(prev => ({
            ...prev,
            diff: till - prev.from!
        }));
        }
    }, [graphTimeLine.from, graphTimeLine.till, max]);

    const sliders: GraphSliderData[] = [
        {
            name: "Till",
            min,
            max,
            value: tillValue,
            onChange: changeTill
        },
        {
            name: "Diff",
            min: 0,
            max: Math.max(0, tillValue - min),
            value: diffValue,
            onChange: changeDiff
        }
    ];

    //console.log(JSON.stringify(graphTimeLine));

    return (
        <>
            {sliders.map((slider) => (
                <div key={slider.name}>
                    <label>{slider.name}</label>
                    <input
                        type="range"
                        min={slider.min}
                        max={slider.max}
                        value={slider.value}
                        onChange={slider.onChange}
                        style={{ width: "100%" }}
                    />
                </div>
            ))}

            <input
                type="checkbox"
                checked={toggle}
                onChange={(event) => {
                    const checked = event.target.checked;

                    setGraphTimeLine(prev => {
                        const till = prev.till ?? max;

                        const newFrom = checked
                            ? Math.max(min, till - prev.diff)
                            : null;

                        return {
                            ...prev,
                            from: newFrom,
                            diff: newFrom !== null
                                ? till - newFrom
                                : prev.diff
                        };
                    });
                }}
            />
        </>
    );
}
// export function GraphSliders() {
//     const {
//         graphTimeLine,
//         setGraphTimeLine,
//         graphData
//     } = useGraphContext();

//     const [min, max] = useMemo(() => {
//         if (graphData.length < 2) return [0, 0];
//         return [
//             graphData[0].date,
//             graphData[graphData.length - 1].date
//         ];
//     }, [graphData])

//     const tillValue = graphTimeLine.till ?? max;
//     const changeTill = (event: React.ChangeEvent<HTMLInputElement>) => {
//         const num = Number(event.target.value);
//         if (!Number.isFinite(num)) return;

//         const newTill = num === max ? null : num;

//         setGraphTimeLine(prev => {
//             const till = newTill ?? max;

//             return {
//                 ...prev,
//                 till: newTill,
//                 from: prev.from !== null
//                     ? Math.max(min, till - prev.diff)
//                     : prev.from
//             };
//         });
//     };

//     const toggle = graphTimeLine.from !== null;

//     const diffValue = graphTimeLine.diff;
//     const changeDiff = (event: React.ChangeEvent<HTMLInputElement>) => {
//         const value = Number(event.target.value);
//         if (!Number.isFinite(value)) return;

//         setGraphTimeLine(prev => {
//             const till = prev.till ?? max;

//             return {
//                 ...prev,
//                 diff: value,
//                 from: prev.from !== null
//                     ? Math.max(min, till - value)
//                     : prev.from
//             };
//         });
//     };

//     console.log(JSON.stringify(graphTimeLine));

//     const sliders: GraphSliderData[] = [
//         { name: "Till", min, max, value: tillValue, onChange: changeTill },
//         { name: "Diff", min: 0, max: Math.max(0, tillValue - min), value: diffValue, onChange: changeDiff }
//     ];

//     return (
//         <>
//             {sliders.map((slider) => {
//                 return (
//                     <div key={slider.name}>
//                         <label>{slider.name}</label>
//                         <input
//                             type="range"
//                             min={slider.min}
//                             max={slider.max}
//                             value={slider.value}
//                             onChange={slider.onChange}
//                             style={{ width: "100%" }}
//                         />
//                     </div>
//                 );
//             })}
//             <label></label>
//             <input
//                 type="checkbox"
//                 checked={toggle}
//                 onChange={(event) => {
//                     const checked = event.target.checked;

//                     setGraphTimeLine(prev => {
//                         const till = prev.till ?? max;

//                         return {
//                             ...prev,
//                             from: checked
//                                 ? Math.max(min, till - prev.diff)
//                                 : null
//                         };
//                     });
//                 }}
//             />
//         </>
//     );
// }


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