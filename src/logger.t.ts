import { logger } from './logger';
import assert = require('assert');

describe('logger', function(): void {
    it('has level', function(): void {
        logger.level = 'off';
    });
    it('can set type', function(): void {
        logger.type = 'stdout';
        assert.equal(logger.type, 'stdout');
    });
    it('rejects bad type', function(): void {
        assert.throws(() => {
            logger.type = '?';
        });
    });
});
