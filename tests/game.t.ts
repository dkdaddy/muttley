// import { } from './fsmon';
import 'mocha';
import assert = require('assert');
import { Player } from './game';

describe('Player', function () {
    describe('constructor', function () {
        it('requires name', function () {
            const p = new Player('one');
        }); 
        it('sets name', function () {
            const p = new Player('one');
            assert(p.name === 'one');
        });
    });
    describe('damage', function () {
        it('initially returns 0', function () {
            const p = new Player('one');
            assert(p.damage === 0);
        }); 
    });
    describe('hit', function () {
        it('causes damage', function () {
            const p = new Player('one');
            p.hit(1);
            assert(p.damage === 1);
        }); 
        it('increases damage', function () {
            const p = new Player('one');
            p.hit(1);
            p.hit(3);
            p.hit(7);
            p.hit(9);
            assert(p.damage === 20);
        }); 
    });    
    describe('addShield', function () {
        it('reduces damage', function () {
            const p = new Player('one');
            p.addShield();
            p.hit(13);
            assert(p.damage === 3);
        }); 
        it('does not create negative damage', function () {
            const p = new Player('one');
            p.addShield();
            p.hit(1);
            assert(p.damage === 0);
        }); 
        it('runs out', function () {
            const p = new Player('one');
            p.addShield();
            p.hit(100);
            assert(p.damage === 70);
        }); 
    });
});