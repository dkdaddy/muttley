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
