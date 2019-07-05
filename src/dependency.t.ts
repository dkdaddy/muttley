import { tree } from './dependency';
import assert = require('assert');
import path from 'path';
import process from 'process';

describe('DependencyTree', function(): void {
    describe('getFlat', function(): void {
        it('throws if file not found', function() {
            const deps = tree;
            assert.throws(() => deps.getFlat('no file here'));
        });
        it('returns a single file', function() {
            const deps = tree;
            const list = deps.getFlat('./src/dependency.js');
            const expected = [path.resolve(process.cwd(), './src/logger.js')];
            assert.deepEqual(list, expected);
        });
        it('returns multiple files', function() {
            const deps = tree;
            const list = deps.getFlat('./src/mocha-runner.js');
            const expected = [
                path.resolve(process.cwd(), './src/test-runner.js'),
                path.resolve(process.cwd(), './src/logger.js'),
            ];
            assert.deepEqual(list, expected);
        });
    });
});
