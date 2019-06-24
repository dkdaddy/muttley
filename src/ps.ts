var ps = require('ps-node');

export function renderProcessList() {
    ps.lookup({ command: 'node' }, function(err: any, resultList: any) {
        if (err) {
            throw new Error(err);
        }

        process.stdout.write('\x1b[2J'); //clear
        process.stdout.write('\x1b[0;0H'); // top left
        resultList.forEach(function(process: any) {
            if (process) {
                console.log('PID: %s, COMMAND: %s, ARGUMENTS: %s', process.pid, process.command, process.arguments);
            }
        });
    });
}
