const { execSync, exec } = require('child_process');
const { existsSync, unlinkSync, readFileSync } = require('fs');
const os = require('os');
const { join, parse } = require('path');

//version
const NODE_VERSION = "21.6.1";

//arch (possitilities: x64, arm64)
const ARCH = os.arch();
if(! (ARCH === "x64" || ARCH === "arm64")) {
    console.error(`Unsupported arch: ${ARCH}`);
    process.exit(1);
}


//platform (possitilities: linux, win, darwin)
const PLATFORM = platformAlias(process.argv[2] || os.platform());
if(! (PLATFORM === "linux" || PLATFORM === "win" || PLATFORM === "darwin")) {
    console.error(`Unsupported platform: ${PLATFORM}`);
    process.exit(1);
}

//executable name
let OUTPUT_EXECUTABLE_NAME = null;
try {
    OUTPUT_EXECUTABLE_NAME = `${JSON.parse(readFileSync(join(process.cwd(), "package.json"))).name}_${PLATFORM}-${ARCH}`;
    if(!OUTPUT_EXECUTABLE_NAME || OUTPUT_EXECUTABLE_NAME === "") {
        throw `Cant get package name from package.json (${join(process.cwd(), "package.json")})`;
    }
} catch (e) {
    console.log(`Cant get package name from package.json (${join(process.cwd(), "package.json")})`);
    process.exit(1);
}

//define extension because windows uses .zip instead of .tar.xz like on darwin and linux (why...)
const PLATFORM_ARCHIVE_EXTENSION = (PLATFORM === "win")? "zip" : "tar.xz";

//define node paths and constants
const NODE = `v${NODE_VERSION}-${PLATFORM}-${ARCH}`;
const NODE_ARCHIVE_URL = `https://nodejs.org/dist/v${NODE_VERSION}/node-${NODE}.${PLATFORM_ARCHIVE_EXTENSION}`;
const EXPECTED_NODE_PATH = (PLATFORM === "win")? parse(NODE_ARCHIVE_URL).name : parse(parse(NODE_ARCHIVE_URL).name).name;
const BIN_PATH = join(process.cwd(), ".bin");
const NODE_EXECUTABLE_PATH = (PLATFORM === "win")? join(BIN_PATH, EXPECTED_NODE_PATH, "node.exe") : join(BIN_PATH, EXPECTED_NODE_PATH, "bin/node");

//check if node source already exists
//NOTE: Windows archive is ALSO different. Posix systems extract to ARCHIVE/bin/node, windows is ARCHIVE/node. WHY
if(!existsSync(join(BIN_PATH, EXPECTED_NODE_PATH))) {
    //download archive
    console.log(`Downloading nodejs (Platform: ${PLATFORM}, Version: ${NODE_VERSION})`);
    if(PLATFORM === "win") {
        execSync(`curl -sL "${NODE_ARCHIVE_URL}" -o "${join(BIN_PATH, "temp.zip")}"`);
        execSync(`unzip "${join(BIN_PATH, "temp.zip")}" -d "${BIN_PATH}"`);
        unlinkSync(join(BIN_PATH, "temp.zip"));
    } else {
        execSync(`curl -sL "${NODE_ARCHIVE_URL}" | tar -xJf - -C "${BIN_PATH}"`);
    }
} else {
    console.log(`Using cached nodejs (Platform: ${PLATFORM}, Version: ${NODE_VERSION})`);
}


//confirm existance of node executable after extraction.
if(!existsSync(NODE_EXECUTABLE_PATH)) {
    console.error(`Nodejs executable was not found in the expected path: ${NODE_EXECUTABLE_PATH}`);
    console.error(`This can be due to failed extraction or a malformed archive.`);
    process.exit(1);
}

//define build dependencies
const DEPS = {
    "linux": ["mpv", "ffmpeg", "yt-dlp"],
    "darwin": ["mpv", "ffmpeg", "yt-dlp"],
    "win": ["mpv", "ffmpeg", "yt-dlp"]
}

//define build sequences
//step accepts {"command": [command], "name": [step name], failureAllowed: boolean}
const SEQUENCES = {
    "linux": [
        {command: "mkdir -v Build", name: "Make build directory", failureAllowed:true},
        {command: "yarn run tsc --pretty", name: "Compiling TS"},
        {command: "yarn run backpack-cli", name: "Generating ROM"},
        {command: "yarn run webpack --progress --no-stats", name: "Generating bundle"},
        {command: "node --experimental-sea-config sea-config.json", name: "Generating executable blob"},
        {command: `cp "${NODE_EXECUTABLE_PATH}" Build/${OUTPUT_EXECUTABLE_NAME}`, name: "Copy executable"},
        {command: `yarn run postject Build/${OUTPUT_EXECUTABLE_NAME} NODE_SEA_BLOB Build/executable.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`, name: "Injecting executable blob"}
    ],
    "win": [
        {command: "mkdir -v Build", name: "Make build directory", failureAllowed:true},
        {command: "yarn run tsc --pretty", name: "Compiling TS"},
        {command: "yarn run backpack-cli", name: "Generating ROM"},
        {command: "yarn run webpack --progress --no-stats", name: "Generating bundle"},
        {command: "node --experimental-sea-config sea-config.json", name: "Generating executable blob"},
        {command: `cp "${NODE_EXECUTABLE_PATH}" Build/${OUTPUT_EXECUTABLE_NAME}.exe`, name: "Copy executable"},
        {command: `yarn run postject Build/${OUTPUT_EXECUTABLE_NAME}.exe NODE_SEA_BLOB Build/executable.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`, name: "Injecting executable blob"}
    ],
    "darwin": [
        {command: "mkdir -v Build", name: "Make build directory", failureAllowed:true},
        {command: "yarn run tsc --pretty", name: "Compiling TS"},
        {command: "yarn run backpack-cli", name: "Generating ROM"},
        {command: "yarn run webpack --progress --no-stats", name: "Generating bundle"},
        {command: "node --experimental-sea-config sea-config.json", name: "Generating executable blob"},
        {command: `cp "${NODE_EXECUTABLE_PATH}" Build/${OUTPUT_EXECUTABLE_NAME}`, name: "Copy executable"},
        {command: `yarn run postject Build/${OUTPUT_EXECUTABLE_NAME} NODE_SEA_BLOB Build/executable.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 --macho-segment-name NODE_SEA `, name: "Injecting executable blob"}
    ],
};

//do depchecks
if(DEPS[PLATFORM].length < 1) {
    console.warn(`WARNING: No dependencies specified for ${PLATFORM}. Skipping dependency checks.`);
}
for(let i = 0; i < DEPS[PLATFORM].length; i++) {
    process.stdout.write(`Checking for ${DEPS[PLATFORM][i]} ... `);
    if(FindInPath(DEPS[PLATFORM][i])) {
        process.stdout.write(`FOUND\n`);
    } else {
        process.stdout.write(`NOT FOUND\n`);
        console.error(`Error: could not find dependency ${DEPS[PLATFORM][i]}\nIs it installed and accessable in the PATH variable?`);
        process.exit(1);
    }
}

//manual build linux for now
build(SEQUENCES[PLATFORM]);

//builder function
function build(sequence) {
    let i = 0;
    const totalSteps = sequence.length + 1;
    let startTime = Date.now();
    let stdoutFrame = [];

    //print build progress
    let progressLoop = setInterval(function() {
        printProgress();
    }, 100);
    
    _step();
    function _step() {
        if (i >= sequence.length) {
            clearInterval(progressLoop);
            printProgress(true);
            console.log("\nBuild completed. All commands executed successfully.");
        } else {
            let step = exec(sequence[i].command, {'stdio':'inherit'});

            //increment i when step completes and clear stdout frame
            step.on('exit', function(code) {
                if(code === 0) {
                    i++;
                    stdoutFrame = [];
                    _step();
                } else {
                    if(!sequence[i].failureAllowed) {
                        error();
                    } else {
                        i++;
                        stdoutFrame = [];
                        _step();
                    }
                }
            })

            //log stdout/stderr data to frame
            step.stdout.on('data', (data) => {
                stdoutFrame.push(data);
            })
            step.stderr.on('data', (data) => {
                stdoutFrame.push(data);
            })

            //log error on build sequence failure
            step.on('error', function(e) {
                if(!sequence[i].failureAllowed) {
                    error();
                } else {
                    i++;
                    stdoutFrame = [];
                    _step();
                }
            })
        }
    }

    function error() {
        process.stdout.write("\n\n");
        for(let i = 0; i < stdoutFrame.length; i++) {
            process.stdout.write(stdoutFrame[i]);
        }
        process.stdout.write("\n\n");

        console.log(`Error occured in "${sequence[i].name}" (${i+1}/${totalSteps})`);
        process.exit(1);
    }

    function printProgress(final) {
        let currentTime = Date.now();
        let elapsed = currentTime - startTime;
        let seconds = Math.floor(elapsed/1000);
        let tenths = Math.floor(elapsed%1000)/100;
        let time = `${seconds}.${Math.round(tenths)}`;

        let name = final? `${sequence[sequence.length - 1].name}` : `${sequence[i].name}`
        let progress = final? `${totalSteps}/${totalSteps}` : `${i+1}/${totalSteps}`;
        let output = `[${progress}] ${name} (${time}s)`;

        //print output
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(output);
    }
}

//prints text at bottom of screen
function printAtBottom(text) {
    const rows = process.stdout.rows;
    // Move the cursor to the bottom of the terminal
    process.stdout.cursorTo(0, rows - 1);
    // Clear the line to ensure clean output
    process.stdout.clearLine(0);
    // Print the text
    process.stdout.write(text);
}


//platform alias function (because windows is inconsistant between node platform detection and node archives...)
function platformAlias(platform) {
    switch(platform) {
        case "win32": {
            return "win";
        } break;
        default:
            return platform;
    }
}


//find if executable is accessable to session
function FindInPath(dep) {
    const sys = os.platform();
    //if any of these commands fail, it means not found
    switch (sys) {
        //UNIX
        case "linux":
        case "darwin": {
            try {
                return String(execSync(`which ${dep}`)).replace(/\n/g, "").replace(/\r/g, "");
            } catch (e) {
                return undefined;
            }
            
        }

        //NT
        case "win32": {
            try {
                return String(execSync(`where ${dep}.exe`)).replace(/\n/g, "").replace(/\r/g, "");
            } catch (e) {
                return undefined;
            }
            
        }

        //unsupported platform
        default: {
            return undefined;
        }
    }
}
