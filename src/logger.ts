import log4js from 'log4js';

log4js.configure({
    appenders: {
        stdout: { type: 'stdout' },
    },
    categories: { default: { appenders: ['stdout'], level: 'off' } },
});

let selectedLogger: log4js.Logger | null = null;
export type Levels = 'off' | 'error' | 'warning' | 'info' | 'debug';
let currentLevel: Levels = 'off';
let currentLogType: 'file' | 'stdout' = 'file';

const logger = {
    set level(level: Levels) {
        currentLevel = level;
        if (level === 'off') {
            selectedLogger = null;
        } else {
            if (!selectedLogger) {
                selectedLogger = log4js.getLogger(currentLogType);
            }
            selectedLogger.level = level;
        }
    },
    set type(typ: string) {
        currentLogType = typ as 'stdout' | 'file';
        if (typ !== 'stdout' && typ !== 'file')
            throw Error(`Invalid log type ${typ}`);
        // reconfigure. Done this way because adding a file appender causes file to be created
        if (currentLogType === 'file' && currentLevel !== 'off') {
            log4js.configure({
                appenders: {
                    file: { type: 'file', filename: './mutt.log' },
                    // stdout: { type: 'stdout' },
                },
                categories: { default: { appenders: ['file'], level: 'info' } },
            });
        }
        selectedLogger = log4js.getLogger(currentLogType);
        selectedLogger.level = currentLevel;
    },

    get type(): string {
        return currentLogType;
    },
    debug(...args: any[]) {
        selectedLogger && selectedLogger.debug('', ...args);
    },
    info(...args: any[]) {
        selectedLogger && selectedLogger.info('', ...args);
    },
    error(...args: any[]) {
        selectedLogger && selectedLogger.error('', ...args);
    },
};
export { logger };
