
export interface TestRunner {
    findTests(filePath: string): Promise<{ suite: string, name: string }[]>;
    runFile(filePath: string,
        onStart: () => void,
        onPass: (suite: string, name: string, duration: number) => void,
        onFail: (suite: string, name: string, fullMessage: string, message: string, stack: { file: string, lineno: number }[]) => void,
        onEnd: (passed: number, failed: number) => void,
    ): Promise<void>;
}

export class FakeTestRunner implements TestRunner {
    private tests = [
        { file: 'game.t.js', suite: 'Player constructor', name: 'throws if no name' },
        { file: 'game.t.js', suite: 'Player constructor', name: 'accepts a name' },
        { file: 'game.t.js', suite: 'Player hit', name: 'reduces health' },
        { file: 'game.t.js', suite: 'Player hit', name: 'rejects negative value', message: 'does not throw', stack: [{ file: 'tests/game.t.ts', lineno: 27 }] }
    ];
    async findTests(filePath: string): Promise<{ suite: string; name: string; }[]> {
        return this.tests.filter(x => filePath.indexOf(x.file) >= 0);
    }
    async runFile(filePath: string, onStart: () => void,
        onPass: (suite: string, name: string, duration: number) => void,
        onFail: (suite: string, name: string, fullMessage: string, message: string, stack: { file: string; lineno: number; }[]) => void,
        onEnd: (passed: number, failed: number) => void): Promise<void> {
        setImmediate(onStart);
        this.tests.filter(test => !test.message).forEach(test => {
            setImmediate(() => {
                onPass(test.suite, test.name, 0);
            });
        });
        this.tests.filter(test => test.message).forEach(test => {
            setImmediate(() => {
                onFail(test.suite, test.name, test.message || '', test.message || '', test.stack || []);
            });
        });
        setImmediate(() => onEnd(3, 1));
    }
}