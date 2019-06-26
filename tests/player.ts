import { Direction, Position } from './level-view';
const initialLives=3;

export class Player {
    public readonly playerNumber: number;
    private _position: Position;
    private _lives: number;
    private _score: number;
    private _direction: Direction = Direction.Left;
    public constructor(player: number, position: Position = [1, 1], lives = initialLives, direction = Direction.Left) {
        this.playerNumber = player;
        this._position = position;
        this._lives = lives;
        this._score = 0;
        this._direction = direction;
    }
    public get position(): Position {
        return this._position;
    }
    public get score(): number {
        return this._score;
    }
    public get lives(): number {
        return this._lives;
    }
    public get direction(): Direction {
        return this._direction;
    }
    public moveTo(position: Position): void {
        this._position = position;
    }
    public addToScore(points: number): void {
        this._score += points;
    }
    public loseLife(): void {
        this._lives--;
    }
    public setDirection(direction: Direction): void {
        this._direction = direction;
    }
}
