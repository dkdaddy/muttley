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
    console.log('pass: %s', test.fullTitle());
  })
  .on('fail', function (test: any) {
    console.log('fail: %s', test.fullTitle());
  })
  .on('suite', function (suite: any) {
    console.log('suite: %s', suite.fullTitle());
  })
