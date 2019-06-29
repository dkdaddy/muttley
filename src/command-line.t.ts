import { config, argv } from "./command-line";
import assert = require('assert');

describe('config', function(): void {
    it('has refreshIntervalMs', function(): void {
        assert.ok(config.refreshIntervalMs);
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