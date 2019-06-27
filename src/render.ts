import os from 'os';
import fs from 'fs';

// for colours see https://stackoverflow.com/questions/4842424/list-of-ansi-color-escape-sequences
export enum FgColour {
    red = 31,
    green = 32,
    yellow = 33,
    blue = 34,
    magenta = 35,
    cyan = 36,
    white = 37,
}

const defaultColumns = 80,
    defaultRows = 24;
const columns = process.stdout.columns || defaultColumns;
const rows = process.stdout.rows || defaultRows;

export function write(...args: any[]): void {
    process.stdout.write(args.join(''));
}
export function writeline(...args: any[]): void {
    write(...args, os.EOL);
}

export interface Column {
    name: string;
    width: number;
    just: string;
    func: (row: any) => string | number;
}
export interface Table {
    columns: Column[];
    rows: {}[];
    rowColour: (row: {}) => FgColour;
}

export function renderTable(table: Table): void {
    const rowHeadings = table.columns.map((column): string => column.name.padEnd(column.width)).join(' ');
    writeline(rowHeadings);

    table.rows.forEach((row): void => {
        const color = table.rowColour(row);
        write(`\x1b[${color}m`);
        table.columns.forEach((column): void => {
            write(
                column
                    .func(row)
                    .toString()
                    .padEnd(column.width)
                    .substr(0, column.width),
                ' ',
            );
        });
        writeline('\x1b[0m');
    });
}
let lastTotal = 0,
    lastIdle = 0,
    lastSys = 0,
    lastUser = 0;
export function renderHeader(failing: number, running: number, fileCount: number): void {
    write('\x1b[2J'); //clear
    write('\x1b[0;0H'); // top left

    const oneHundred = 100;
    const decimalPlaces = 2;
    const cpuList: { times: { sys: number; user: number; idle: number } }[] = os.cpus();
    const sys = cpuList.map(cpu => cpu.times.sys).reduce((x, y) => x + y);
    const user = cpuList.map(cpu => cpu.times.user).reduce((x, y) => x + y);
    const idle = cpuList.map(cpu => cpu.times.idle).reduce((x, y) => x + y);
    const total = sys + user + idle;
    const totalDelta = total - lastTotal;
    const idleDelta = ((oneHundred * (idle - lastIdle)) / totalDelta).toFixed(decimalPlaces);
    const sysDelta = ((oneHundred * (sys - lastSys)) / totalDelta).toFixed(decimalPlaces);
    const userDelta = ((oneHundred * (user - lastUser)) / totalDelta).toFixed(decimalPlaces);
    lastIdle = idle;
    lastSys = sys;
    lastUser = user;
    lastTotal = total;
    const freeMem = ((oneHundred * os.freemem()) / os.totalmem()).toFixed(decimalPlaces);

    // time
    const timeWidth = 8;
    const isoOffsetToTime = 11;
    const msPerMinute = 60000;
    write(`\x1b[0;${columns - timeWidth}H`);
    const tzoffset = new Date().getTimezoneOffset() * msPerMinute; //offset in milliseconds
    write(new Date(Date.now() - tzoffset).toISOString().substr(isoOffsetToTime, timeWidth));

    // test summary
    write('\x1b[0;0H'); // top left again
    writeline(`Tests ${running + failing}, Failing ${failing}, Running ${running}, Files monitored ${fileCount}`);

    // system
    write(`CPU Usage ${userDelta}% user, ${sysDelta}% sys, ${idleDelta}% idle, ${freeMem}% mem free`);
}

export function renderFileWindow(filepath: string, height: number, line: number): void {
    const content = fs.readFileSync(filepath);
    const halfHeight = height / 2;
    const window = content
        .toString()
        .split(os.EOL)
        .slice(line - halfHeight, line + halfHeight);
    let rownum = line - halfHeight + 1;
    window.forEach((sourceline): void => {
        const prefix = rownum === line ? '\x1b[35m' : '';
        const rowNumColumnWidth = 6;
        writeline(prefix + (rownum++).toString().padEnd(rowNumColumnWidth), sourceline, '\x1b[0m');
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
