import { Direction, Position } from './level-view';
export enum GhostState {
    Active,
    White,
    Blue,
    Inactive,
}
export class Ghost {
    position = [5, 2];
    state: GhostState = GhostState.Active;
    blueStartTime: Date | undefined = undefined;
    direction: Direction = Direction.Left;

    /**
     * update any real time state based on time ticking forward
     * @param clockMs time since start of game
     */
    tick(clockMs: number) {
        // move based on algo
    }
}
