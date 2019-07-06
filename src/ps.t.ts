import sinon from 'sinon';
import { renderProcessList } from './ps';
import assert = require('assert');
import render = require('./render');

describe('ps', function(): void {
    describe('render process list', function(): void {
        it('it calls renderTable', function() {
            const fakeRenderTable =
                // exercise each column accessor callback to improve coverage
                sinon.stub(render, 'renderTable').callsFake((table: render.Table): void => {
                    table.columns.forEach(column => {
                        column.func({ pid: 4, command: 'test', arguments: [] });
                    });
                });
            // sinon.replace(render, 'renderTable', fakeRenderTable);

            renderProcessList();
            assert(fakeRenderTable.calledOnce);
            sinon.restore();
        });
    });
});
