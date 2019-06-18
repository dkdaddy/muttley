import fs, { Stats } from 'fs';
import path from 'path';
import readline from 'readline';
import { runInThisContext } from 'vm';
var os = require('os');
const { exec } = require('child_process');


const mutt = `
       __,-----._                       ,-.
     ,'   ,-.    \\\`---.          ,-----<._/
    (,.-. o:.\`    )),"\\\\-._    ,'         \`.
   ('"-\` .\\       \\\`:_ )\\  \`-;'-._          \\
  ,,-.    \\\` ;  :  \\( \`-'     ) -._     :   \`:
 (    \\ \`._\\\\ \` ;             ;    \`    :    )
  \\\`.  \`-.    __   ,         /  \\        ;, (
   \`.\`-.___--'  \`-          /    ;     | :   |
     \`-' \`-.\`--._          '           ;     |
           (\`--._\`.                ;   /\\    |
            \\     '                \\  ,  )   :
            |  \`--::----            \\'   ;  ;|
            \\    .__,-      (        )   :  :|
             \\    : \`------; \\      |    |   ;
              \\   :       / , )     |    |   (
     mutt      \\   \\      \`-^-|     |   / , ,\\
                )  )          | -^- ;   \`-^-^'
             _,' _ ;          |    |
            / , , ,'         /---. :
            \`-^-^'          (  :  :,'
                             \`-^--'
`;
enum TestState { Ready = 3, Running = 2, Passsed = 4, Failed = 1 }

class Testcase {
    public path: string;
    public fixture: string;
    public name: string;
    public body: string;
    public mtime: Date;
    public startTime: Date = new Date();
    public endTime: Date = new Date();
    public modified: boolean = false;
    public state = TestState.Ready;
    public stack = '';
    public error = '';
    public get filename() { return path.basename(this.path) }
    constructor(path: string, stat: Stats, fixture: string, name: string) {
        this.path = path;
        this.mtime = stat.mtime;
        this.fixture = fixture;
        this.name = name;
        this.body = '42';
    }
    public get runtimeInMs() {
        if (this.state === TestState.Running)
            return Date.now() - this.startTime.getTime();
        else
            return this.endTime.getTime() - this.startTime.getTime();
    }
};

interface TestRunner {
    findTests(filePath: string): [{ suite: string, name: string }];
    runFile(filePath: string,
        onStart: () => void,
        onPass: (suite: string, name: string, duration: number) => void,
        onFail: (suite: string, name: string, message: string, stack: [{ file: string, lineno: number }]) => void,
        onEnd: (passed: number, failed: number) => void,
    ): void;
}
class fakeTestRunner implements TestRunner {
    findTests(filePath: string): [{ suite: string; name: string; }] {
        return [{suite:'Player constructor', name:'throws if no name'}];
    }    
    runFile(filePath: string, onStart: () => void, 
            onPass: (suite: string, name: string, duration: number) => void, 
            onFail: (suite: string, name: string, message: string, stack: [{ file: string; lineno: number; }]) => void, 
            onEnd: (passed: number, failed: number) => void): void {
        setImmediate(onStart);
        setImmediate(() => onPass('Player constructor', 'throws if no name', 0));
        setImmediate(() => onEnd(1,0));
    }
}
async function runTest(t: Testcase) {
    // return runCommand();
    return new Promise((resolve, reject) => {
        t.state = TestState.Running;
        t.startTime = new Date(Date.now());
        setTimeout(() => {
            // console.log('Running', t.name);
            try {
                if (eval(t.body)) {
                    t.state = TestState.Passsed;
                    t.error = '';
                }
                else {
                    t.state = TestState.Failed;
                    t.error = 'returned false';
                }
            }
            catch (err) {
                t.error = err;
                t.stack = err.stack;
                t.state = TestState.Failed;

            }
            // console.log('Completed', t.name, t.state);
            t.endTime = new Date(Date.now());
            resolve();
        }, 2145);
    });
}
async function readTestCasesFromFile(file: string, stat: Stats): Promise<void> {
    l('readtestcases', file);
    return new Promise((resolve, reject) => {
        fs.readFile(file, (err, data) => {
            l('readFile', file);
            if (err) {
                l(err);
                reject(err);
            }
            else {
                let fixture = '';
                let start;
                data.toString().split(os.EOL).forEach(line => {
                    if ((start = line.indexOf(' describe')) >= 0 && line.slice(start + 9).startsWith('(\'')) {
                        fixture = line.substr(start + 9).split("'")[1];
                    }
                    else if ((start = line.indexOf(' it')) >= 0 && line.slice(start + 3).startsWith('(\'')) {
                        const name = line.substr(start + 3).split("'")[1];
                        if (name) {
                            const key = [file, fixture, name].join('-');
                            const testcase = new Testcase(file, stat, fixture, name);
                            const oldTest = allTests.get(key);
                            if (oldTest) testcase.modified = true;
                            allTests.set(key, testcase);
                            l('adding', key, fixture, name);
                            runTest(testcase);
                        }
                    }
                });
                resolve(void 0);
            }
        });
    });
}
const allTests: Map<string, Testcase> = new Map();
const allFiles: Map<string, Date> = new Map();

async function readFiles(folder: string): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.readdir(folder, async (err, files) => {
            l('readdir', folder);
            if (err) {
                reject(err);
            }
            else {
                const promises: Promise<void>[] = [];
                const subFolders: string[] = [];
                files.forEach(file => {
                    const filepath = folder + '/' + file;
                    const stat = fs.statSync(filepath);
                    if (stat.isFile() && file.endsWith('.js')) {
                        const lastModified = allFiles.get(filepath);
                        if (!lastModified || lastModified && lastModified < stat.mtime) {
                            allFiles.set(filepath, stat.mtime);
                            promises.push(readTestCasesFromFile(filepath, stat));
                        }
                    }
                    else if (stat.isDirectory() && !file.startsWith('.')) {
                        subFolders.push(filepath);
                    }
                });
                await Promise.all(promises);
                l('subfolders', subFolders);
                subFolders.forEach(async folder => {
                    await readFiles(folder);
                })

                resolve();
            }
        });
    });
}
var mode = 'd'; // i : bundle info, h : help, e - expanded errors
// o sort, 

// columns name, file, time, status, error
const Label = {
    [TestState.Ready]: 'Waiting',
    [TestState.Running]: 'Running',
    [TestState.Passsed]: 'Passed',
    [TestState.Failed]: 'Failed',
};
// for colours see https://stackoverflow.com/questions/4842424/list-of-ansi-color-escape-sequences
const Colour = {
    [TestState.Ready]: '\x1b[34m',
    [TestState.Running]: '\x1b[33m',
    [TestState.Passsed]: '\x1b[32m',
    [TestState.Failed]: '\x1b[31m',
};

function shortTextFromStack(stack: string): string {
    // .replace(/[\r\n]+\s+/g, ' ')
    return stack ? stack.split(os.EOL)[1].trimLeft() : '';
}
var Columns = [
    { name: 'FIXTURE', width: 15, just: 'l', fn: (t: Testcase) => t.fixture },
    { name: 'NAME', width: 30, just: 'l', fn: (t: Testcase) => t.name },
    { name: 'FILE', width: 20, just: 'l', fn: (t: Testcase) => t.filename },
    { name: 'STATUS', width: 8, just: 'l', fn: (t: Testcase) => Label[t.state] },
    { name: 'TIME(ms)', width: 8, just: 'l', fn: (t: Testcase) => t.runtimeInMs },
    { name: 'MSG', width: 40, just: 'l', fn: (t: Testcase) => t.error },
    { name: 'SOURCE', width: 40, just: 'l', fn: (t: Testcase) => shortTextFromStack(t.stack) }
];
var lastTotal = 0, lastIdle = 0, lastSys = 0, lastUser = 0;
function renderHeader() {
    const columns = process.stdout.columns || 80;
    const rows = process.stdout.rows || 24;
    process.stdout.write('\x1b[2J');     //clear 
    process.stdout.write('\x1b[0;0H');   // top left

    const cpuList: { times: { sys: number, user: number, idle: number } }[] = os.cpus();
    const sys = cpuList.map(cpu => cpu.times.sys).reduce((x, y) => x + y);
    const user = cpuList.map(cpu => cpu.times.user).reduce((x, y) => x + y);
    const idle = cpuList.map(cpu => cpu.times.idle).reduce((x, y) => x + y);
    const total = sys + user + idle;
    const totalDelta = total - lastTotal;
    const idleDelta = (100 * (idle - lastIdle) / totalDelta).toFixed(2);
    const sysDelta = (100 * (sys - lastSys) / totalDelta).toFixed(2);
    const userDelta = (100 * (user - lastUser) / totalDelta).toFixed(2);
    lastIdle = idle;
    lastSys = sys;
    lastUser = user;
    lastTotal = total;
    const freeMem = (100 * os.freemem() / os.totalmem()).toFixed(2);

    // time
    process.stdout.write(`\x1b[0;${columns - 8}H`);
    const tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
    process.stdout.write((new Date(Date.now() - tzoffset).toISOString().substr(11, 8)));

    // test summary
    process.stdout.write('\x1b[0;0H');   // top left again
    let failing = 0, running = 0;
    allTests.forEach(t => { failing += t.state === TestState.Failed ? 1 : 0; running += t.state === TestState.Running ? 1 : 0; })
    console.log(`Tests ${allTests.size}, Failing ${failing}, Running ${running}, Files monitored ${allFiles.size}`);

    // system
    console.log(`CP Usage ${userDelta}% user, ${sysDelta}% sys, ${idleDelta}% idle, ${freeMem}% mem free`);
}
function renderAllTests() {
    const rowHeadings = Columns.map(c => (c.name).padEnd(c.width)).join(' ');
    console.log(rowHeadings);
    Array.from(allTests).sort(([, a], [, b]) => (a.state - b.state)).forEach(([, t]) => {
        const row = Columns.map(c => c.fn(t).toString().padEnd(c.width).substr(0, c.width)).join(' ');
        console.log(Colour[t.state] + row + '\x1b[0m');
    })
}
function renderHelp() {
    console.log('Monitor Unit Testing Tool - MUTT');
    [`d Default view`,
        `z Zoom into test failures`,
        `0 Zoom into test failure 0`,
        `1-9 Zoom into test failure 1-9`,
        `q Quit`,
        `h Help`].forEach(i => console.log(i));
    console.log(mutt);

}
function renderFailures() {

    Array.from(allTests).filter(([, t]) => t.state === TestState.Failed).forEach(([, t]) => {
        process.stdout.write(['\x1b[31;1m', t.name, ' ', t.filename, ' ', t.error, '\x1b[0m', os.EOL].join(''))
        console.log(t.stack);
    });
}
function renderZoom(n: number) {
    const columns = process.stdout.columns || 80;
    let test: Testcase | undefined = undefined;
    let i = 0;
    Array.from(allTests).filter(([, t]) => t.state === TestState.Failed).forEach(([, t]) => {
        if (i++ === n) {
            process.stdout.write(['\x1b[31;1m', t.name, ' ', t.filename, ' ', t.error, '\x1b[0m', os.EOL].join(''))
            console.log(t.stack);
            test = t;
        }
    });
    //find first line in stack
    if (test && test!.stack) {
        test!.stack.split(os.EOL).slice(1, 4).forEach(frame => {
            const start = frame.indexOf('(/');
            const end = frame.indexOf(':', start);
            if (start > 0 && end > 0) {
                const filepath = frame.substr(start + 1, end - start - 1);
                const line = frame.substr(end + 1).split(':')[0];
                // inverse filename padded full width
                process.stdout.write('\x1b[7m' + (filepath + ':' + line).padEnd(columns) + '\x1b[0m');
                renderFileWindow(filepath, 14, Number.parseInt(line, 10));
            }
        });
    }
}
function renderFileWindow(filepath: string, rows: number, line: number) {
    const content = fs.readFileSync(filepath);
    const window = content.toString().split(os.EOL).slice(line - rows / 2, line + rows / 2);
    let rownum = line - rows / 2 + 1;
    window.forEach(sourceline => {
        const prefix = rownum === line ? '\x1b[35m' : '';
        console.log(prefix + (rownum++).toString().padEnd(6), sourceline, '\x1b[0m');
    });
}
async function render() {
    renderHeader();
    process.stdout.write('\x1b[5;0H'); // row 5
    switch (mode) {
        case 'd': return renderAllTests();
        case 'z': return renderFailures();
        case '0': return renderZoom(0);
        case '1': return renderZoom(1);
        case '2': return renderZoom(2);
        case '3': return renderZoom(3);
        case 'h': return renderHelp();
        default: console.log(mode);
    }

}
async function run() {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode && process.stdin.setRawMode(true);
    process.stdin.on('keypress', (str, key) => {

        mode = key.name;
        if (key.name === 'q') {
            console.log("\x1b[?25h"); // show cursor
            process.exit();
        } else {
            render();
        }
    });
    console.log('\x1b[2J'); //clear
    console.log('\x1b[H'); // home
    console.log("\x1b[?25l"); // hide cursor

    setInterval(async () => {
        await readFiles('.');
        await render();
    }, 1000);

}
let debug = false;
const l = debug ? console.log : () => { };

run();