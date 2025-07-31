import * as React from "react";
type PrimitiveValue = string | number | boolean | null | undefined | Date;
interface Props {
    columns: string[];
    data: {
        [key: string]: PrimitiveValue;
    }[];
}
export declare const DataEntryComponent: React.FC<Props>;
export {};
