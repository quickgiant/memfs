export type AsyncCallback = (request: Uint8Array) => Promise<Uint8Array>;

const microSleepSync = () => {
  // Math.random();
};

const sleepUntilSync = (condition: () => boolean) => {
  while (!condition()) microSleepSync();
};

/**
 * `SyncMessenger` allows to execute asynchronous code synchronously. The
 * asynchronous code is executed in a Worker thread, while the main thread is
 * blocked until the asynchronous code is finished.
 *
 * First, four 4-byte works is the header, where the first word is used for Atomics
 * notifications. The second word is used for spin-locking the main thread until
 * the asynchronous code is finished. The third word is used to specify payload
 * length. The fourth word is currently unused.
 *
 * The maximum payload size is the size of the SharedArrayBuffer minus the
 * header size.
 */
export class SyncMessenger {
  protected readonly int32: Int32Array;
  protected readonly uint8: Uint8Array;
  protected readonly headerSize;
  protected readonly dataSize;

  public constructor(protected readonly sab: SharedArrayBuffer) {
    this.int32 = new Int32Array(sab);
    this.uint8 = new Uint8Array(sab);
    this.headerSize = 4 * 4;
    this.dataSize = sab.byteLength - this.headerSize;
  }

  public callSync(data: Uint8Array): Uint8Array {
    const requestLength = data.length;
    const headerSize = this.headerSize;
    const int32 = this.int32;
    int32[1] = 0;
    int32[2] = requestLength;
    this.uint8.set(data, headerSize);
    Atomics.notify(int32, 0);
    sleepUntilSync(() => int32[1] === 1);
    const responseLength = int32[2];
    const response = this.uint8.slice(headerSize, headerSize + responseLength);
    return response;
  }

  public serveAsync(callback: AsyncCallback): void {
    const headerSize = this.headerSize;
    (async () => {
      try {
        const int32 = this.int32;
        const res = Atomics.wait(int32, 0, 0);
        if (res !== 'ok') throw new Error(`Unexpected Atomics.wait result: ${res}`);
        const requestLength = this.int32[2];
        const request = this.uint8.slice(headerSize, headerSize + requestLength);
        const response = await callback(request);
        const responseLength = response.length;
        int32[2] = responseLength;
        this.uint8.set(response, headerSize);
        int32[1] = 1;
      } catch {}
      this.serveAsync(callback);
    })().catch(() => {});
  }
}
