import sinon from 'sinon';
import { MochaTestRunner } from './mocha-runner';
import assert = require('assert');
import childProcess, { ChildProcess } from 'child_process';

describe('MochaTestRunner', function(): void {
    describe('ctor', function(): void {
        it('it can be created', function() {
            const runner = new MochaTestRunner();
            assert.ok(runner, 'new runner is falsy');
        });
    });

    describe('findTestsP', function(): void {
        it('finds no tests in itself', async function() {
            const runner = new MochaTestRunner();
            const expected: string[] = [];
            const result = await runner.findTestsP('./src/mocha-runner.js');
            assert.deepEqual(result, expected);
        });
        it('finds these tests in myself', async function() {
            const runner = new MochaTestRunner();
            const expected = [
                { suite: 'ctor', name: 'it can be created' },
                { suite: 'findTestsP', name: 'finds no tests in itself' },
                { suite: 'findTestsP', name: 'finds these tests in myself' },
                { suite: 'runFileP', name: 'handles execFile having an error' },
                { suite: 'runFileP', name: 'handles execFile failing tests' },
                { suite: 'runFileP', name: 'handles execFile passing tests' },
            ];
            const result = await runner.findTestsP('./src/mocha-runner.t.js');
            assert.deepEqual(result, expected);
        });
    });
    describe('runFileP', function() {
        it('handles execFile having an error', async function() {
            // logger.level = 'debug';
            // logger.type = 'stdout';
            // need the fake to call the callback
            const fakeExecFile = (
                file: string,
                args: any[],
                func: (error: string, stdout: string, stderr: string) => void,
            ): ChildProcess => {
                func('', '', 'file not found');
                return ({} as unknown) as ChildProcess;
            };

            sinon.replace(childProcess, 'execFile', fakeExecFile as typeof childProcess.execFile);
            const runner = new MochaTestRunner();
            const onStart = sinon.fake();
            const onPass = sinon.fake();
            const onFail = sinon.fake();
            const onEnd = sinon.fake();
            await runner.runFileP('non existant file', onStart, onPass, onFail, onEnd);
            sinon.restore();

            assert(onStart.calledOnce);
            assert(onPass.notCalled);
            assert(onFail.calledOnce); // the exec failure causes a fail testcase
            assert(onEnd.calledOnceWith(0, 0));
        });
        it('handles execFile failing tests', async function() {
            // logger.level = 'debug';
            // logger.type = 'stdout';
            const mochaStdout = `
                <testsuite name="Mocha Tests" tests="1" failures="0" errors="0" skipped="0" time="0.022">
                    <testcase classname="MyTestClass" name="myTest1" time="0.00">
                        <failure>it failed</failure>
                    </testcase>
                </testsuite>`;

            // need the fake to call the callback
            const fakeExecFile = (
                file: string,
                args: any[],
                func: (error: string, stdout: string, stderr: string) => void,
            ): ChildProcess => {
                func('', mochaStdout, '');
                return ({} as unknown) as ChildProcess;
            };

            sinon.replace(childProcess, 'execFile', fakeExecFile as typeof childProcess.execFile);
            const runner = new MochaTestRunner();
            const onStart = sinon.fake();
            const onPass = sinon.fake();
            const onFail = sinon.fake();
            const onEnd = sinon.fake();
            await runner.runFileP('has passing tests ', onStart, onPass, onFail, onEnd);
            sinon.restore();

            assert(onStart.calledOnce);
            assert(onPass.notCalled);
            assert(onFail.calledOnce);
            assert(onEnd.calledOnceWith(0, 1));

        });
        it('handles execFile passing tests', async function() {
            // logger.level = 'debug';
            // logger.type = 'stdout';
            const mochaStdout = `
                <testsuite name="Mocha Tests" tests="1" failures="1" errors="0" skipped="0" time="0.022">
                    <testcase classname="MyTestClass" name="myTest1" time="0.00"/>
                </testsuite>`;

            // need the fake to call the callback
            const fakeExecFile = (
                file: string,
                args: any[],
                func: (error: string, stdout: string, stderr: string) => void,
            ): ChildProcess => {
                func('', mochaStdout, '');
                return ({} as unknown) as ChildProcess;
            };

            sinon.replace(childProcess, 'execFile', fakeExecFile as typeof childProcess.execFile);
            const runner = new MochaTestRunner();
            const onStart = sinon.fake();
            const onPass = sinon.fake();
            const onFail = sinon.fake();
            const onEnd = sinon.fake();
            await runner.runFileP('has failing tests ', onStart, onPass, onFail, onEnd);
            sinon.restore();

            assert(onStart.calledOnce);
            assert(onPass.calledOnce);
            assert(onFail.notCalled);
            assert(onEnd.calledOnceWith(1, 0));
        });
    });
});
