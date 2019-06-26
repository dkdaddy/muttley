import fs from 'fs';
import path from 'path';
import os from 'os';
import readline from 'readline';
import { MochaTestRunner } from './mocha-runner';
import { DependencyTree } from './dependency';
import { renderProcessList } from './ps';
import { logger } from './logger';
import { argv } from './command-line';

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
               \\   \\      \`-^-|     |   / , ,\\
                )  )          | -^- ;   \`-^-^'
             _,' _ ;          |    |
            / , , ,'         /---. :
            \`-^-^'          (  :  :,'
                             \`-^--'
`;
enum TestState {
    Ready = 3,
    Running = 2,
    Passsed = 4,
    Failed = 1,
}

class Testcase {
    public filename: string;
    public suite: string;
    public name: string;
    public mtime: Date;
    public startTime: Date = new Date();
    public endTime: Date = new Date();
    public durationMs: number = 0;
    public state = TestState.Ready;
    public stack: { file: string; lineno: number }[] = [];
    public message = ''; // single line
    public fullMessage = '';
    public get basefilename() {
        return path.basename(this.filename);
    }
    public get key() {
        return [this.filename, this.suite, this.name].join('-');
    }
    constructor(filename: string, stat: fs.Stats, fixture: string, name: string) {
        this.filename = filename;
        this.mtime = stat.mtime;
        this.suite = fixture;
        this.name = name;
    }
    public get runtimeInMs() {
        if (this.state === TestState.Running) return Date.now() - this.startTime.getTime();
        else return this.durationMs;
    }
}

function onStart(filename: string) {
    logger.debug('onStart', filename);
    for (let [k, t] of allTests) {
        logger.debug(k, t.filename, filename);
        if (t.filename === filename) {
            logger.debug('remove', t.filename, t.suite, t.name);
            allTests.delete(k);
        }
    }
}
function onPass(filename: string, stat: fs.Stats, suite: string, name: string, duration: number) {
    logger.debug('onPass', filename, suite, name, duration);
    const testcase = new Testcase(filename, stat, suite, name);
    testcase.durationMs = duration;
    testcase.state = TestState.Passsed;
    const oldTest = allTests.get(testcase.key);
    allTests.set(testcase.key, testcase);
}
function onFail(
    filename: string,
    stat: fs.Stats,
    suite: string,
    name: string,
    fullMessage: string,
    message: string,
    stack: { file: string; lineno: number }[],
) {
    logger.debug('onFail', filename, suite, name, fullMessage, message, stack);
    const testcase = new Testcase(filename, stat, suite, name);
    testcase.state = TestState.Failed;
    testcase.message = message;
    testcase.fullMessage = fullMessage;
    testcase.stack = stack;
    testcase.state = TestState.Failed;
    const oldTest = allTests.get(testcase.key);
    allTests.set(testcase.key, testcase);
}
function onEnd(resolve: () => void, passed: number, failed: number): void {
    logger.debug('onEnd', passed, failed);
    resolve();
}
const watchlist: Map<string, Set<string>> = new Map();

async function readTestCasesFromFile(filename: string, stat: fs.Stats): Promise<void> {
    return new Promise(async (resolve, reject) => {
        logger.debug('readTestCasesFromFile', filename);
        const theRunner = new MochaTestRunner();
        // var theRunner = new fakeTestRunner();

        const tests = await theRunner.findTestsP(filename);

        if (tests.length) {
            const files = deps.getFlat(filename); // all files this depends on
            files.forEach(file => {
                const newList = watchlist.get(file) || new Set();
                newList.add(filename);
                watchlist.set(file, newList);
            });
        }

        tests.forEach(test => {
            const testcase = new Testcase(filename, stat, test.suite, test.name);
            testcase.state = TestState.Running;
            allTests.set(testcase.key, testcase);
            logger.debug('adding', testcase.key, testcase.suite, testcase.name);
        });

        if (tests.length) {
            const absoluteFilePath = path.resolve(process.cwd(), filename);
            await theRunner.runFileP(
                filename,
                onStart.bind(null, filename),
                onPass.bind(null, filename, stat),
                onFail.bind(null, filename, stat),
                onEnd.bind(null, resolve),
            );
        }
        resolve();
    });
}

const allTests: Map<string, Testcase> = new Map();
const allFiles: Map<string, Date> = new Map();
const deps = new DependencyTree('/');
async function readFiles(folders: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
        folders.forEach(folder => {
            fs.readdir(folder, async (err, files) => {
                logger.debug('readdir', folder);
                if (err) {
                    reject(err);
                } else {
                    const promises: Promise<void>[] = [];
                    const subFolders: string[] = [];
                    files.forEach(file => {
                        const filepath = path.resolve(folder, file);
                        const stat = fs.statSync(filepath);
                        if (stat.isFile() && file.endsWith('.js')) {
                            const lastModified = allFiles.get(filepath);
                            if (!lastModified || lastModified < stat.mtime) {
                                allFiles.set(filepath, stat.mtime);
                                promises.push(readTestCasesFromFile(filepath, stat));
                                // if first time found no need to test files that depend on it
                                if (lastModified) {
                                    let x: Set<string> | undefined;
                                    // l(Object.getOwnPropertyNames(require.cache));
                                    const fullPath = path.resolve(__dirname, filepath);
                                    logger.debug('looking for', fullPath, 'in', watchlist);
                                    if ((x = watchlist.get(fullPath))) {
                                        x.forEach(xx => {
                                            const xstat = fs.statSync(xx);
                                            promises.push(readTestCasesFromFile(xx, xstat));
                                        });
                                    }
                                }
                            }
                        } else if (stat.isDirectory() && !file.startsWith('.') && file.indexOf('node_modules') == -1) {
                            subFolders.push(filepath);
                        }
                    });
                    await Promise.all(promises);
                    logger.debug('subfolders', subFolders);
                    await readFiles(subFolders);

                    resolve();
                }
            });
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

function shortTextFromStack(stack: { file: string; lineno: number }[]): string {
    return stack.length ? stack[0].file + ':' + stack[0].lineno : '';
}
var Columns = [
    { name: 'FILE', width: 20, just: 'l', fn: (t: Testcase) => path.basename(t.filename) },
    { name: 'SUITE', width: 20, just: 'l', fn: (t: Testcase) => t.suite },
    { name: 'NAME', width: 30, just: 'l', fn: (t: Testcase) => t.name },
    { name: 'STATUS', width: 8, just: 'l', fn: (t: Testcase) => Label[t.state] },
    { name: 'TIME(ms)', width: 8, just: 'l', fn: (t: Testcase) => t.runtimeInMs },
    { name: 'MSG', width: 50, just: 'l', fn: (t: Testcase) => t.message },
    { name: 'SOURCE', width: 36, just: 'l', fn: (t: Testcase) => shortTextFromStack(t.stack) },
];
var lastTotal = 0,
    lastIdle = 0,
    lastSys = 0,
    lastUser = 0;
function renderHeader() {
    const columns = process.stdout.columns || 80;
    const rows = process.stdout.rows || 24;
    process.stdout.write('\x1b[2J'); //clear
    process.stdout.write('\x1b[0;0H'); // top left

    const cpuList: { times: { sys: number; user: number; idle: number } }[] = os.cpus();
    const sys = cpuList.map(cpu => cpu.times.sys).reduce((x, y) => x + y);
    const user = cpuList.map(cpu => cpu.times.user).reduce((x, y) => x + y);
    const idle = cpuList.map(cpu => cpu.times.idle).reduce((x, y) => x + y);
    const total = sys + user + idle;
    const totalDelta = total - lastTotal;
    const idleDelta = ((100 * (idle - lastIdle)) / totalDelta).toFixed(2);
    const sysDelta = ((100 * (sys - lastSys)) / totalDelta).toFixed(2);
    const userDelta = ((100 * (user - lastUser)) / totalDelta).toFixed(2);
    lastIdle = idle;
    lastSys = sys;
    lastUser = user;
    lastTotal = total;
    const freeMem = ((100 * os.freemem()) / os.totalmem()).toFixed(2);

    // time
    process.stdout.write(`\x1b[0;${columns - 8}H`);
    const tzoffset = new Date().getTimezoneOffset() * 60000; //offset in milliseconds
    process.stdout.write(new Date(Date.now() - tzoffset).toISOString().substr(11, 8));

    // test summary
    process.stdout.write('\x1b[0;0H'); // top left again
    let failing = 0,
        running = 0;
    allTests.forEach(t => {
        failing += t.state === TestState.Failed ? 1 : 0;
        running += t.state === TestState.Running ? 1 : 0;
    });
    console.log(`Tests ${allTests.size}, Failing ${failing}, Running ${running}, Files monitored ${allFiles.size}`);

    // system
    console.log(`CPU Usage ${userDelta}% user, ${sysDelta}% sys, ${idleDelta}% idle, ${freeMem}% mem free`);
}
function renderAllTests() {
    const rowHeadings = Columns.map(c => c.name.padEnd(c.width)).join(' ');

    console.log(rowHeadings);
    Array.from(allTests)
        .sort(([, a], [, b]) => a.state - b.state)
        .forEach(([, t]) => {
            const row = Columns.map(c =>
                c
                    .fn(t)
                    .toString()
                    .padEnd(c.width)
                    .substr(0, c.width),
            ).join(' ');
            console.log(Colour[t.state] + row + '\x1b[0m');
        });
}
var move = 0;
function renderPacman() {
    // Oikake (追いかけ)

    // see https://en.wikipedia.org/wiki/ANSI_escape_code
    const blue = '\x1b[94m';
    const white = '\x1b[97m';

    for (let i = 0; i < 40; i++) {
        process.stdout.write(blue + String.fromCodePoint(0x2551) + white + String.fromCodePoint(0x2022) + white);
        if (i < move) console.log();
        else if (move === i) console.log(String.fromCodePoint(0x1f354));
        else console.log(String.fromCodePoint(0x2022));
    }
    move = move > 30 ? 0 : move + 1;

    console.log(
        [
            ,
            '\x1b[31m',
            // String.fromCodePoint(0x2560),
            // String.fromCodePoint(0x2550),
            // String.fromCodePoint(0x2550),
            String.fromCodePoint(0x2557),
            String.fromCodePoint(0x2022), // dot
            String.fromCodePoint(0x1f354), // burger
            String.fromCodePoint(0x1f3a7), // phones
            String.fromCodePoint(0x1f47b), // ghost https://en.wikipedia.org/wiki/Ghosts_(Pac-Man)
            String.fromCodePoint(0x1f3ae), // gamepad
            '\x1b[0m',
        ].join(''),
    );
}

function renderFailures() {
    Array.from(allTests)
        .filter(([, t]) => t.state === TestState.Failed)
        .forEach(([, t]) => {
            process.stdout.write(['\x1b[31;1m' + 'FAILED:', t.suite, t.name, os.EOL].join(' '));
            process.stdout.write(['\x1b[32m', t.fullMessage, '\x1b[0m', os.EOL].join(' '));
            let pad = 0;
            t.stack.forEach(frame => {
                process.stdout.write(
                    '\x1b[35m' + ' '.repeat(2 * pad++) + frame.file + ':' + frame.lineno + '\x1b[0m' + os.EOL,
                );
            });
            process.stdout.write(os.EOL);
        });
}
function renderZoom(n: number) {
    const columns = process.stdout.columns || 80;
    let test: Testcase | undefined = undefined;
    let i = 1;
    Array.from(allTests)
        .filter(([, t]) => t.state === TestState.Failed)
        .forEach(([, t]) => {
            if (i++ === n) {
                process.stdout.write(
                    ['\x1b[31;1m' + t.suite, t.name, t.filename, t.fullMessage, '\x1b[0m', os.EOL].join(' '),
                );
                test = t;
            }
        });
    if (!test) return;

    const renderStack = [...test!.stack].reverse();

    let pad = 0;
    renderStack.forEach(frame => {
        process.stdout.write('\x1b[35m' + ' '.repeat(2 * pad++) + frame.file + ':' + frame.lineno + '\x1b[0m' + os.EOL);
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
    const window = content
        .toString()
        .split(os.EOL)
        .slice(line - rows / 2, line + rows / 2);
    let rownum = line - rows / 2 + 1;
    window.forEach(sourceline => {
        const prefix = rownum === line ? '\x1b[35m' : '';
        console.log(prefix + (rownum++).toString().padEnd(6), sourceline, '\x1b[0m');
    });
}
function renderHelp() {
    console.log('Monitor Unit Testing Tool - MUTT', os.EOL);
    [
        `esc Default view`,
        `l show log`,
        `r re-run all tests`,
        `z Zoom into test failures`,
        `1-9 Zoom into test failure 1-9`,
        `p process list`,
        `q Quit`,
        `h Help`,
    ].forEach(i => console.log(i));
    console.log(mutt);
}
async function render() {
    if (mode != 'p') {
        renderHeader();
        process.stdout.write('\x1b[5;0H'); // row 5
    }
    switch (mode) {
        case 'd':
            return renderAllTests();
        case 'z':
            return renderFailures();
        case 'p':
            return renderProcessList();
        case 'P':
            return renderPacman();
        case '1':
            return renderZoom(1);
        case '2':
            return renderZoom(2);
        case '3':
            return renderZoom(3);
        case 'h':
            return renderHelp();
        default:
            console.log(`Nothing to show in mode '${mode}'`);
    }
}
async function run(paths: string[]) {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode && process.stdin.setRawMode(true);
    process.stdin.on('keypress', (str, key) => {
        if (key.name === 'q') {
            console.log('\x1b[?25h'); // show cursor
            process.exit();
        } else if (key.name === 'r') {
            allTests.clear();
            allFiles.clear();
        } else if (key.name === 'd' || key.name === 'escape') {
            mode = 'd';
            render();
        } else {
            mode = key.name;
            render();
        }
    });
    console.log('\x1b[2J'); //clear
    console.log('\x1b[H'); // home
    console.log('\x1b[?25l'); // hide cursor

    setInterval(async () => {
        await readFiles(paths);
    }, 500);
    setInterval(async () => {
        await render();
    }, 800);
}
if (argv.debug) {
    logger.level = 'debug';
} else {
    logger.level = 'error';
}

const paths = Array.isArray(argv.paths) && (argv.paths as string[]).length ? argv.paths : ['.'];
run(paths);