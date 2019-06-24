const yargs = require('yargs');

const argv = yargs
    .command('mutt', 'Monitor Unit Tests', {
        path: {
            description: 'path to search for tests',
            alias: 'y',
            type: 'string',
        },
    })
    .option('time', {
        alias: 't',
        description: 'Tell the present Time',
        type: 'boolean',
    })
    .help()
    .alias('help', 'h').argv;
