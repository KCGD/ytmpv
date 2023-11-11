import * as fs from 'fs';
import * as path from "path";
import * as process from "process";


//debug lib imports
import { Log } from './lib/util/debug';
import { FindInPath } from './lib/find/find';
import { green, red } from 'cli-color';
import { SyncRequestBuffer } from './lib/util/http';
import { exec, spawn, spawnSync } from 'child_process';
import { createServer } from 'http';


//define process args type
export type processArgs = {
    showHelpDoc:boolean;
    debug:boolean;
    port: number;
}
//define object for process arguments
export var ProcessArgs:processArgs = {
    "showHelpDoc":false,
    "debug":true,
    port: 7999
}


//parse process arguments
for(let i = 0; i < process.argv.length; i++) {
    switch(process.argv[i]) {
        case "--help":
        case "-h": {
            ProcessArgs.showHelpDoc = true;
        } break;

        case "-P":
        case "--port":
            ProcessArgs.port = parseInt(process.argv[i+1]);
        break
    }
}


//main function
Main();
function Main(): void {
    if(ProcessArgs.showHelpDoc) {
        console.log(fs.readFileSync("./src/assets/helpdoc").toString());
        process.exit(0);
    }

    //check for dependencies
    const ytdlp = FindInPath("yt-dlp");
    const mpv = FindInPath("mpv");

    if(!mpv || !ytdlp) {
        Log(`E`, false, `Faild some dependency checks:`);
        console.log(`${(mpv)? green("FOUND"): red("NOT FOUND")}: mpv ${(mpv)? mpv : ""}`);
        console.log(`${(ytdlp)? green("FOUND"): red("NOT FOUND")}: yt-dlp ${(ytdlp)? ytdlp : ""}`);
        process.exit(1);
    }

    //set up server
    createServer(function (request, response): void {
        switch (request.method) {
            case "POST": {
                let buffer:any[] = [];
                request.on('data', function(data:any): void {
                    buffer.push(data);
                })

                request.on('end', function(): void {
                    let url:URL;

                    //try parsing the url
                    try {
                        url = new URL(buffer.join().toString());
                        let command = `"${ytdlp}" "${url}" -o - | "${mpv}" -`;
                        Log(`I`, false, `Recieve: ${url}`);
                        exec(command);
                        response.writeHead(200);
                        response.end(`Recieved "${url}"`);
                    } catch (e) {
                        Log(`E`, false, `Not a valid url "${request.headers['url']}"`);
                    }
                })
            } break;

            case "GET": {
                response.writeHead(200, {'Content-Type': 'text/plain'});
                response.end("Service is running!");
            }
        }
    }).listen(ProcessArgs.port);
    Log(`I`, false, `Binded to port ${ProcessArgs.port}`);
}
