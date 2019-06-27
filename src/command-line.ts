import yargs from 'yargs';
import Configstore from 'configstore';

// eslint-disable-next-line prefer-destructuring
const argv = yargs
    .command(
        '* [paths...]',
        'Monitor all Unit Tests in the paths. If no paths supplied use current directory.',
        (args: yargs.Argv): yargs.Argv => {
            return args.positional('paths', {
                describe: 'paths to watch',
                type: 'string',
                default: '.',
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

export interface Config {
    refreshIntervalMs: number;
};
const configStore = new Configstore('mutt', {
    refreshIntervalMs: 800,
});

const config: Config = {
    get refreshIntervalMs(): number {
        return configStore.get('refreshIntervalMs');
    },
    set refreshIntervalMs(interval) {
        configStore.set('intervalMs', interval);
    }
};
export { argv, config };
