import { platform } from "os";
import { Log } from "../util/debug";
import { execSync } from "child_process";


/**
 * Search PATH variable for a program
 * @param dep name of dependency to find
 * @returns a file path or undefined
 */
export function FindInPath(dep:string): string | undefined {
    const sys:NodeJS.Platform = platform();
    switch (sys) {
        //UNIX
        case "linux":
        case "darwin": {
            return String(execSync(`which ${dep}`)).replace(/\n/g, "").replace(/\r/g, "");
        }

        //NT
        case "win32": {
            return String(execSync(`where ${dep}.exe`)).replace(/\n/g, "").replace(/\r/g, "");
        }

        //unsupported platform
        default: {
            Log('W', false, `Unsupported platform "${sys}"`);
            return undefined;
        }
    }
}