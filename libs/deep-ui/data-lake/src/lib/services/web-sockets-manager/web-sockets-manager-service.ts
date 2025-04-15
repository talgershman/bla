import {HttpClient} from '@angular/common/http';
import {inject} from '@angular/core';
import {UrlBuilderService} from 'deep-ui/shared/core';
import {Observable} from 'rxjs';
import {delay, map, tap} from 'rxjs/operators';
import {webSocket, WebSocketSubject} from 'rxjs/webSocket';

const INPUT_ERROR = 'input is invalid type';

const HEX_CHARS: string[] = '0123456789abcdef'.split('');
function formatMessage(message: any): [string | Uint8Array, boolean] {
  const type = typeof message;
  if (type === 'string') {
    return [message, true];
  }
  if (type !== 'object' || message === null) {
    throw new Error(INPUT_ERROR);
  }
  if (message.constructor === ArrayBuffer) {
    return [new Uint8Array(message), false];
  }
  if (!Array.isArray(message) && !ArrayBuffer.isView(message)) {
    throw new Error(INPUT_ERROR);
  }
  return [message as string | Uint8Array, false];
}

export class Sha1 {
  private readonly FINALIZE_ERROR: string = 'finalize already called';
  private readonly EXTRA: number[] = [-2147483648, 8388608, 32768, 128];
  private readonly SHIFT: number[] = [24, 16, 8, 0];
  private readonly blocks: number[] = [];
  private h0: number;
  private h1: number;
  private h2: number;
  private h3: number;
  private h4: number;
  private block: number;
  private start: number;
  private bytes: number;
  private hBytes: number;
  private finalized: boolean;
  private hashed: boolean;
  private lastByteIndex: number;

  constructor() {
    this.blocks = new Array<number>(16).fill(0);

    this.h0 = 0x67452301;
    this.h1 = 0xefcdab89;
    this.h2 = 0x98badcfe;
    this.h3 = 0x10325476;
    this.h4 = 0xc3d2e1f0;

    this.block = this.start = this.bytes = this.hBytes = 0;
    this.finalized = this.hashed = false;
  }

  updateObjectToHex(obj: any): string {
    return this.update(JSON.stringify(obj)).hex();
  }

  update(message: any): Sha1 {
    if (this.finalized) {
      throw new Error(this.FINALIZE_ERROR);
    }

    const result: [string | Uint8Array, boolean] = formatMessage(message);
    message = result[0];
    const isString: boolean = result[1];
    let code: number,
      index = 0,
      i: number;
    const length: number = message.length || 0,
      blocks: number[] = this.blocks;

    while (index < length) {
      if (this.hashed) {
        this.hashed = false;
        blocks[0] = this.block;
        this.block =
          blocks[16] =
          blocks[1] =
          blocks[2] =
          blocks[3] =
          blocks[4] =
          blocks[5] =
          blocks[6] =
          blocks[7] =
          blocks[8] =
          blocks[9] =
          blocks[10] =
          blocks[11] =
          blocks[12] =
          blocks[13] =
          blocks[14] =
          blocks[15] =
            0;
      }

      if (isString) {
        for (i = this.start; index < length && i < 64; ++index) {
          code = message.charCodeAt(index);
          if (code < 0x80) {
            blocks[i >>> 2] |= code << this.SHIFT[i++ & 3];
          } else if (code < 0x800) {
            blocks[i >>> 2] |= (0xc0 | (code >>> 6)) << this.SHIFT[i++ & 3];
            blocks[i >>> 2] |= (0x80 | (code & 0x3f)) << this.SHIFT[i++ & 3];
          } else if (code < 0xd800 || code >= 0xe000) {
            blocks[i >>> 2] |= (0xe0 | (code >>> 12)) << this.SHIFT[i++ & 3];
            blocks[i >>> 2] |= (0x80 | ((code >>> 6) & 0x3f)) << this.SHIFT[i++ & 3];
            blocks[i >>> 2] |= (0x80 | (code & 0x3f)) << this.SHIFT[i++ & 3];
          } else {
            code = 0x10000 + (((code & 0x3ff) << 10) | (message.charCodeAt(++index) & 0x3ff));
            blocks[i >>> 2] |= (0xf0 | (code >>> 18)) << this.SHIFT[i++ & 3];
            blocks[i >>> 2] |= (0x80 | ((code >>> 12) & 0x3f)) << this.SHIFT[i++ & 3];
            blocks[i >>> 2] |= (0x80 | ((code >>> 6) & 0x3f)) << this.SHIFT[i++ & 3];
            blocks[i >>> 2] |= (0x80 | (code & 0x3f)) << this.SHIFT[i++ & 3];
          }
        }
      } else {
        for (i = this.start; index < length && i < 64; ++index) {
          blocks[i >>> 2] |= message[index] << this.SHIFT[i++ & 3];
        }
      }

      this.lastByteIndex = i;
      this.bytes += i - this.start;
      if (i >= 64) {
        this.block = blocks[16];
        this.start = i - 64;
        this._hash();
        this.hashed = true;
      } else {
        this.start = i;
      }
    }
    if (this.bytes > 4294967295) {
      this.hBytes += (this.bytes / 4294967296) << 0;
      this.bytes = this.bytes % 4294967296;
    }
    return this;
  }

  finalize(): void {
    if (this.finalized) {
      return;
    }
    this.finalized = true;
    const blocks: number[] = this.blocks,
      i: number = this.lastByteIndex;
    blocks[16] = this.block;
    blocks[i >>> 2] |= this.EXTRA[i & 3];
    this.block = blocks[16];
    if (i >= 56) {
      if (!this.hashed) {
        this._hash();
      }
      blocks[0] = this.block;
      blocks[16] =
        blocks[1] =
        blocks[2] =
        blocks[3] =
        blocks[4] =
        blocks[5] =
        blocks[6] =
        blocks[7] =
        blocks[8] =
        blocks[9] =
        blocks[10] =
        blocks[11] =
        blocks[12] =
        blocks[13] =
        blocks[14] =
        blocks[15] =
          0;
    }
    blocks[14] = (this.hBytes << 3) | (this.bytes >>> 29);
    blocks[15] = this.bytes << 3;
    this._hash();
  }

  hex(): string {
    this.finalize();

    const h0: number = this.h0,
      h1: number = this.h1,
      h2: number = this.h2,
      h3: number = this.h3,
      h4: number = this.h4;

    return (
      HEX_CHARS[(h0 >>> 28) & 0x0f] +
      HEX_CHARS[(h0 >>> 24) & 0x0f] +
      HEX_CHARS[(h0 >>> 20) & 0x0f] +
      HEX_CHARS[(h0 >>> 16) & 0x0f] +
      HEX_CHARS[(h0 >>> 12) & 0x0f] +
      HEX_CHARS[(h0 >>> 8) & 0x0f] +
      HEX_CHARS[(h0 >>> 4) & 0x0f] +
      HEX_CHARS[h0 & 0x0f] +
      HEX_CHARS[(h1 >>> 28) & 0x0f] +
      HEX_CHARS[(h1 >>> 24) & 0x0f] +
      HEX_CHARS[(h1 >>> 20) & 0x0f] +
      HEX_CHARS[(h1 >>> 16) & 0x0f] +
      HEX_CHARS[(h1 >>> 12) & 0x0f] +
      HEX_CHARS[(h1 >>> 8) & 0x0f] +
      HEX_CHARS[(h1 >>> 4) & 0x0f] +
      HEX_CHARS[h1 & 0x0f] +
      HEX_CHARS[(h2 >>> 28) & 0x0f] +
      HEX_CHARS[(h2 >>> 24) & 0x0f] +
      HEX_CHARS[(h2 >>> 20) & 0x0f] +
      HEX_CHARS[(h2 >>> 16) & 0x0f] +
      HEX_CHARS[(h2 >>> 12) & 0x0f] +
      HEX_CHARS[(h2 >>> 8) & 0x0f] +
      HEX_CHARS[(h2 >>> 4) & 0x0f] +
      HEX_CHARS[h2 & 0x0f] +
      HEX_CHARS[(h3 >>> 28) & 0x0f] +
      HEX_CHARS[(h3 >>> 24) & 0x0f] +
      HEX_CHARS[(h3 >>> 20) & 0x0f] +
      HEX_CHARS[(h3 >>> 16) & 0x0f] +
      HEX_CHARS[(h3 >>> 12) & 0x0f] +
      HEX_CHARS[(h3 >>> 8) & 0x0f] +
      HEX_CHARS[(h3 >>> 4) & 0x0f] +
      HEX_CHARS[h3 & 0x0f] +
      HEX_CHARS[(h4 >>> 28) & 0x0f] +
      HEX_CHARS[(h4 >>> 24) & 0x0f] +
      HEX_CHARS[(h4 >>> 20) & 0x0f] +
      HEX_CHARS[(h4 >>> 16) & 0x0f] +
      HEX_CHARS[(h4 >>> 12) & 0x0f] +
      HEX_CHARS[(h4 >>> 8) & 0x0f] +
      HEX_CHARS[(h4 >>> 4) & 0x0f] +
      HEX_CHARS[h4 & 0x0f]
    );
  }

  toString(): string {
    return this.hex();
  }

  digest(): number[] {
    this.finalize();

    const h0: number = this.h0,
      h1: number = this.h1,
      h2: number = this.h2,
      h3: number = this.h3,
      h4: number = this.h4;

    return [
      (h0 >>> 24) & 0xff,
      (h0 >>> 16) & 0xff,
      (h0 >>> 8) & 0xff,
      h0 & 0xff,
      (h1 >>> 24) & 0xff,
      (h1 >>> 16) & 0xff,
      (h1 >>> 8) & 0xff,
      h1 & 0xff,
      (h2 >>> 24) & 0xff,
      (h2 >>> 16) & 0xff,
      (h2 >>> 8) & 0xff,
      h2 & 0xff,
      (h3 >>> 24) & 0xff,
      (h3 >>> 16) & 0xff,
      (h3 >>> 8) & 0xff,
      h3 & 0xff,
      (h4 >>> 24) & 0xff,
      (h4 >>> 16) & 0xff,
      (h4 >>> 8) & 0xff,
      h4 & 0xff,
    ];
  }

  array(): number[] {
    return this.digest();
  }

  private _hash(): void {
    let a: number = this.h0,
      b: number = this.h1,
      c: number = this.h2,
      d: number = this.h3,
      e: number = this.h4;
    let f: number, j: number, t: number;
    const blocks: number[] = this.blocks;

    for (j = 16; j < 80; ++j) {
      t = blocks[j - 3] ^ blocks[j - 8] ^ blocks[j - 14] ^ blocks[j - 16];
      blocks[j] = (t << 1) | (t >>> 31);
    }

    for (j = 0; j < 20; j += 5) {
      f = (b & c) | (~b & d);
      t = (a << 5) | (a >>> 27);
      e = (t + f + e + 1518500249 + blocks[j]) << 0;
      b = (b << 30) | (b >>> 2);

      f = (a & b) | (~a & c);
      t = (e << 5) | (e >>> 27);
      d = (t + f + d + 1518500249 + blocks[j + 1]) << 0;
      a = (a << 30) | (a >>> 2);

      f = (e & a) | (~e & b);
      t = (d << 5) | (d >>> 27);
      c = (t + f + c + 1518500249 + blocks[j + 2]) << 0;
      e = (e << 30) | (e >>> 2);

      f = (d & e) | (~d & a);
      t = (c << 5) | (c >>> 27);
      b = (t + f + b + 1518500249 + blocks[j + 3]) << 0;
      d = (d << 30) | (d >>> 2);

      f = (c & d) | (~c & e);
      t = (b << 5) | (b >>> 27);
      a = (t + f + a + 1518500249 + blocks[j + 4]) << 0;
      c = (c << 30) | (c >>> 2);
    }

    for (; j < 40; j += 5) {
      f = b ^ c ^ d;
      t = (a << 5) | (a >>> 27);
      e = (t + f + e + 1859775393 + blocks[j]) << 0;
      b = (b << 30) | (b >>> 2);

      f = a ^ b ^ c;
      t = (e << 5) | (e >>> 27);
      d = (t + f + d + 1859775393 + blocks[j + 1]) << 0;
      a = (a << 30) | (a >>> 2);

      f = e ^ a ^ b;
      t = (d << 5) | (d >>> 27);
      c = (t + f + c + 1859775393 + blocks[j + 2]) << 0;
      e = (e << 30) | (e >>> 2);

      f = d ^ e ^ a;
      t = (c << 5) | (c >>> 27);
      b = (t + f + b + 1859775393 + blocks[j + 3]) << 0;
      d = (d << 30) | (d >>> 2);

      f = c ^ d ^ e;
      t = (b << 5) | (b >>> 27);
      a = (t + f + a + 1859775393 + blocks[j + 4]) << 0;
      c = (c << 30) | (c >>> 2);
    }

    for (; j < 60; j += 5) {
      f = (b & c) | (b & d) | (c & d);
      t = (a << 5) | (a >>> 27);
      e = (t + f + e - 1894007588 + blocks[j]) << 0;
      b = (b << 30) | (b >>> 2);

      f = (a & b) | (a & c) | (b & c);
      t = (e << 5) | (e >>> 27);
      d = (t + f + d - 1894007588 + blocks[j + 1]) << 0;
      a = (a << 30) | (a >>> 2);

      f = (e & a) | (e & b) | (a & b);
      t = (d << 5) | (d >>> 27);
      c = (t + f + c - 1894007588 + blocks[j + 2]) << 0;
      e = (e << 30) | (e >>> 2);

      f = (d & e) | (d & a) | (e & a);
      t = (c << 5) | (c >>> 27);
      b = (t + f + b - 1894007588 + blocks[j + 3]) << 0;
      d = (d << 30) | (d >>> 2);

      f = (c & d) | (c & e) | (d & e);
      t = (b << 5) | (b >>> 27);
      a = (t + f + a - 1894007588 + blocks[j + 4]) << 0;
      c = (c << 30) | (c >>> 2);
    }

    for (; j < 80; j += 5) {
      f = b ^ c ^ d;
      t = (a << 5) | (a >>> 27);
      e = (t + f + e - 899497514 + blocks[j]) << 0;
      b = (b << 30) | (b >>> 2);

      f = a ^ b ^ c;
      t = (e << 5) | (e >>> 27);
      d = (t + f + d - 899497514 + blocks[j + 1]) << 0;
      a = (a << 30) | (a >>> 2);

      f = e ^ a ^ b;
      t = (d << 5) | (d >>> 27);
      c = (t + f + c - 899497514 + blocks[j + 2]) << 0;
      e = (e << 30) | (e >>> 2);

      f = d ^ e ^ a;
      t = (c << 5) | (c >>> 27);
      b = (t + f + b - 899497514 + blocks[j + 3]) << 0;
      d = (d << 30) | (d >>> 2);

      f = c ^ d ^ e;
      t = (b << 5) | (b >>> 27);
      a = (t + f + a - 899497514 + blocks[j + 4]) << 0;
      c = (c << 30) | (c >>> 2);
    }

    this.h0 = (this.h0 + a) << 0;
    this.h1 = (this.h1 + b) << 0;
    this.h2 = (this.h2 + c) << 0;
    this.h3 = (this.h3 + d) << 0;
    this.h4 = (this.h4 + e) << 0;
  }
}

export abstract class WebSocketsManagerService<Req, Res> {
  activeConnectionsMap = new Map<string, {connection: WebSocketSubject<any>; results: Res}>();

  protected abstract baseUrl: string;
  protected httpClient = inject(HttpClient);
  protected urlBuilderService = inject(UrlBuilderService);

  connect(req: Req, fromCache = false): Observable<any> {
    const id = this._getQueryId(req);
    let connection$: WebSocketSubject<any>;
    const cacheValue = this.activeConnectionsMap.get(id);
    if (fromCache && cacheValue) {
      connection$ = this.activeConnectionsMap.get(id).connection;
    } else {
      connection$ = webSocket({
        url: this.baseUrl,
      });
    }
    if (!fromCache || !cacheValue?.results) {
      this.activeConnectionsMap.set(id, {
        connection: connection$,
        results: null,
      });
    }
    return connection$.pipe(
      delay(300),
      map((data: Res) => this.mapResponse(req, data)),
      tap((res: Res) => {
        this.activeConnectionsMap.set(id, {
          connection: connection$,
          results: res,
        });
      }),
    );
  }

  send(req: Req, fromCache = false): Res {
    const savedConnection = this.getConnection(req);
    if (fromCache && this.checkResponseStatusIsOK(savedConnection)) {
      return savedConnection.results;
    }
    if (savedConnection.connection) {
      savedConnection.connection.next(req);
    } else {
      throw new Error('Did not send data, unable to open connection');
    }
    return null;
  }

  closeConnection(req: Req): void {
    const id = this._getQueryId(req);
    const savedConnection = this.getConnection(req, id);
    if (savedConnection?.connection) {
      savedConnection.connection.complete();
      savedConnection.connection = null;
      this.activeConnectionsMap.delete(id);
    }
  }

  getConnection(req: Req, byId = ''): {connection: WebSocketSubject<any>; results: Res} {
    if (byId) {
      return this.activeConnectionsMap.get(byId);
    }
    const id = this._getQueryId(req);
    return this.activeConnectionsMap.get(id);
  }

  abstract checkResponseStatusIsOK(savedConnection: {
    connection: WebSocketSubject<any>;
    results: Res;
  }): boolean;

  abstract mapResponse(req: Req, res: Res): any;

  protected _getQueryId(req: Req): string {
    return new Sha1().updateObjectToHex(req);
  }
}
