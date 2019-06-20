var Mocha = require('mocha');
// import {} from 'mocha';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { TestRunner } from './test-runner';

export class MochaTestRunner implements TestRunner {
  constructor() {
  }
  async findTests(filePath: string): Promise<{ suite: string; name: string; }[]> {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, (err, data) => {
        if (err) {
          reject(err);
        }
        else {
          let suite = '';
          let start;
          const testcases: { suite: string; name: string; }[] = [];
          data.toString().split(os.EOL).forEach(line => {
            if ((start = line.indexOf(' describe')) >= 0 && line.slice(start + 9).startsWith('(\'')) {
              suite = line.substr(start + 9).split("'")[1];
            }
            else if ((start = line.indexOf(' it')) >= 0 && line.slice(start + 3).startsWith('(\'')) {
              const name = line.substr(start + 3).split("'")[1];
              if (name) {
                testcases.push({ suite, name });
              }
            }
          });
          resolve(testcases);
        }
      });
    });
  }
  async runFile(filePath: string,
    onStart: () => void,
    onPass: (suite: string, name: string, duration: number) => void,
    onFail: (suite: string, name: string, message: string, stack: { file: string; lineno: number; }[]) => void,
    onEnd: (passed: number, failed: number) => void): Promise<void> {
    let passed = 0, failed = 0;
    const mocha = new Mocha(
      {
        reporter: function () {
          //avoid logs
        },
        ui: 'bdd'
      });
    const absoluteFilePath = path.resolve(process.cwd(), filePath);
    // console.log('require cache', require.cache);
    Mocha.unloadFile(absoluteFilePath); // remove from cache or it won't run second time
    mocha.addFile(absoluteFilePath);
    mocha.run()
      .on('start', function () {
        l('******* onStart *******'); // is this getting called???
        onStart();
      })
      .on('pass', function (test: any) {
        l('pass: [%s] [%s] [%s]', test.fullTitle(), test.title, test.parent.fullTitle(), test.duration);
        passed++;
        onPass(test.parent.fullTitle(), test.title, test.duration);
      })
      .on('fail', function (test: any, err: any) {
        l('failed: %s', test.fullTitle(), test.duration);
        l('error message:\n', err.message.replace(/\n+/g, '\n'));
        l('stack:\n', err.stack.replace(/\n+/g, '\n'));
        failed++;
        onFail(test.parent.fullTitle(), test.title, err.message.replace(/\n+/g, ''), extractStack(err.stack));
      })
      .on('end', function () {
        mocha.unloadFiles();
        onEnd(passed, failed);
      });
    l('tests running...');
  }
}

function extractStack(stack: string): { file: string; lineno: number; }[] {
  const ret: ReturnType<typeof extractStack> = [];
  stack.split(os.EOL).forEach(frame => {
    const start = frame.indexOf('(');
    const end = frame.indexOf(':', start);
    if (start > 0 && end > 0) {
      const filepath = frame.substr(start + 1, end - start - 1);
      const line = frame.substr(end + 1).split(':')[0];
      ret.push({ file: filepath, lineno: Number.parseInt(line, 10) });
    }
  });
  l('extractStack returns', ret);
  return ret;
}
let debug = false;
const l = debug ? console.log : () => { };
