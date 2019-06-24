var Mocha = require('mocha');
// import {} from 'mocha';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import os from 'os';
import parser from 'fast-xml-parser';

import { TestRunner } from './test-runner';

export class MochaTestRunner implements TestRunner {
    constructor() {}
    async findTests(filePath: string): Promise<{ suite: string; name: string }[]> {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    let suite = '';
                    let start;
                    const testcases: { suite: string; name: string }[] = [];
                    data.toString()
                        .split(os.EOL)
                        .forEach(line => {
                            if ((start = line.indexOf(' describe')) >= 0 && line.slice(start + 9).startsWith("('")) {
                                suite = line.substr(start + 9).split("'")[1];
                            } else if ((start = line.indexOf(' it')) >= 0 && line.slice(start + 3).startsWith("('")) {
                                const name = line.substr(start + 3).split("'")[1];
                                if (name) {
                                    testcases.push({ suite, name });
                                }
                            }
                        });
                    resolve(testcases);
                }
            });
        });
    }
    async runFile(
        filePath: string,
        onStart: () => void,
        onPass: (suite: string, name: string, duration: number) => void,
        onFail: (
            suite: string,
            name: string,
            fullMessage: string,
            message: string,
            stack: { file: string; lineno: number }[],
        ) => void,
        onEnd: (passed: number, failed: number) => void,
    ): Promise<void> {
        let passed = 0,
            failed = 0;
        const absoluteFilePath = path.resolve(process.cwd(), filePath);
        const isWin = process.platform === 'win32';
        // there must be a better way than this but running mocha directly on windows gives an error
        const cmd = isWin ? 'node' : 'mocha';
        const args = isWin
            ? [
                  'node_modules\\mocha\\bin\\mocha',
                  filePath,
                  '--reporter=xunit',
                  '--require',
                  'source-map-support/register',
              ]
            : [filePath, '--reporter=xunit', '--require', 'source-map-support/register'];
        execFile(cmd, args, (error: any, stdout: any, stderr: any) => {
            onStart();
            if (error) {
                l(`mocha exe returned : ${error}`);
            }
            l(`stdout: ${stdout}`);
            l(`stderr: ${stderr}`);
            if (!stderr) {
                // if there were errors in the runner avoid bad XML parse

                let cases: { classname: string; name: string; time: string; failure: string }[];
                const json = parser.parse(stdout, { ignoreAttributes: false, attributeNamePrefix: '' });
                const suite = json.testsuite;
                l(suite);
                // if there is only a single case the testcase is *not* an array! Arrrrgg!
                cases = suite.testcase.length ? suite.testcase : [suite.testcase];
                cases.forEach(t => {
                    if (!t.failure) {
                        l('pass: [%s] [%s] [%s]', t.classname, t.name, t.time);
                        passed++;
                        onPass(t.classname, t.name, 1000 * Number.parseFloat(t.time));
                    } else {
                        l('failed: [%s] [%s] [%s]', t.classname, t.name, t.time);
                        l('error message:\n', t.failure.replace(/\n+/g, '\n'));
                        failed++;
                        onFail(t.classname, t.name, t.failure, extractError(t.failure), extractStack(t.failure));
                    }
                });
            }
            onEnd(passed, failed);
        });
    }
}
function extractError(message: string) {
    return message.replace(/\n+/g, ' ');
}
function extractStack(stack: string): { file: string; lineno: number }[] {
    const ret: ReturnType<typeof extractStack> = [];
    stack.split(os.EOL).forEach(frame => {
        const start = frame.indexOf('(');
        const end = frame.indexOf(':', start);
        if (start > 0 && end > 0) {
            const filepath = frame.substr(start + 1, end - start - 1);
            const line = frame.substr(end + 1).split(':')[0];
            ret.push({ file: filepath, lineno: Number.parseInt(line, 10) });
        }
    });
    l('extractStack returns', ret);
    return ret;
}
let debug = false;
const l = debug ? console.log : () => {};
