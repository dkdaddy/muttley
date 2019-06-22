// import { } from './fsmon';
import 'mocha';
import assert = require('assert');
import { Player } from './game';
import { readFileSync, read } from 'fs';

describe('Player2', function () {
    describe('constructor', function () {
        it('sets name', function () {
            const p = new Player('one');
            assert(p.name === 'one');
        })
        it('is a very slow test', () => {
            for (let i = 0; i < 1000; i++) {
                const thisFile = readFileSync(__filename);
                assert(thisFile);
            };
        })       
        it('is another very slow test', () => {
            for (let i = 0; i < 1000; i++) {
                const thisFile = readFileSync(__filename);
                assert(thisFile);
            };
        })       
        it('is also a very slow test', () => {
            for (let i = 0; i < 1000; i++) {
                const thisFile = readFileSync(__filename);
                assert(thisFile);
            };
        });
    });
});