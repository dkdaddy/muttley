import fs from 'fs';
import os from 'os';
import parser from 'fast-xml-parser';
import { execFile } from 'child_process';

import { TestRunner, TestFailure } from './test-runner';
import { logger } from './logger';

export class MochaTestRunner implements TestRunner {
    // eslint-disable-next-line class-methods-use-this
    public findTestsP(filePath: string): Promise<{ suite: string; name: string }[]> {
        return new Promise((resolve, reject): void => {
            fs.readFile(filePath, (error, content): void => {
                if (error) {
                    reject(error);
                } else {
                    let suite = '';
                    let start;
                    const testcases: { suite: string; name: string }[] = [];
                    content
                        .toString()
                        .split(os.EOL)
                        .forEach((line): void => {
                            const describeString = ' describe';
                            const itString = ' it';
                            if (
                                (start = line.indexOf(describeString)) >= 0 &&
                                line.slice(start + describeString.length).startsWith("('")
                            ) {
                                [, suite] = line.substr(start + describeString.length).split("'");
                            } else if (
                                (start = line.indexOf(itString)) >= 0 &&
                                line.slice(start + itString.length).startsWith("('")
                            ) {
                                const [, name] = line.substr(start + itString.length).split("'");
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
    // eslint-disable-next-line class-methods-use-this
    public runFileP(
        filePath: string,
        onStart: () => void,
        onPass: (suite: string, name: string, duration: number) => void,
        onFail: (testFailure: TestFailure) => void,
        onEnd: (passed: number, failed: number) => void,
    ): Promise<void> {
        let passed = 0,
            failed = 0;
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
        logger.debug('exec @', process.cwd(), cmd, args);
        execFile(cmd, args, (error: any, stdout: any, stderr: any): void => {
            onStart();
            if (error) {
                logger.debug(`mocha exe returned : ${error}`);
            }
            logger.debug(`stdout: ${stdout}`);
            logger.debug(`stderr: ${stderr}`);
            if (!stderr) {
                // if there were errors in the runner avoid bad XML parse

                const json = parser.parse(stdout, { ignoreAttributes: false, attributeNamePrefix: '' });
                const suite = json.testsuite;
                logger.debug(suite);
                // if there is only a single case the testcase is *not* an array! Arrrrgg!
                const cases: { classname: string; name: string; time: string; failure: string }[] = suite.testcase
                    .length
                    ? suite.testcase
                    : [suite.testcase];
                cases.forEach((testcase): void => {
                    if (testcase.failure) {
                        logger.debug('failed: [%s] [%s] [%s]', testcase.classname, testcase.name, testcase.time);
                        logger.debug('error message:\n', testcase.failure.replace(/\n+/g, '\n'));
                        failed++;
                        onFail({
                            suite: testcase.classname,
                            name: testcase.name,
                            fullMessage: testcase.failure,
                            message: extractError(testcase.failure),
                            stack: extractStack(testcase.failure),
                        });
                    } else {
                        logger.debug('pass: [%s] [%s] [%s]', testcase.classname, testcase.name, testcase.time);
                        passed++;
                        const msPerSeconds = 1000;
                        onPass(testcase.classname, testcase.name, msPerSeconds * Number.parseFloat(testcase.time));
                    }
                });
            }
            onEnd(passed, failed);
        });
        return Promise.resolve();
    }
}
function extractError(message: string): string {
    return message.replace(/\n+/g, ' ');
}
function extractStack(stack: string): { file: string; lineno: number }[] {
    const ret: ReturnType<typeof extractStack> = [];
    stack.split(os.EOL).forEach((frame): void => {
        const start = frame.indexOf('(');
        const end = frame.indexOf(':', start);
        if (start > 0 && end > 0) {
            const filepath = frame.substr(start + 1, end - start - 1);
            const [line] = frame.substr(end + 1).split(':');
            ret.push({ file: filepath, lineno: Number.parseInt(line, 10) });
        }
    });
    logger.debug('extractStack returns', ret);
    return ret;
}
