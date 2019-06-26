import ps from 'ps-node';

export function renderProcessList(): void {
    ps.lookup({ command: 'node' }, function(error, resultList): void {
        if (error) {
            throw new Error(error);
        }

        process.stdout.write('\x1b[2J'); //clear
        process.stdout.write('\x1b[0;0H'); // top left
        process.stdout.write('PID COMMAND ARGUMENTS');
        resultList.forEach(function(process: any): void {
            if (process) {
                process.stdout.write([process.pid, process.command, process.arguments].join(' '));
            }
        });
    });
}
