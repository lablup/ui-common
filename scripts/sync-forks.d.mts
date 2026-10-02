/** Types for the fork upkeep script, so tests can import it. */

export interface ForkProvenance {
  /** The Astryx package the fork was taken from. */
  package: string;
  /** Its exact version at the time. */
  version: string;
  /** The upstream issue or pull request carrying the fix, if any. */
  upstream: string | null;
  /** Package-relative path to SHA-256 of every upstream file the fork uses. */
  files: Record<string, string>;
  /** The generated styles file and the compiled constants it copies. */
  styles?: { file: string; from: Array<{ file: string; consts: string[] }> };
}

export declare const PROVENANCE: string;

export declare function readProvenance(): Record<string, ForkProvenance>;

export declare function currentState(): Promise<
  Record<
    string,
    { version: string; files: Record<string, string | null>; styles?: string }
  >
>;

export declare function extractConst(source: string, name: string): string;
