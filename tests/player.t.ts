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
        });
    });
});