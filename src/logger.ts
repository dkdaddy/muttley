import log4js from 'log4js';

log4js.configure({
  appenders: { mutt: { type: 'file', filename: 'mutt.log' } },
  categories: { default: { appenders: ['mutt'], level: 'error' } }
});

const logger = log4js.getLogger('mutt');
logger.level = 'error';

export { logger };
