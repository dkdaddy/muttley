// import { } from './fsmon';
import 'mocha';
import assert = require('assert');
import { Game } from './game';

describe('Game', function(): void {
    describe('constuctor', function(): void {
        it('score === 0', function(): void {
            const game = new Game();
            assert(game.player.score === 0);
        });
    });
});
