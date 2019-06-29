import { Direction } from './level-view';
export enum GhostState {
    Active,
    White,
    Blue,
    Inactive,
}
export class Ghost {
    private position = [0, 0];
    private state: GhostState = GhostState.Active;
    private blueStartTime: Date | undefined;
    private direction: Direction = Direction.Left;

    /**
     * update any real time state based on time ticking forward
     * @param clockMs time since start of game
     */
    // eslint-disable-next-line
    public tick(clockMs: number): void {
        // move based on algo
    }
}
