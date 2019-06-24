import fs from 'fs';
import path from 'path';

export class DependencyTree {
    private root: string;
    private cache: Map<string, string[]>;
    public constructor(root: string) {
        this.root = root;
        this.cache = new Map();
    }

    public getFlat(filepath: string): string[] {
        let list;
        if ((list = this.cache.get(filepath))) return list;
        list = this.getImportsCommonJS(filepath);
        list && this.cache.set(filepath, list);
        return list;
    }

    public getImportsCommonJS(filepath: string): string[] {
        const list: string[] = [];
        const folder = path.dirname(filepath);
        fs.readFileSync(filepath)
            .toString()
            .split('\n')
            .forEach((line): void => {
                const imports = line.match(/.*require\((.*)\).*/);
                if (imports) {
                    if (imports[1].indexOf("'") >= 0 || imports[1].indexOf('"') >= 0) {
                        const targetModule = imports[1].replace(/['"]/g, '');
                        let resolvedPath;
                        if (targetModule.startsWith('.')) {
                            resolvedPath = path.resolve(folder, targetModule);
                            if (resolvedPath.endsWith('.js') || resolvedPath.endsWith('.json')) {
                            } else if (fs.existsSync(resolvedPath)) {
                                resolvedPath += '/index.js';
                            } else {
                                resolvedPath += '.js';
                            }
                        } else {
                            // for now ignore node modules
                            resolvedPath = targetModule;
                            // resolvedPath = require.resolve(targetModule);
                        }
                        // for native modules resolve just returns the module name
                        if (resolvedPath !== targetModule) {
                            list.push(resolvedPath);
                            // l(filepath, 'imports', targetModule, resolvedPath);
                        }
                    }
                    // else it is dynamically computing target string
                }
            });
        const nextLevel: string[] = [];
        list.forEach((file): string[] => nextLevel.concat(this.getImportsCommonJS(file)));
        return [...list, ...nextLevel];
    }
}
