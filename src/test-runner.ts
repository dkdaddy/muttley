import path from 'path';

export interface TestFailure {
    suite: string;
    name: string;
    fullMessage: string;
    message: string;
    stack: { file: string; lineno: number }[];
}

/**
 * Interface for test runners. Mutt does not assume any particular test runner
 */
export interface TestRunner {
    /**
     * Find all tests in the file
     * @param filePath absolute path
     * @returns list of suite and name
     */
    findTestsP(filePath: string): Promise<{ suite: string; name: string }[]>;
    /**
     * Run the tests in the file and return results aynchronously via the callbacks
     * @param filePath absolute file path
     * @param onStart callback for starting the tests
     * @param onPass callback for each passing test
     * @param onFail callback for each failing test
     * @param onEnd callback for end of tests
     */
    runFileP(
        filePath: string,
        onStart: () => void,
        onPass: (suite: string, name: string, duration: number) => void,
        onFail: (failure: TestFailure) => void,
        onEnd: (passed: number, failed: number) => void,
    ): Promise<void>;
}
/**
 * Fake test runner for testing the test runner
 */
export class FakeTestRunner implements TestRunner {
    private tests = [
        { file: 'game.t.js', suite: 'Player constructor', name: 'throws if no name', message: '', stack: [] },
        { file: 'game.t.js', suite: 'Player constructor', name: 'accepts a name', message: '', stack: [] },
        { file: 'game.t.js', suite: 'Player hit', name: 'reduces health', message: '', stack: [] },
        {
            file: 'game.t.js',
            suite: 'Player hit',
            name: 'rejects negative value',
            message: 'does not throw',
            stack: [{ file: 'tests/game.t.ts', lineno: 27 }],
        },
    ];
    public findTestsP(filePath: string): Promise<{ suite: string; name: string }[]> {
        const filename = path.basename(filePath);
        // match the fake test cases to the filepath
        return Promise.resolve(this.tests.filter((testcase): boolean => filename.indexOf(testcase.file) >= 0));
    }
    public runFileP(
        filePath: string,
        onStart: () => void,
        onPass: (suite: string, name: string, duration: number) => void,
        onFail: (failure: TestFailure) => void,
        onEnd: (passed: number, failed: number) => void,
    ): Promise<void> {
        return new Promise(resolve => {
            setImmediate(onStart);
            this.tests
                .filter((test): boolean => {
                    return !test.message;
                })
                .forEach((test): void => {
                    setImmediate((): void => {
                        onPass(test.suite, test.name, 0);
                    });
                });
            this.tests
                .filter((test): boolean => !!test.message)
                .forEach((test): void => {
                    setImmediate((): void => {
                        onFail({
                            suite: test.suite,
                            name: test.name,
                            fullMessage: test.message,
                            message: test.message,
                            stack: test.stack,
                        });
                    });
                });
            const passCount = this.tests.filter((test): boolean => !!test.message).length;
            setImmediate((): void => {
                onEnd(passCount, this.tests.length - passCount);
                resolve();
            });
        });
    }
}
