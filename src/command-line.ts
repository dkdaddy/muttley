import yargs from 'yargs';

// eslint-disable-next-line
const argv = yargs
    .command(
        '* [paths...]',
        'Monitor all Unit Tests in the paths. If no paths supplied use current directory.',
        (args: yargs.Argv): yargs.Argv => {
            return args.positional('paths', {
                describe: 'paths to watch',
                type: 'string',
                default: '.'
            });
        },
    )
    .option('debug', {
        alias: 'd',
        description: 'start in debug mode',
        type: 'boolean',
    })
    .alias('v', 'verbose')
    .help()
    .alias('help', 'h').argv;

export { argv };
