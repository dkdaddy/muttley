import sinon from 'sinon';
import { renderProcessList } from './ps';
import assert = require('assert');
import render = require('./render');
import ps = require('ps-node');

describe('ps', function(): void {
    describe('render process list', function(): void {
        it('it calls renderTable', async function() {
            const fakeRenderTable =
                // exercise each column accessor callback to improve coverage
                sinon.stub(render, 'renderTable').callsFake((table: render.Table): void => {
                    table.columns.forEach(column => {
                        column.func({ pid: 4, command: 'test', arguments: [] });
                    });
                });
            await renderProcessList();
            assert(fakeRenderTable.calledOnce);
            sinon.restore();
        });
        it('handles an error from ps.lookup', function(): void {
            const fakeLookup = (match: {}, func: (error: string, result: {}[]) => void): void => {
                if (match) func('an error', []);
            };
            sinon.replace(render, 'renderTable', sinon.fake());
            sinon.replace(ps, 'lookup', fakeLookup);
            assert.rejects(() => renderProcessList());
            sinon.restore();
        });
    });
});
