import ps from 'ps-node';
import os from 'os';

export function renderProcessList(): void {
    ps.lookup({ command: 'node' }, function(error, resultList): void {
        if (error) {
            throw new Error(error);
        }

        process.stdout.write('\x1b[2J'); //clear
        process.stdout.write('\x1b[0;0H'); // top left
        process.stdout.write('PID COMMAND ARGUMENTS');
        resultList.forEach(function(proc: any): void {
            if (proc) {
                process.stdout.write([proc.pid, proc.command, proc.arguments, os.EOL].join(' '));
            }
        });
    });
}
