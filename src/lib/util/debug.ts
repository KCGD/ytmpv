import { ProcessArgs } from "../../main";
import { red, yellow, green,  } from "cli-color";


type LogType = "I" | "W" | "E"; //Info, Warning, Error


//logs to console
export function Log(type:LogType, debug:boolean, message:any): void {
    let _typeText:string = {"I":green("INFO"), "W":yellow("WARNING"), "E":red("ERROR")}[type];
    if(debug) {
        if(ProcessArgs.debug) { 
            console.log(`[${GetTime()}] [${_typeText}] (${yellow("DEBUG")}): ${message}`);
        }
    } else {
        console.log(`[${GetTime()}] [${_typeText}]: ${message}`);
    }
}


//get current time as string
export function GetTime():string {
    let dt = new Date();

    let date = ("0" + dt.getDate()).slice(-2);
    let month = ("0" + (dt.getMonth() + 1)).slice(-2);
    let year = dt.getFullYear();
    let hours = dt.getHours();
    let minutes = dt.getMinutes();
    let seconds = dt.getSeconds();
    
    return (year + "-" + month + "-" + date + "_" + hours + ":" + minutes + ":" + seconds)
}