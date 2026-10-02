/** Types for the cascade layer order, so vite.config.ts and tests can import it. */

export declare const LAYER_ORDER: readonly string[];

export declare const LAYER_ORDER_STATEMENT: string;

export declare function withLayerOrder(css: string): string;

export declare function startsWithLayerOrder(css: string): boolean;

export declare function effectiveLayerOrder(css: string): string[];
