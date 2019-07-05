import sinon from 'sinon';
import { FakeTestRunner } from './test-runner';
import assert = require('assert');

describe('FakeTestRunner', function(): void {
    describe('ctor', function(): void {
        it('it can be created', function() {
            const runner = new FakeTestRunner();
            assert.ok(runner, 'new runner is falsy');
        });
        it('calls the call backs', async function() {
            const runner = new FakeTestRunner();
            const onStart = sinon.fake();
            const onPass = sinon.fake();
            const onFail = sinon.fake();
            const onEnd = sinon.fake();
            await runner.runFileP('non existant file', onStart, onPass, onFail, onEnd);
            sinon.restore();

            assert(onStart.calledOnce);
            assert(onPass.calledThrice);
            assert(onFail.calledOnce); // the exec failure causes a fail testcase
            assert(onEnd.calledOnceWith(1, 3));
        });
    });
});
