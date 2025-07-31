"use strict";

import powerbi from "powerbi-visuals-api";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import DataView = powerbi.DataView;

import * as React from "react";
import { createRoot, Root } from "react-dom/client";
import { DataEntryComponent } from "./DataEntryComponent";

export class Visual implements IVisual {
    private target: HTMLElement;
    private root: Root;

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;
        this.root = createRoot(this.target);
    }

    public update(options: VisualUpdateOptions): void {
        const dataView: DataView = options.dataViews?.[0];
        if (!dataView || !dataView.table || !dataView.table.rows.length) {
            this.clearVisual("No data available");
            return;
        }

        const columns = dataView.table.columns;
        const rows = dataView.table.rows;

        const columnNames = columns.map(col => col.displayName);

        const parsedData = rows.map(row =>
            Object.fromEntries(row.map((value, i) => [columnNames[i], value]))
        );

      this.root.render(<DataEntryComponent data={parsedData} columns={columnNames} />);

    }

    private clearVisual(message = "No data available"): void {
        this.target.innerHTML = `<div style="padding:8px;color:#888">${message}</div>`;
    }
}
