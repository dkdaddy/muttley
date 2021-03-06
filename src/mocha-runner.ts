import fs from 'fs';
import os from 'os';
import parser from 'fast-xml-parser';
import { exec } from 'child_process';

import { TestRunner, TestFailure, FakeTestRunner } from './test-runner';
import { logger } from './logger';
import { config } from './command-line';

FakeTestRunner; // add a reference so the dependency remains in the js file because test depends on it

export class MochaTestRunner implements TestRunner {
    // eslint-disable-next-line class-methods-use-this
    public findTestsP(filePath: string): Promise<{ suite: string; name: string }[]> {
        return new Promise((resolve, reject): void => {
            fs.readFile(filePath, (error, content): void => {
                if (error) {
                    reject(error);
                } else {
                    let suite = '';
                    const testcases: { suite: string; name: string }[] = [];
                    content
                        .toString()
                        .split(os.EOL)
                        .forEach((line): void => {
                            const matchDescribe = line.match(/[^a-zA-Z0-9]describe\(['"](.*)['"]/);
                            const matchIt = line.match(/[^a-zA-Z0-9]it\(['"](.*)['"]/);
                            if (matchDescribe) {
                                [ , suite] = matchDescribe;
                            } else if (matchIt) {
                                const [ , name] = matchIt;
                                if (suite && name) {
                                    testcases.push({ suite, name });
                                }
                            }
                        });
                    logger.debug(`findTestsP ${filePath} => ${testcases}`);
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
        return new Promise(resolve => {
            let passed = 0,
                failed = 0;
            const cmd = config.testCmd;
            const args = [...config.testArgs, filePath];
            logger.debug('exec @', process.cwd(), cmd, args);
            exec([cmd, ...args].join(' '), (error: any, stdout: any, stderr: any): void => {
                onStart();
                if (error) {
                    // Note - if mocha has failing tests, error is set like this :
                    // {"killed":false,"code":3,"signal":null,"cmd":"mocha /usr/src/app/demo/player.t.js
                    // --reporter=xunit --require source-map-support/register"}
                    // code=3 for 3 failing tests
                    // in this case stderr is blank
                    logger.error(`mocha exe returned : ${error}`);
                    if (stderr) {
                        process.stdout.write(`error ${error.toString()}`);
                        process.stdout.write(JSON.stringify(error));
                        process.stdout.write(`stderr: ${stderr}`);
                        process.abort();
                    }
                }
                logger.debug(`stdout: ${stdout}`);
                logger.debug(`stderr: ${stderr}`);
                if (stderr) {
                    logger.error('stderr output. You crashed mocha!');
                    onFail({
                        suite: 'mutt',
                        name: 'mutt',
                        fullMessage: `stderr output. You crashed mocha! ' ${stderr}`,
                        message: 'stderr output. You crashed mocha!',
                        stack: extractStack(stderr),
                    });
                } else {
                    // if there were errors in the runner avoid bad XML parse

                    const json = parser.parse(stdout, { ignoreAttributes: false, attributeNamePrefix: '' });
                    const suite = json.testsuite;
                    logger.debug(suite);
                    // sometimes there is no testcase property on the suite.
                    // This is usually because the function tested is async
                    if (suite && suite.testcase) {
                        // if there is only a single case the testcase is *not* an array! Arrrrgg!
                        const cases: { classname: string; name: string; time: string; failure: string }[] = suite
                            .testcase.length
                            ? suite.testcase
                            : [suite.testcase];
                        cases.forEach((testcase): void => {
                            if (testcase.failure) {
                                logger.debug(`failed: [${testcase.classname}] [${testcase.name}] [${testcase.time}]`);
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
                                logger.debug(`passed: [${testcase.classname}] [${testcase.name}] [${testcase.time}]`);
                                passed++;
                                const msPerSeconds = 1000;
                                onPass(
                                    testcase.classname,
                                    testcase.name,
                                    msPerSeconds * Number.parseFloat(testcase.time),
                                );
                            }
                        });
                    } else {
                        logger.error('No testcase output. Are you calling an async function without await?', suite);
                        onFail({
                            suite: 'mutt',
                            name: 'mutt',
                            fullMessage: 'No testcase output. Are you calling an async function without await?',
                            message: 'No testcase output. Are you calling an async function without await?',
                            stack: [],
                        });
                    }
                }
                onEnd(passed, failed);
                resolve();
            });
        });
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
