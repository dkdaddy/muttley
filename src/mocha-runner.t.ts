import { MochaTestRunner} from "./mocha-runner";
import assert = require('assert');

describe('MochaTestRunner', function(): void {
    describe('ctor', function(): void {
        it('is can be created', function() {
            const runner = new MochaTestRunner();
            assert.ok(runner);
        });
    });
    describe('findTestsP', function(): void {
        it('finds no tests in itself', function() {
            const runner = new MochaTestRunner();
            runner.findTestsP('./src/mocha-runner.js');
        });
        it('finds these tests in myself', function() {
            const runner = new MochaTestRunner();
            runner.findTestsP('./src/mocha-runner.t.js');
        });
    });
});