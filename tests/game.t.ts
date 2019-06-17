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
        it('increases damage', function () {
            const p = new Player('one');
            p.hit(12);
            assert(p.damage === 2);
        }); 
    });    
    describe('addShield', function () {
        it('reduces damage', function () {
            const p = new Player('one');
            p.addShield();
            p.hit(12);
            assert(p.damage === 2);
        }); 
    });
});