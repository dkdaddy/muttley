import sinon from 'sinon';
import assert = require('assert');
import render = require('./render');
import fs = require('fs');

describe('render', function(): void {
    describe('renderHeader', function(): void {
        it('it calls write', function() {
            const fakeWrite = sinon.fake();
            sinon.replace(process.stdout, 'write', fakeWrite);
            render.renderHeader(100, 10, 12, 93982);
            assert(fakeWrite.called);
            sinon.restore();
        });
    });
    describe('renderTable', function(): void {
        it('it handles empty table', function() {
            const fakeWrite = sinon.fake();
            sinon.replace(process.stdout, 'write', fakeWrite);
            render.renderTable({ columns: [], rows: [], rowColour: () => render.FgColour.blue });
            assert(fakeWrite.calledOnce);
            sinon.restore();
        });
        it('it handles non empty table', function() {
            const columns = [{ name: 'TEST', width: 10, just: 'l', func: (row: { prop1: string }) => row.prop1 }];
            const rows = [{ prop1: 'test prop' }];
            const fakeWrite = sinon.fake();
            sinon.replace(process.stdout, 'write', fakeWrite);
            render.renderTable({ columns, rows, rowColour: () => render.FgColour.blue });
            const expectedHeaderWrites = 1;
            const expectedRowWrites = 3 * rows.length;
            assert.equal(fakeWrite.callCount, expectedHeaderWrites + expectedRowWrites);
            sinon.restore();
        });
    });
    describe('renderFileWindow', function(): void {
        it('it works for small window', function() {
            const buffer = 'line 1\nline 2\nline3\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n';
            sinon.replace(fs, 'readFileSync', sinon.fake.returns(buffer));
            const fakeWrite = sinon.fake();
            sinon.replace(process.stdout, 'write', fakeWrite);
            render.renderFileWindow('ignore', 10, 15);
            assert(fakeWrite.called);
            sinon.restore();
        });
        it('it works for big window', function() {
            const buffer = 'line 1\nline 2\nline3\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n';
            sinon.replace(fs, 'readFileSync', sinon.fake.returns(buffer));
            const fakeWrite = sinon.fake();
            sinon.replace(process.stdout, 'write', fakeWrite);
            render.renderFileWindow('ignore', 200, 15);
            assert(fakeWrite.called);
            sinon.restore();
        });
    });
});
