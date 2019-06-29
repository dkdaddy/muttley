import { Player } from './player';
import { Ghost } from './ghost';

export class Game {
    public level: number = 1;
    public points = 0;
    public player: Player = new Player(1);
    public ghosts: Ghost[] = [new Ghost(), new Ghost(), new Ghost(), new Ghost()];
}
