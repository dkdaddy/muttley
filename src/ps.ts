import ps from 'ps-node';
import { renderTable, FgColour } from './render';

interface Process {
    pid: string;
    command: string;
    arguments: string;
}
let processList: Process[] = [];

const psColumns = [
    { name: 'PID', width: 10, just: 'l', func: (row: Process) => row.pid },
    { name: 'COMMAND', width: 30, just: 'l', func: (row: Process) => row.command },
    { name: 'ARGS', width: 90, just: 'l', func: (row: Process) => row.arguments },
];
export function renderProcessList(): Promise<void> {
    // to avoid flicker between the clear and waiting for the callback, draw the latest list and update
    // the list in the callback
    return new Promise(resolve => {
        renderTable({ columns: psColumns, rowColour: () => FgColour.green, rows: processList });

        ps.lookup({ command: 'node' }, function(error, resultList): void {
            if (error) {
                throw new Error(error);
            }
            processList = resultList as Process[];
            resolve();
        });
    });
}
