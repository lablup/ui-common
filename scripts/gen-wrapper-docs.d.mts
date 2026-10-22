/** Types for the wrapper-doc script, so tests can import it. */

/** The files it writes, by path from the repository root. */
export declare function wrapperDocFiles(): Promise<Record<string, string>>;
