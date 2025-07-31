import * as React from "react";

type PrimitiveValue = string | number | boolean | null | undefined | Date;

interface Props {
    columns: string[];
    data: { [key: string]: PrimitiveValue }[];
}

const readonlyColumns = ["Stage", "Competitive Position"];

export const DataEntryComponent: React.FC<Props> = ({ columns, data }) => {
    const [tableData, setTableData] = React.useState(data);
    const [changes, setChanges] = React.useState<
        { key: string; column: string; value: number }[]
    >([]);
    const [status, setStatus] = React.useState<string>("");
    const [debugLogs, setDebugLogs] = React.useState<string[]>([]);

    const logToPanel = (msg: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setDebugLogs(prev => [...prev, `[${timestamp}] ${msg}`]);
        console.log(`[${timestamp}] ${msg}`);
    };

    const handleChange = (rowIdx: number, column: string, newValue: string) => {
        const parsed = parseFloat(newValue);
        if (isNaN(parsed)) return;

        const updatedRow = { ...tableData[rowIdx], [column]: parsed };
        const newData = [...tableData];
        newData[rowIdx] = updatedRow;
        setTableData(newData);

        const keyCols = readonlyColumns.map(col => updatedRow[col]).join("|");
        setChanges(prev => {
            const filtered = prev.filter(
                change => !(change.key === keyCols && change.column === column)
            );
            return [...filtered, { key: keyCols, column, value: parsed }];
        });
    };

    const handleSave = async () => {
        if (changes.length === 0) {
            logToPanel("⚠️ No changes to save.");
            return;
        }

        logToPanel(`📤 Sending ${changes.length} change(s) to API...`);

        try {
            const response = await fetch("http://127.0.0.1:4000/api/update-sql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(changes),
            });

            if (!response.ok) {
                const errorText = await response.text();
                logToPanel(`❌ Server error: ${response.status}`);
                logToPanel(`📩 Raw response: ${errorText}`);

                try {
                    const json = JSON.parse(errorText);
                    logToPanel(`📦 Server error message: ${JSON.stringify(json)}`);
                } catch {
                    logToPanel("⚠️ Response was not valid JSON.");
                }

                setStatus("❌ Failed to save changes");
            } else {
                const result = await response.json();
                logToPanel(`✅ Successfully saved. Server responded: ${JSON.stringify(result)}`);
                setStatus("✔️ Changes saved successfully.");
                setChanges([]);
            }

        } catch (err: any) {
            logToPanel("🚨 Fetch failed");
            logToPanel(err.message || "Unknown error occurred");

            if (err instanceof TypeError) {
                logToPanel("🌐 Network or CORS issue. Is the server running?");
            }

            setStatus("❌ Failed to reach server.");
        }
    };

    return (
        <div>
            {/* TABLE */}
            <div style={{ maxHeight: "400px", overflowY: "auto", overflowX: "auto", width: "100%" }}>
                <table style={{ borderCollapse: "collapse", width: "100%" }}>
                    <thead>
                        <tr>
                            {columns.map(col => (
                                <th key={col} style={{ border: "1px solid #ccc", padding: "8px" }}>
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.map((row, rowIdx) => (
                            <tr key={rowIdx}>
                                {columns.map(col => (
                                    <td key={col} style={{ border: "1px solid #ccc", padding: "8px" }}>
                                        {readonlyColumns.includes(col) ? (
                                            String(row[col] ?? "")
                                        ) : (
                                            <input
                                                type="number"
                                                value={
                                                    typeof row[col] === "number"
                                                        ? row[col]
                                                        : row[col] === null || row[col] === undefined
                                                            ? ""
                                                            : parseFloat(String(row[col])) || ""
                                                }
                                                onChange={(e) =>
                                                    handleChange(rowIdx, col, e.target.value)
                                                }
                                                style={{ width: "100%" }}
                                            />
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* BUTTON */}
            <button onClick={handleSave} style={{ marginTop: "10px", padding: "6px 12px" }}>
                Save
            </button>

            {/* STATUS */}
            {status && (
                <div
                    style={{
                        marginTop: "10px",
                        color: status.includes("✔️") ? "green" : "red",
                        fontWeight: "bold"
                    }}
                >
                    {status}
                </div>
            )}

            {/* DEBUG PANEL */}
            <div
                style={{
                    marginTop: "15px",
                    padding: "10px",
                    background: "#f7f7f7",
                    border: "1px solid #ddd",
                    maxHeight: "150px",
                    overflowY: "auto",
                    fontSize: "12px",
                    fontFamily: "monospace"
                }}
            >
                <strong>Debug Logs:</strong>
                <ul style={{ paddingLeft: "20px" }}>
                    {debugLogs.map((log, idx) => (
                        <li key={idx}>{log}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};
