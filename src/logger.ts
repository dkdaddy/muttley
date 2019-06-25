// var log4js = require('log4js');

// log4js.configure({
//   appenders: { cheese: { type: 'file', filename: 'mutt.log' } },
//   categories: { default: { appenders: ['mutt'], level: 'error' } }
// });

// const logger = log4js.getLogger('mutt');
// logger.level = 'debug';

export class Logger {
    // debug(...args) { logger.debug(...args); }
    public debug(...args: any[]): void {
        console.log(...args);
    }
}
