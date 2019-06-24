export enum MapItem {
    Wall,
    Dot,
    Power,
    Gate,
    Fruit,
    Empty,
}
export enum Direction {
    Up,
    Down,
    Left,
    Right,
}
export type Position = [number, number];

/**
 * read only view of the map
 */
export interface MapView {
    width: number;
    height: number;
    item(location: Location): MapItem;
}

/**
 * read only view of the level available to players and ghosts
 */
export interface LevelView {
    map: MapView;
    playerLocations: Location[];
    ghostLocations: Location[];
}

export function newPosition([x, y]: Position, direction: Direction): Position {
    let newPosition: Position;
    switch (direction) {
        case Direction.Up:
            newPosition = [x, y + 1];
            break;
        case Direction.Down:
            newPosition = [x, y - 1];
            break;
        case Direction.Left:
            newPosition = [x - 1, y];
            break;
        case Direction.Up:
            newPosition = [x + 1, y];
            break;
    }
    return newPosition!;
}
