import type * as opts from '../node/types/options';
import type * as misc from '../node/types/misc';

export type FsLocation = [folder: string[], file: string];

/**
 * Adapter which implements synchronous calls to the FSA API.
 */
export interface FsaNodeSyncAdapterApi {
  stat(location: FsLocation): FsaNodeSyncAdapterStats;
  access(req: { filename: string; mode: number }): void;
  readFile(req: { filename: string; opts?: opts.IReadFileOptions }): Uint8Array;
  writeFile(req: { filename: string; data: Uint8Array; opts?: opts.IWriteFileOptions }): void;
  appendFile(req: { filename: string; data: Uint8Array; opts?: opts.IAppendFileOptions }): void;
  copy(req: { src: string; dst: string, flags?: number }): void;
  move(req: { src: string; dst: string }): void;
  rmdir(req: [filename: string, opts?: opts.IRmdirOptions]): void;
  rm(req: [filename: string, opts?: opts.IRmOptions]): void;
  mkdir(req: [filename: string, opts?: misc.TMode | opts.IMkdirOptions]): string | undefined;
}

export interface FsaNodeSyncAdapter {
  call<K extends keyof FsaNodeSyncAdapterApi>(
    method: K,
    payload: Parameters<FsaNodeSyncAdapterApi[K]>[0],
  ): ReturnType<FsaNodeSyncAdapterApi[K]>;
}

export interface FsaNodeSyncAdapterStats {
  kind: 'file' | 'directory';
  size?: number;
}
