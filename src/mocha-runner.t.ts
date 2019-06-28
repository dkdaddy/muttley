import { MochaTestRunner} from "./mocha-runner";
import assert = require('assert');

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
                ];
            const result = await runner.findTestsP('./src/mocha-runner.t.js');
            assert.deepEqual(result, expected);
        });
    });

    // to do - stub execFile and test runFileP
});