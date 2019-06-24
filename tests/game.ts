import { Direction, Position } from './level-view';
import { Player } from './player';
import { Ghost } from './ghost';

export class Game {
    level: number = 1;
    points = 0;
    player: Player = new Player(1);
    ghosts: Ghost[] = [new Ghost(), new Ghost(), new Ghost(), new Ghost()];
    constructor() {}
    tick() {}
}
