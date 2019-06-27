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
    .option('verbose', {
        alias: 'v',
        description: 'Log to file. Pass info|debug|warn etc',
        type: 'string',
    })
    .help()
    .alias('help', 'h').argv;

const configStore = new Configstore('mutt', {
    refreshIntervalMs: 500,
});
/**
 * Config provides type safe accessors over the configStore object
 */
const config: Config = {
    /**
     * get the refresh rate for the display
     */
    get refreshIntervalMs(): number {
        return configStore.get('refreshIntervalMs');
    },
    /**
     * set the refresh rate for the display
     */
    set refreshIntervalMs(interval) {
        configStore.set('intervalMs', interval);
    },
};

export interface Config {
    refreshIntervalMs: number;
}

export { argv, config };
