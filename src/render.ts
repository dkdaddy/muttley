import os from 'os';
import fs from 'fs';

function write(...args: any[]): void {
    process.stdout.write(args.join(''));
}
function writeline(...args: any[]): void {
    write(...args, os.EOL);
}

type Column = {
    name: string;
    width: number;
    just: string;
    func: () => void;
};
type Table = { columns: Column[]; rows: {}[] };

export function renderTable(table: Table): void {
    const rowHeadings = table.columns.map(c => c.name.padEnd(c.width)).join(' ');
    process.stdout.write(rowHeadings);

    table.columns.forEach(column => {

    });
    table.rows.forEach(row => {
        table.columns.forEach(column => {

        });
    });
}
let lastTotal = 0,
    lastIdle = 0,
    lastSys = 0,
    lastUser = 0;
export function renderHeader(failing: number, running: number, fileCount: number): void {
    const columns = process.stdout.columns || 80;
    const rows = process.stdout.rows || 24;
    write('\x1b[2J'); //clear
    write('\x1b[0;0H'); // top left

    const cpuList: { times: { sys: number; user: number; idle: number } }[] = os.cpus();
    const sys = cpuList.map(cpu => cpu.times.sys).reduce((x, y) => x + y);
    const user = cpuList.map(cpu => cpu.times.user).reduce((x, y) => x + y);
    const idle = cpuList.map(cpu => cpu.times.idle).reduce((x, y) => x + y);
    const total = sys + user + idle;
    const totalDelta = total - lastTotal;
    const idleDelta = ((100 * (idle - lastIdle)) / totalDelta).toFixed(2);
    const sysDelta = ((100 * (sys - lastSys)) / totalDelta).toFixed(2);
    const userDelta = ((100 * (user - lastUser)) / totalDelta).toFixed(2);
    lastIdle = idle;
    lastSys = sys;
    lastUser = user;
    lastTotal = total;
    const freeMem = ((100 * os.freemem()) / os.totalmem()).toFixed(2);

    // time
    write(`\x1b[0;${columns - 8}H`);
    const tzoffset = new Date().getTimezoneOffset() * 60000; //offset in milliseconds
    write(new Date(Date.now() - tzoffset).toISOString().substr(11, 8));

    // test summary
    write('\x1b[0;0H'); // top left again
    writeline(
        `Tests ${running + failing}, Failing ${failing}, Running ${running}, Files monitored ${fileCount}`,
    );

    // system
    write(`CPU Usage ${userDelta}% user, ${sysDelta}% sys, ${idleDelta}% idle, ${freeMem}% mem free`);
}

export function renderFileWindow(filepath: string, rows: number, line: number): void {
    const content = fs.readFileSync(filepath);
    const window = content
        .toString()
        .split(os.EOL)
        .slice(line - rows / 2, line + rows / 2);
    let rownum = line - rows / 2 + 1;
    window.forEach((sourceline): void => {
        const prefix = rownum === line ? '\x1b[35m' : '';
        writeline(prefix + (rownum++).toString().padEnd(6), sourceline, '\x1b[0m');
    });
}

export function renderPacman(): void {
    // Oikake (追いかけ)

    // see https://en.wikipedia.org/wiki/ANSI_escape_code
    // const blue = '\x1b[94m';
    // const white = '\x1b[97m';

    // for (let i = 0; i < 40; i++) {
    //     process.stdout.write(blue + String.fromCodePoint(0x2551) + white + String.fromCodePoint(0x2022) + white);
    //     if (i < move) console.log();
    //     else if (move === i) console.log(String.fromCodePoint(0x1f354));
    //     else console.log(String.fromCodePoint(0x2022));
    // }
    // move = move > 30 ? 0 : move + 1;

    // process.stdout.write(
    //     [
    //         ,
    //         '\x1b[31m',
    //         // String.fromCodePoint(0x2560),
    //         // String.fromCodePoint(0x2550),
    //         // String.fromCodePoint(0x2550),
    //         String.fromCodePoint(0x2557),
    //         String.fromCodePoint(0x2022), // dot
    //         String.fromCodePoint(0x1f354), // burger
    //         String.fromCodePoint(0x1f3a7), // phones
    //         String.fromCodePoint(0x1f47b), // ghost https://en.wikipedia.org/wiki/Ghosts_(Pac-Man)
    //         String.fromCodePoint(0x1f3ae), // gamepad
            // '\x1b[0m',
        // ].join(''),
    // );
}
