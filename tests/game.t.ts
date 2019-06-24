// import { } from './fsmon';
import 'mocha';
import assert = require('assert');
import { Game } from './game';

describe('Game', function () {
    describe('constuctor', function () {
        it('score === 0', function () {
            const g = new Game();
            assert(g.player.score === 0);
        });
    });
});