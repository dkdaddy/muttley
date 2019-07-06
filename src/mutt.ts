import fs from 'fs';
import path from 'path';
import os from 'os';
import readline from 'readline';
import { MochaTestRunner } from './mocha-runner';
import { DependencyTree } from './dependency';
import { renderProcessList } from './ps';
import { logger, Levels } from './logger';
import { argv, config } from './command-line';
import { FgColour, Table, renderHeader, renderTable, renderFileWindow, write, writeline } from './render';
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
function onFail(filename: string, stat: fs.Stats, { suite, name, fullMessage, message, stack }: TestFailure): void {
    logger.error('onFail', filename, suite, name, message);
    logger.debug('onFail', filename, suite, name, fullMessage, message, stack);
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
        return new Promise(resolve => {
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

const allTests: Map<string, Testcase> = new Map();
const allFiles: Map<string, Date> = new Map();

const depsModule = config.dependencyModule;
const deps: DependencyTree = require(depsModule).tree;

function readFiles(folders: string[]): Promise<void> {
    logger.info('readFiles', folders);
    return new Promise((resolve, reject) => {
        folders.forEach(folder => {
            fs.readdir(folder, async (error, files) => {
                logger.debug('readdir', folder);
                if (error) {
                    reject(error);
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
                    if (subFolders.length) await readFiles(subFolders);

                    resolve();
                }
            });
        });
    });
}
let mode = 'd'; // i : bundle info, h : help, e - expanded errors

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
    return stack.length ? `${stack[0].file}:${stack[0].lineno}` : '';
}
const testColumns = [
    { name: 'FILE', width: 20, just: 'l', func: (row: Testcase) => path.basename(row.filename) },
    { name: 'SUITE', width: 20, just: 'l', func: (row: Testcase) => row.suite },
    { name: 'NAME', width: 25, just: 'l', func: (row: Testcase) => row.name },
    { name: 'STATUS', width: 8, just: 'l', func: (row: Testcase) => Label[row.state] },
    { name: 'TIME(ms)', width: 8, just: 'l', func: (row: Testcase) => row.runtimeInMs },
    { name: 'MSG', width: 40, just: 'l', func: (row: Testcase) => row.message },
    { name: 'SOURCE', width: 36, just: 'l', func: (row: Testcase) => shortTextFromStack(row.stack) },
];

function renderTestHeader(): void {
    let failing = 0,
        running = 0;
    allTests.forEach(test => {
        failing += test.state === TestState.Failed ? 1 : 0;
        running += test.state === TestState.Running ? 1 : 0;
    });
    renderHeader(allTests.size, failing, running, allFiles.size);
}
function renderAllTests(): void {
    const sort = (lhs: Testcase, rhs: Testcase): number => {
        if (lhs.state === rhs.state) return lhs.filename.localeCompare(rhs.filename);
        return lhs.state - rhs.state;
    };
    const table: Table = {
        columns: testColumns,
        rows: Array.from(allTests.values()).sort(sort),
        rowColour: (row: any) => {
            const test = row as Testcase;
            return Colour[test.state];
        },
    };
    renderTable(table);
}
function renderFailures(): void {
    Array.from(allTests)
        .filter(([, t]) => t.state === TestState.Failed)
        .forEach(([, t]) => {
            process.stdout.write(['\x1b[31;1mFAILED:', t.suite, t.name, os.EOL].join(' '));
            process.stdout.write(['\x1b[32m', t.fullMessage, '\x1b[0m', os.EOL].join(' '));
            let pad = 0;
            t.stack.forEach(frame => {
                process.stdout.write(`\x1b[35m${' '.repeat(2 * pad++)}${frame.file}:${frame.lineno}\x1b[0m${os.EOL}`);
            });
            process.stdout.write(os.EOL);
        });
}
function renderZoom(nth: number): void {
    logger.debug('renderZoom', nth);
    const columns = process.stdout.columns || 80;
    const pair = Array.from(allTests).filter(([, t]) => t.state === TestState.Failed)[nth - 1];
    if (!pair) {
        logger.error('renderZoom', nth, 'not found');
        return;
    }
    const [, test] = pair;
    let lines = 7;
    lines += test.stack.length * 2; // the stack and the error take this

    const windowLines = 14;
    writeline('\x1b[31;1m', [test.suite, test.name, test.filename, test.fullMessage, '\x1b[0m'].join(' '));
    const renderStack = [...test.stack].reverse();

    let pad = 0;
    renderStack.forEach(frame => {
        writeline(`\x1b[35m'${' '.repeat(2 * pad++)}${frame.file}:${frame.lineno}\x1b[0m`);
        lines++;
    });
    process.stdout.write(os.EOL);
    //find first line in stack
    renderStack.forEach(frame => {
        if (lines < (process.stdout.rows || 24)) {
            const filepath = frame.file;
            const line = frame.lineno;
            // inverse filename padded full width
            writeline('\x1b[7m', `${filepath}:${line}`.padEnd(columns), '\x1b[0m');

            if (fs.existsSync(filepath)) renderFileWindow(filepath, windowLines, line);
            lines += windowLines + 1;
        }
    });
}
function renderHelp(): void {
    write('Monitor Unit Testing Tool - MUTT', os.EOL);
    [
        `esc Default view`,
        `l show info level log`,
        `r re-run all tests`,
        `z Zoom into test failures`,
        `1-9 Zoom into test failure 1-9`,
        `p process list`,
        `q Quit`,
        `h Help`,
    ].forEach(line => writeline(line));
    writeline(mutt);
}
async function render(): Promise<void> {
    if (logger.type === 'stdout') return; // don't render if logging to stdout

    renderTestHeader();
    process.stdout.write('\x1b[5;0H'); // row 5
    if (mode >= '1' && mode <= '9') return renderZoom(Number.parseInt(mode, 10));
    else
        switch (mode) {
            case 'd':
                return renderAllTests();
            case 'z':
                return renderFailures();
            case 'p':
                await renderProcessList();
            case 'h':
                return renderHelp();
            default:
                writeline(`Nothing to show in mode '${mode}`);
        }
}

function run(paths: string[]): void {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode && process.stdin.setRawMode(true);
    process.stdin.on('keypress', (str, key) => {
        if (key.name === 'q') {
            writeline('\x1b[?25h'); // show cursor
            process.exit();
        } else if (key.name === 'r') {
            allTests.clear();
            allFiles.clear();
        } else if (key.name === 'l') {
            logger.level = 'info';
            logger.type = 'stdout'; // setting this will stop the render function
        } else if (key.name === 'd' || key.name === 'escape') {
            mode = 'd';
            logger.level = 'off';
            logger.type = 'file';
            render();
        } else {
            mode = key.name;
            render();
        }
    });
    write('\x1b[2J'); //clear
    write('\x1b[H'); // home
    write('\x1b[?25l'); // hide cursor

    setInterval(async () => {
        await readFiles(paths);
    }, config.refreshIntervalMs);
    setInterval(async () => {
        await render();
    }, config.refreshIntervalMs);
}

if (typeof argv.verbose !== 'undefined') {
    if (!['error', 'warn', 'debug', 'info'].includes(argv.verbose)) {
        logger.type = 'stdout';
        logger.level = 'error';
        logger.error('-v parameter must be one of error|warn|debug|info.');
        process.exit(12);
    }

    logger.level = argv.verbose as Levels;
    logger.type = 'file';
}
const paths = Array.isArray(argv.paths) && (argv.paths as string[]).length ? argv.paths : ['.'];
run(paths);
