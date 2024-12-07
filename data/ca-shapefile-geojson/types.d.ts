declare module 'stream-json/Parser.js' {
    import { Transform } from 'stream';
    export class Parser extends Transform {
        constructor();
    }
}

declare module 'stream-json/streamers/StreamArray.js' {
    import { Transform } from 'stream';
    export class StreamArray extends Transform {
        constructor();
    }
}
