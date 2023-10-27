import { IncomingMessage } from "http";
import { Http2ServerRequest } from "http2";


interface SyncRequestBufferCallback {(data:Buffer|undefined): void};
/**
 * Given an http request, sync all data to a buffer and send to callback, or all undefined
 * @param request an http 2 request object
 * @param callback returns buffer or undefined
 */
export function SyncRequestBuffer(request:IncomingMessage, callback:SyncRequestBufferCallback): void {
    let buf:any[] = [];

    //on data, add to buff
    request.on('data', function(dat:any): void {
        buf.push(dat);
    })

    //successful sync
    request.on('close', function(): void {
        callback(Buffer.from(buf));
    })

    //return undefined on error
    request.on('error', function(): void {
        callback(undefined);
    })
}