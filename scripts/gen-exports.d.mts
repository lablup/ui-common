/** Types for the export-surface generator, so tests can import it. */

export declare const MIRROR_DIR: string;

export declare const MIRRORED_PACKAGES: readonly { name: string; prefix: string }[];

export type ExportTarget = string | { types: string; import: string };

export declare const OWN_EXPORTS: Record<string, ExportTarget>;

export interface GenerateResult {
  /** Repository-relative path to generated file content. */
  files: Map<string, string>;
  /** The complete `exports` map for package.json. */
  exports: Record<string, ExportTarget>;
  report: {
    /** Core root names left out because their subpath is excluded. */
    droppedFromRoot: string[];
    /** Deprecated custom names left out because Astryx owns the name. */
    legacyCollisions: string[];
  };
}

export declare function generate(): Promise<GenerateResult>;

/** Every file currently under MIRROR_DIR, repository-relative, sorted. */
export declare function listMirrorFiles(): Promise<string[]>;
