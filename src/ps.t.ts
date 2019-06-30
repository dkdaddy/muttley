import sinon from 'sinon';
import { renderProcessList } from './ps';
import assert = require('assert');
import render = require('./render');

describe('ps', function(): void {
    describe('render process list', function(): void {
        it('it calls renderTable', function() {
            const fakeRenderTable = sinon.fake();
            sinon.replace(render, 'renderTable', fakeRenderTable);
            renderProcessList();
            assert(fakeRenderTable.calledOnce);
            sinon.restore();
        });
    });
});