import * as path from "path";
import * as process from "process";


//debug lib imports
import { readFileSync } from "fs";
import { createServer } from 'http';
import { exec } from 'child_process';
import { Log } from './lib/util/debug';
import { green, red } from 'cli-color';
import { FindInPath } from './lib/find/find';


//define process args type
export type processArgs = {
    showHelpDoc:boolean;
    debug:boolean;
    port: number;
    host: string;
    printversion: boolean;
}
//define object for process arguments
export var ProcessArgs:processArgs = {
    showHelpDoc:false,
    debug:true,
    port: 7999,
    host: "localhost",
    printversion:false
}


//rom import
export const rom = require('./rom.js');


//parse process arguments
for(let i = 0; i < process.argv.length; i++) {
    switch(process.argv[i]) {
        case "--help":
        case "-h": {
            ProcessArgs.showHelpDoc = true;
        } break;

        //specify port
        case "-P":
        case "--port": {
            ProcessArgs.port = parseInt(process.argv[i+1]);
        } break;

        //specify host
        case "--host": {
            ProcessArgs.host = process.argv[i+1];
        } break;

        //print current version
        case "-v":
        case "--version": {
            rom.readFile("src/assets/helpdoc", (err:any, file:Buffer) => {
                console.log(file.toString().split("\n")[0]);
                process.exit(0);
            })
        } break;
    }
}


//main function
Main();
function Main(): void {
    if(ProcessArgs.showHelpDoc) {
        //console.log(readFileSync("./src/assets/helpdoc").toString());
        //process.exit(0);
        rom.readFile("src/assets/helpdoc", (err:any, file:Buffer) => {
            console.log(file.toString());
            process.exit(0);
        })
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

                        //get time property
                        let time:string = (url.searchParams.get('t') === null)? '0' : url.searchParams.get('t') as string;
                        let timeArgs:string = `--external-downloader ffmpeg --external-downloader-args "ffmpeg_i:-ss ${time}"`;

                        let command = `"${ytdlp}" ${timeArgs} "${url}" -o - | "${mpv}" -`;
                        Log(`I`, false, `Recieve: ${url}`);
                        Log(`I`, true, `execute: ${command}`);
                        exec(command);

                        response.writeHead(200);
                        response.end(`Recieved "${url}"`);
                    } catch (e) {
                        Log(`E`, false, `Not a valid url "${request.headers['url']}"`);
                    }
                })
            } break;

            default: {
                response.writeHead(200, {'Content-Type': 'text/plain'});
                response.end("YTMPV is running!");
            }
        }
    }).listen(ProcessArgs.port, ProcessArgs.host);
    Log(`I`, false, `Binded to "${ProcessArgs.host}" on port ${ProcessArgs.port}`);
}
