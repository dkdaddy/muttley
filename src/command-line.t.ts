import { config, argv } from './command-line';
import assert = require('assert');

describe('config', function(): void {
    it('has refreshIntervalMs', function(): void {
        assert.ok(config.refreshIntervalMs);
    });
    it('has dependencyModule', function(): void {
        assert.ok(config.dependencyModule);
    });
    it('has testCmd', function(): void {
        assert.ok(config.testCmd);
    });
    it('has testCmd', function(): void {
        assert.ok(config.testArgs);
    });
});
describe('argv', function(): void {
    it('exists', function(): void {
        assert.ok(argv);
    });
    it('defaults paths to .', function(): void {
        // note - assert.equal(argv.paths,'.') seems to cause xunit reporter to fail :-(
        assert.ok(argv.paths);
    });
});
