import os from 'os';
import readline from 'readline';
import { Direction } from './level-view';

const map1 = `
BBBBBBBBBBBBBBBBBBBBBBBBBBBB
B............BB............B
B.BBBB.BBBBB.BB.BBBBB.BBBB.B
B.B  B.B   B.BB.B   B.B  B.B
B.BBBB.BBBBB.BB.BBBBB.BBBB.B
B..........................B
B.BBBB.BB.BBBBBBBB.BB.BBBB.B
B.BBBB.BB.BBBBBBBB.BB.BBBB.B
B......BB....BB....BB......B
BBBBBB.BBBBB.BB.BBBBB.BBBBBB
     B.BBBBB.BB.BBBBB.B
     B.BB....G.....BB.B
     B.BB.BB----BB.BB.B
BBBBBB.BB.B      B.BB.BBBBBB     
      ....B  G G B....B
BBBBBB....B      B....BBBBBB    
     B....BBBBBBBB....B
     B.BB..........BB.B
     B.BBBBB.BB.BBBBB.B
BBBBBB.BBBBB.BB.BBBBB.BBBBBB
B......BB....BB....BB......B
B.BBBB.BB.BBBBBBBB.BB.BBBB.B
B.BBBB.BB.BBBBBBBB.BB.BBBB.B
B..........................B
B.BBBB.BBBBB.BB.BBBBB.BBBB.B
B.B  B.B   B.BB.B   B.B  B.B
B.BBBB.BBBBB.BB.BBBBB.BBBB.B
B............BB............B
BBBBBBBBBBBBBBBBBBBBBBBBBBBB
`;
export = map1;
//Unicode Character “🍒” (U+1F352)
// U+255x	═	║	╒	╓	╔	╕	╖	╗	╘	╙	╚	╛	╜	╝	╞	╟
// U+256x	╠	╡	╢	╣	╤	╥	╦	╧	╨	╩	╪	╫	╬


const vertical = '║ ';
const horizontal = '══';
const thinwall = '--';
const tl = '╔═';
const tr = '╗ ';
const bl = '╚═';
const br = '╝ ';
const downt = '╦═';
const leftt = '╣ ';
const rightt = '╠═';
const ghost = '👻'; //0x1f47b;
const error = '??';
const dot = '• ';
const pacman = '🌗';
const fruit = '🍒';
const space = '  ';
const halfhorizontal = '═';

function writeline(...args: any[]): void {
    // eslint-disable-next-line no-console
    console.log(...args);
}
function write(...args: any[]): void {
    process.stdout.write(args.join(''));
}

class Level {
    private playerX = 11;
    private playerY = 18;
    private playerDirection: Direction = Direction.Right;
    private playerNextDirection: Direction = Direction.Right;
    private map: number[][];
    public constructor(map: string) {
        this.map = [];
        map.split(os.EOL).forEach(line => {
            const codes = [...line].map(char => char.charCodeAt(0));
            this.map.push(codes);
        });
        // writeline(this.map);
    }
    private at(x: number, y: number): string {
        const line = this.map[y];
        const code = line && line[x];
        return (line && code && String.fromCharCode(code)) || 'X';
    }
    private isTopLeft(x: number, y: number): boolean {
        return this.at(x, y) == 'B';

    }
    private corners(index: number, x: number, y: number): string {
        let code = error;
        if (index === 15) {
            const downleft = this.at(x - 1, y + 1);
            const downright = this.at(x + 1, y + 1);
            const upleft = this.at(x - 1, y - 1);
            const upright = this.at(x + 1, y - 1);
            if (downleft !== 'B')
                code = tr;
            else if (downright !== 'B')
                code = tl;
            else if (upleft !== 'B')
                code = br;
            else if (upright !== 'B')
                code = bl;
        }
        return code;
    }
    private thinblock(index: number, x: number, y: number): boolean {
        const downdown = this.at(x, y + 2);
        const upup = this.at(x, y - 2);
        const downleft = this.at(x - 1, y + 1);
        const downright = this.at(x + 1, y + 1);

        if (index === 13 && downdown !== 'B') return true;
        if (index === 13 && downleft === 'B' && downright === 'B') return true;
        if (index === 14 && upup !== 'B') return true;
        return false;
    }
    private getBlockChar(x: number, y: number): string {
        // consider l, r, u, d as booleans where they have a block or not
        // convert the four bits to a number 0-15
        // use that to index into an array of char to use in each scenario

        const left = this.at(x - 1, y) === 'B' ? 8 : 0;
        const right = this.at(x + 1, y) === 'B' ? 4 : 0;
        const up = this.at(x, y - 1) === 'B' ? 2 : 0;
        const down = this.at(x, y + 1) === 'B' ? 1 : 0;
        const index = left + right + up + down;
        const codes = [
            error,
            error,
            error,
            vertical,
            horizontal,
            tl,
            bl,
            vertical,
            horizontal,
            tr,
            br,
            vertical,
            horizontal,
            downt,
            vertical,
            error
        ];
        let code = codes[index];
        if (this.thinblock(index, x, y))
            code = horizontal; // thin block case
        if (index === 15)
            code = this.corners(index, x, y);
        if (index === 8 && this.at(x + 1, y) === 'X') // shorter on rh edge of map
            code = halfhorizontal;
        return code;
    }
    public renderLevel(): void {
        this.map.forEach((row, y) => {
            let out = '';
            row.forEach((position, x) => {
                const el = this.at(x, y);
                let char = dot;
                if (el === 'B') {
                    char = this.getBlockChar(x, y);
                }
                else if (el === ' ')
                    char = space;
                else if (el === '-')
                    char = thinwall;
                else if (el === 'G')
                    char = ghost;
                else if (this.playerX === x && this.playerY === y)
                    char = pacman;
                else if (el === 'F')
                    char = fruit;
                out += char;
            });
            process.stdout.write(out);
            process.stdout.write(os.EOL);
        });
    }
    public tick(): void {
        const x = this.playerX;
        const y = this.playerY;
        let newX = x;
        let newY = y;
        switch (this.playerDirection) {
            case Direction.Left:
                newX--;
                break;
            case Direction.Right:
                newX++;
                break;
            case Direction.Up:
                newY--;
                break;
            case Direction.Down:
                newY++;
                break;
            default:

        }
        const el = this.at(newX, newY);
        const directionChanged = this.playerDirection !== this.playerNextDirection;
        if (el === 'B') {
            this.playerDirection = this.playerNextDirection;
        }
        else if (directionChanged) {
            this.playerDirection = this.playerNextDirection;
            this.tick();
        }
        else {
            this.playerX = newX;
            this.playerY = newY;
        }
    }
    public setDirection(direction: Direction): void {
        this.playerNextDirection = direction;
    }
}

const level = new Level(map1);




write('\x1b[?1049l'); // revert alternative buffer
writeline('\x1b[?25h'); // show cursor


function run(): void {
    write('\x1b[?1049h'); // alternative buffer
    write('\x1b[2J'); //clear
    write('\x1b[H'); // home
    write('\x1b[?25l'); // hide cursor
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode && process.stdin.setRawMode(true);
    process.stdin.on('keypress', (str, key) => {
        if (key.name === 'q') {
            write('\x1b[?1049l'); // revert alternative buffer
            writeline('\x1b[?25h'); // show cursor
            process.exit();
        } else if (key.name === 'left') {
            level.setDirection(Direction.Left);
        } else if (key.name === 'right') {
            level.setDirection(Direction.Right);
        } else if (key.name === 'up') {
            level.setDirection(Direction.Up);
        } else if (key.name === 'down') {
            level.setDirection(Direction.Down);
        }
        else {
            write('\x1b[?1049l'); // revert alternative buffer
            writeline('\x1b[?25h'); // show cursor
            write(key.name);
            process.exit();
        }
    });
    setInterval(() => {
        write('\x1b[2J'); //clear
        write('\x1b[H'); // home    
        level.renderLevel();
    }, 100);
    setInterval(() => {
        level.tick();
    }, 100);
}

run();