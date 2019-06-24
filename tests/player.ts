import { Direction, Position } from './level-view';

export class Player {
    readonly playerNumber: number;
    _position: Position;
    _lives: number;
    _score: number;
    _direction: Direction = Direction.Left;
    constructor(player: number, position: Position = [1, 1], lives = 3, direction = Direction.Left) {
        this.playerNumber = player;
        this._position = position;
        this._lives = lives;
        this._score = 0;
        this._direction = direction;
    }
    get position() { return this._position; }
    get score() { return this._score; }
    get lives() { return this._lives; }
    get direction() { return this._direction; }

    moveTo(position:Position) {
        this._position = position;
    }
    addToScore(points:number) {
        this._score += points;
    }
    loseLife() {
        this._lives--;
    }
    setDirection(direction:Direction) {
        this._direction = direction;
    }
    /**
     * update any real time state based on time ticking forward
     * @param clockMs time since start of game
     */
    tick(clockMs:number) {
        // move based on algo
    }
}