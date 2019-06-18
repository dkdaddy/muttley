var Mocha = require('mocha');
// import {} from 'mocha';
import fs from 'fs';
import path from 'path';

// Instantiate a Mocha instance.
var mocha = new Mocha(
  {
    reporter: function () {
      //avoid logs
    },
    ui: 'bdd'
  });

var testFile = 'tests/game.t.js'

mocha.addFile(
  path.join('.', testFile)
);


// function MyReporter(runner:Runner) {
//   mocha.reporters.Base.call(this, runner);
//   var passes = 0;
//   var failures = 0;

//   runner.on('pass', function(test){
//     passes++;
//     console.log('pass: %s', test.fullTitle());
//   });

//   runner.on('fail', function(test, err){
//     failures++;
//     console.log('fail: %s -- error: %s', test.fullTitle(), err.message);
//   });

//   runner.on('end', function(){
//     console.log('end: %d/%d', passes, passes + failures);
//     process.exit(failures);
//   });
// }

// async function readTestCasesFromFile(file: string, stat: Stats): Promise<void> {
//     return new Promise((resolve, reject) => {
//         fs.readFile(file, (err, data) => {
//             if (err) {
//                 reject(err);
//             }
//             else {
//                 let fixture = '';
//                 let start;
//                 data.toString().split(os.EOL).forEach(line => {
//                     if ((start = line.indexOf(' describe')) >= 0 && line.slice(start + 9).startsWith('(\'')) {
//                         fixture = line.substr(start + 9).split("'")[1];
//                     }
//                     else if ((start = line.indexOf(' it')) >= 0 && line.slice(start + 3).startsWith('(\'')) {
//                         const name = line.substr(start + 3).split("'")[1];
//                         if (name) {
//                             const key = [file, fixture, name].join('-');
//                             const testcase = new Testcase(file, stat, fixture, name);
//                             const oldTest = allTests.get(key);
//                             if (oldTest) testcase.modified = true;
//                             allTests.set(key, testcase);
//                             l('adding', key, fixture, name);
//                             runTest(testcase);
//                         }
//                     }
//                 });
//                 resolve(void 0);
//             }
//         });
//     });
// } 
    // if (test && test!.stack) {
    //     test!.stack.split(os.EOL).slice(1, 4).forEach(frame => {
    //         const start = frame.indexOf('(/');
    //         const end = frame.indexOf(':', start);
    //         if (start > 0 && end > 0) {
    //             const filepath = frame.substr(start + 1, end - start - 1);
    //             const line = frame.substr(end + 1).split(':')[0];
    //             // inverse filename padded full width
    //             process.stdout.write('\x1b[7m' + (filepath + ':' + line).padEnd(columns) + '\x1b[0m');
    //             renderFileWindow(filepath, 14, Number.parseInt(line, 10));
    //         }
    //     });
    // }
// Run the tests. 
mocha.run()
  .on('pass', function (test: any) {
    console.log('pass: [%s] [%s] [%s]', test.fullTitle(), test.title, test.parent.fullTitle(), test.duration);
  })
  .on('fail', function (test: any, err: any) {
    console.log('failed: %s', test.fullTitle(), test.duration);
    console.log('error message:\n', err.message.replace(/\n+/g,'\n'));
    console.log('stack:\n', err.stack.replace(/\n+/g,'\n'));
  })
  .on('suite', function (suite: any) {
    console.log('suite: %s', suite.title);
  });
  console.log('tests running...');
