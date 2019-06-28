import { MochaTestRunner} from "./mocha-runner";
import assert = require('assert');
import { TestFailure } from './test-runner';

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
                {suite: 'ctor', name: 'it can be created'},
                {suite: 'findTestsP', name: 'finds no tests in itself'},
                {suite: 'findTestsP', name: 'finds these tests in myself'},
                {suite: 'runFileP', name: 'calls execFile'},
                ];
            const result = await runner.findTestsP('./src/mocha-runner.t.js');
            assert.deepEqual(result, expected);
        });
    });
    describe('runFileP', function() {
        it('calls execFile', async function() {
            const runner = new MochaTestRunner();
            // to do - create mocks for the callbacks
            
            const result = await runner.runFileP(
                    'non existant file',
                    () => {},
                    (suite: string, name: string, duration: number) => {
                        // assert.equal(suite, 'A');
                        // assert.equal(name, 'B');
                        // assert.equal(duration, 42);
                    },
                    (testFailure: TestFailure) => {
                        // assert.ok(testFailure);
                    },
                    (passed: number, failed: number) => {
                        // assert.equal(passed, 2);
                        // assert.equal(failed, 1);
                    });
            assert.deepEqual(result, 0);
        });
    });
});