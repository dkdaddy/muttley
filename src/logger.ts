import log4js from 'log4js';

log4js.configure({
  appenders: { 
              //  file: { type: 'file', filename: './mutt.log' },
               stdout: { type: 'stdout' } },
  categories: { default: { appenders: ['stdout'], level: 'off' } }
  
});

let selectedLogger: log4js.Logger|null = null;

let currentLevel='off';
let currentLogType='off';

const logger = {
  set level(level: string) {
    currentLevel = level;
    if (level === 'off') {
      selectedLogger = null;
    }
    else {
      if (!selectedLogger) {
        selectedLogger = log4js.getLogger(currentLogType);
      } 
      selectedLogger.level = level;
    }
  },
  set stdout(onOrOff: boolean) {
    currentLogType = onOrOff?'stdout':'off';
    selectedLogger = log4js.getLogger(currentLogType);
    selectedLogger.level = currentLevel;
  },
  get stdout(): boolean {
    return currentLogType==='stdout';
  },
  debug(...args: any[]) { selectedLogger && selectedLogger.debug(args);},
  info(...args: any[]) { selectedLogger && selectedLogger.info(args);}
};
export { logger };
