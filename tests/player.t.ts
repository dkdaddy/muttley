import 'mocha';
import assert = require('assert');
import { Player } from './player';
import { Direction } from './level-view';

describe('Player', function () {
    describe('default constructor', function () {
        it('score === 0 etc', function () {
            const p = new Player(1);
            assert.equal(p.playerNumber, 1);
            assert.equal(p.score, 0);
            assert.equal(p.lives, 3);
        })
    });
    describe('constructor', function () {
        it('sets values correctly', function () {
            const p = new Player(1, [2, 3], 4, Direction.Up);
            assert.equal(p.playerNumber, 1);
            assert.deepEqual(p.position, [2,3]);
            assert.equal(p.score, 0);
            assert.equal(p.lives, 4);
            assert.equal(p.direction, Direction.Up);
        })
    });
    describe('moveTo', function () {
        it('moves', function() {
            const p = new Player(1);
            p.moveTo([5,6]);
            assert.deepEqual(p.position, [5,6]);
        });
    }); 
    describe('addToScore', function () {
        it('adds to score', function() {
            const p = new Player(1);
            p.addToScore(6);
            assert.equal(p.score, 6);
        });
    });
    describe('loseLife', function () {
        it('decrements lives', function() {
            const p = new Player(1);
            p.loseLife();
            assert.equal(p.lives, 2);
        });
    });
    describe('setDirection', function () {
        it('sets direction', function() {
            const p = new Player(1);
            p.setDirection(Direction.Left);
            assert.equal(p.direction, Direction.Left);
            p.setDirection(Direction.Right);
            assert.equal(p.direction, Direction.Right);
            p.setDirection(Direction.Up);
            assert.equal(p.direction, Direction.Up);
            p.setDirection(Direction.Down);
            assert.equal(p.direction, Direction.Down);
        });
    });
});