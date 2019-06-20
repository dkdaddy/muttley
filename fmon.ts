import fs, { Stats } from 'fs';
import path from 'path';
import readline from 'readline';
import { FakeTestRunner as FakeTestRunner } from './test-runner';
import { MochaTestRunner } from './mocha_runner';
var os = require('os');


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
    public filename: string;
    public suite: string;
    public name: string;
    public mtime: Date;
    public startTime: Date = new Date();
    public endTime: Date = new Date();
    public state = TestState.Ready;
    public stack: { file: string; lineno: number; }[] = [];
    public error = '';
    public get basefilename() { return path.basename(this.filename) }
    public get key() {
        return [this.filename, this.suite, this.name].join('-');
    }
    constructor(filename: string, stat: Stats, fixture: string, name: string) {
        this.filename = filename;
        this.mtime = stat.mtime;
        this.suite = fixture;
        this.name = name;
    }
    public get runtimeInMs() {
        if (this.state === TestState.Running)
            return Date.now() - this.startTime.getTime();
        else
            return this.endTime.getTime() - this.startTime.getTime();
    }
};

function onStart(filename: string) {
    l('onStart', filename);
    for (let [k, t] of allTests) {
        l(k, t.filename, filename);
        if (t.filename === filename) {
            l('remove', t.filename, t.suite, t.name);
            allTests.delete(k);
        }
    }
};
function onPass(filename: string, stat: Stats, suite: string, name: string, duration: number) {
    l('onPass', filename, suite, name);
    const testcase = new Testcase(filename, stat, suite, name);
    testcase.state = TestState.Passsed;
    const oldTest = allTests.get(testcase.key);
    allTests.set(testcase.key, testcase);
};
function onFail(filename: string, stat: Stats, suite: string, name: string, message: string, stack: { file: string; lineno: number; }[]) {
    l('onFail', filename, suite, name, message);
    const testcase = new Testcase(filename, stat, suite, name);
    testcase.state = TestState.Failed;
    testcase.error = message;
    testcase.stack = stack;
    testcase.state = TestState.Failed;
    const oldTest = allTests.get(testcase.key);
    allTests.set(testcase.key, testcase);
};
function onEnd(resolve: () => void, passed: number, failed: number): void {
    l('onEnd', passed, failed);
    resolve();
};
async function readTestCasesFromFile(filename: string, stat: Stats): Promise<void> {
    return new Promise(async (resolve, reject) => {

        const theRunner = new MochaTestRunner();
        // var theRunner = new fakeTestRunner();

        const tests = await theRunner.findTests(filename);

        tests.forEach(test => {
            const testcase = new Testcase(filename, stat, test.suite, test.name);
            testcase.state = TestState.Running;
            allTests.set(testcase.key, testcase);
            l('adding', testcase.key, testcase.suite, testcase.name);
        });
        // schedule onStart here because the event isn't being triggered in mocha 6.1.4
        // see https://github.com/mochajs/mocha/issues/2753
        onStart(filename);

        if (tests.length) {
            const absoluteFilePath = path.resolve(process.cwd(), filename);
            // delete require.cache[require.resolve(absoluteFilePath)];
            // l('Loading Mocha from', require.resolve('mocha'));
            // delete require.cache[require.resolve('mocha')];
            await theRunner.runFile(filename, onStart.bind(null, filename), onPass.bind(null, filename, stat), onFail.bind(null, filename, stat), onEnd.bind(null, resolve));
        }
        resolve();
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

function shortTextFromStack(stack: { file: string, lineno: number }[]): string {
    return stack.length ? stack[0].file + ':' + stack[0].lineno : '';
}
var Columns = [
    { name: 'SUITE', width: 20, just: 'l', fn: (t: Testcase) => t.suite },
    { name: 'NAME', width: 30, just: 'l', fn: (t: Testcase) => t.name },
    { name: 'FILE', width: 20, just: 'l', fn: (t: Testcase) => t.filename },
    { name: 'STATUS', width: 8, just: 'l', fn: (t: Testcase) => Label[t.state] },
    { name: 'TIME(ms)', width: 8, just: 'l', fn: (t: Testcase) => t.runtimeInMs },
    { name: 'MSG', width: 50, just: 'l', fn: (t: Testcase) => t.error },
    { name: 'SOURCE', width: 36, just: 'l', fn: (t: Testcase) => shortTextFromStack(t.stack) }
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
    console.log(`CPU Usage ${userDelta}% user, ${sysDelta}% sys, ${idleDelta}% idle, ${freeMem}% mem free`);
}
function renderAllTests() {
    const rowHeadings = Columns.map(c => (c.name).padEnd(c.width)).join(' ');
    console.log(['\x1b[5m','\x1b[31m' ,
        String.fromCodePoint(0x2560), 
        String.fromCodePoint(0x2550), 
        String.fromCodePoint(0x2550), 
        String.fromCodePoint(0x2557), 
        String.fromCodePoint(0x1F354), 
        String.fromCodePoint(0x1f3a7), 
        String.fromCodePoint(0x1f3ae),'\x1b[0m'].join(''));
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
        process.stdout.write(['\x1b[31;1m' + 'FAILED:', t.suite, t.name, os.EOL, t.filename, os.EOL, t.error, '\x1b[0m', os.EOL].join(' '))
        let n = 0;
        t.stack.forEach(frame => {
            process.stdout.write(' '.repeat(2 * n++) + frame.file + ':' + frame.lineno + os.EOL);
        });
        process.stdout.write(os.EOL);
    });
}
function renderZoom(n: number) {
    const columns = process.stdout.columns || 80;
    let test: Testcase | undefined = undefined;
    let i = 0;
    Array.from(allTests).filter(([, t]) => t.state === TestState.Failed).forEach(([, t]) => {
        if (i++ === n) {
            process.stdout.write(['\x1b[31;1m' + t.suite, t.name, t.filename, t.error, '\x1b[0m', os.EOL].join(' '))
            test = t;
        }
    });
    if (!test)
        return;

    const renderStack = [...test!.stack].reverse();

    let pad = 0;
    renderStack.forEach(frame => {
        process.stdout.write(' '.repeat(2 * pad++) + frame.file + ':' + frame.lineno + os.EOL);
    });
    process.stdout.write(os.EOL);
    //find first line in stack
    renderStack.forEach(frame => {
        const filepath = frame.file;
        const line = frame.lineno;
        // inverse filename padded full width
        process.stdout.write('\x1b[7m' + (filepath + ':' + line).padEnd(columns) + '\x1b[0m');
        renderFileWindow(filepath, 14, line);
    });
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
        if (!debug)  // don't rendern in debug mode to see log
            await render();
    }, 1000);

}
let debug = false;
const l = debug ? console.log : () => { };

run();