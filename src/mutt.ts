import fs from 'fs';
import path from 'path';
import os from 'os';
import readline from 'readline';
import { MochaTestRunner } from './mocha-runner';
import { DependencyTree } from './dependency';
import { renderProcessList } from './ps';
import { logger } from './logger';
import { argv, config } from './command-line';
import { Table, renderHeader, renderTable, renderFileWindow, renderPacman, FgColour } from './render';
import { TestFailure } from './test-runner';

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
    public get basefilename(): string {
        return path.basename(this.filename);
    }
    public get key(): string {
        return [this.filename, this.suite, this.name].join('-');
    }
    public constructor(filename: string, stat: fs.Stats, fixture: string, name: string) {
        this.filename = filename;
        this.mtime = stat.mtime;
        this.suite = fixture;
        this.name = name;
    }
    public get runtimeInMs(): number {
        if (this.state === TestState.Running) return Date.now() - this.startTime.getTime();
        else return this.durationMs;
    }
}

function onStart(filename: string): void {
    logger.info('onStart', filename);
    for (const [key, t] of allTests) {
        logger.debug(key, t.filename, filename);
        if (t.filename === filename) {
            logger.debug('remove', t.filename, t.suite, t.name);
            allTests.delete(key);
        }
    }
}
function onPass(filename: string, stat: fs.Stats, suite: string, name: string, duration: number): void {
    logger.info('onPass', filename, suite, name, duration);
    const testcase = new Testcase(filename, stat, suite, name);
    testcase.durationMs = duration;
    testcase.state = TestState.Passsed;
    allTests.set(testcase.key, testcase);
}
function onFail(
    filename: string,
    stat: fs.Stats,
    { suite,
    name,
    fullMessage,
    message, 
    stack}: TestFailure 
): void {
    logger.info('onFail', filename, suite, name, fullMessage, message, stack);
    const testcase = new Testcase(filename, stat, suite, name);
    testcase.state = TestState.Failed;
    testcase.message = message;
    testcase.fullMessage = fullMessage;
    testcase.stack = stack;
    testcase.state = TestState.Failed;
    allTests.set(testcase.key, testcase);
}
function onEnd(resolve: () => void, passed: number, failed: number): void {
    logger.info('onEnd', passed, failed);
    resolve();
}
const watchlist: Map<string, Set<string>> = new Map();

async function readTestCasesFromFile(filename: string, stat: fs.Stats): Promise<void> {
    logger.info('readTestCasesFromFile', filename);
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
        // const absoluteFilePath = path.resolve(process.cwd(), filename);
        return new Promise((resolve) => {
            return theRunner.runFileP(
                filename,
                onStart.bind(null, filename),
                onPass.bind(null, filename, stat),
                onFail.bind(null, filename, stat),
                onEnd.bind(null, resolve),
            );
        });
    }
}
/* eslint-disable */

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
                                    logger.info('File Changed. Looking for', fullPath, 'in', watchlist);
                                    if ((x = watchlist.get(fullPath))) {
                                        logger.info('Found files that need re-run', x);
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
    [TestState.Ready]: FgColour.blue,
    [TestState.Running]: FgColour.yellow,
    [TestState.Passsed]: FgColour.green,
    [TestState.Failed]: FgColour.red,
};

function shortTextFromStack(stack: { file: string; lineno: number }[]): string {
    return stack.length ? stack[0].file + ':' + stack[0].lineno : '';
}
var testColumns = [
    { name: 'FILE', width: 20, just: 'l', func: (row: Testcase) => path.basename(row.filename) },
    { name: 'SUITE', width: 20, just: 'l', func: (row: Testcase) => row.suite },
    { name: 'NAME', width: 30, just: 'l', func: (row: Testcase) => row.name },
    { name: 'STATUS', width: 8, just: 'l', func: (row: Testcase) => Label[row.state] },
    { name: 'TIME(ms)', width: 8, just: 'l', func: (row: Testcase) => row.runtimeInMs },
    { name: 'MSG', width: 50, just: 'l', func: (row: Testcase) => row.message },
    { name: 'SOURCE', width: 36, just: 'l', func: (row: Testcase) => shortTextFromStack(row.stack) },
];

function renderTestHeader() {
    let failing = 0;
    allTests.forEach(t => {
        failing += t.state === TestState.Failed ? 1 : 0;
    });
    const fileCount = allFiles.size;
    renderHeader(failing, failing, allFiles.size);
}
function renderAllTests() {
    const table: Table = {
        columns: testColumns,
        rows: Array.from(allTests.values()).sort((a, b) => (a.state-b.state)),
        rowColour: (row: any) => {
            const test = row as Testcase;
            return Colour[test.state]
        }

    };
    renderTable(table);
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
    if (logger.stdout)
        return; // don't render if logging to stdout

    renderTestHeader();
    process.stdout.write('\x1b[5;0H'); // row 5
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
        } else if (key.name === 'l') {
            logger.stdout = true; // setting this will stop the render function
            logger.level = 'debug';
        } else if (key.name === 'd' || key.name === 'escape') {
            mode = 'd';
            logger.stdout=false;
            logger.level='off';
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
    }, config.refreshIntervalMs);
    setInterval(async () => {
       await render();
    }, config.refreshIntervalMs);
}
if (argv.debug) {
    logger.stdout = true;
    logger.level = 'debug';
}
console.log(argv);
const paths = Array.isArray(argv.paths) && (argv.paths as string[]).length ? argv.paths : ['.'];
run(paths);
