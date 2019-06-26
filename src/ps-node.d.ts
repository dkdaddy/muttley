declare module 'ps-node' {
    function lookup(match: { command: string }, func:
                           (error: string, result: {}[]) => void): void;
}
