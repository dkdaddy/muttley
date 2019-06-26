import 'mocha';
import assert = require('assert');
import { Player } from './player';
import { Direction } from './level-view';

/* eslint-disable no-magic-numbers */

describe('Player', function(): void {
    describe('default constructor', function(): void {
        it('score === 0 etc', function(): void  {
            const player = new Player(1);
            assert.equal(player.playerNumber, 1);
            assert.equal(player.score, 0);
            assert.equal(player.lives, 3);
        });
    });
    describe('constructor', function(): void {
        it('sets values correctly', function(): void {
            const player = new Player(1, [2, 3], 4, Direction.Up);
            assert.equal(player.playerNumber, 1);
            assert.deepEqual(player.position, [2, 3]);
            assert.equal(player.score, 0);
            assert.equal(player.lives, 4);
            assert.equal(player.direction, Direction.Up);
        });
    });
    describe('moveTo', function(): void {
        it('moves', function(): void  {
            const player = new Player(1);
            player.moveTo([5, 6]);
            assert.deepEqual(player.position, [5, 6]);
        });
    });
    describe('addToScore', function(): void {
        it('adds to score', function(): void {
            const player = new Player(1);
            player.addToScore(6);
            assert.equal(player.score, 6);
        });
    });
    describe('loseLife', function(): void {
        it('decrements lives', function(): void {
            const player = new Player(1);
            player.loseLife();
            assert.equal(player.lives, 2);
        });
    });
    describe('setDirection', function(): void {
        it('sets direction', function(): void {
            const player = new Player(1);
            player.setDirection(Direction.Left);
            assert.equal(player.direction, Direction.Left);
            player.setDirection(Direction.Right);
            assert.equal(player.direction, Direction.Right);
            player.setDirection(Direction.Up);
            assert.equal(player.direction, Direction.Up);
            player.setDirection(Direction.Down);
            assert.equal(player.direction, Direction.Down);
        });
    });
});
