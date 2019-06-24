# mutt - Monitor Unit Test Tool

## Intro

mutt is a command line tool for watching unit test dependencies and running tests. For now it uses mocha but the intention is to make that a plugin.

To run it just type 'mutt' or 'npm start'.

The UI is inspired by the unix command 'top'. Type 'q' to quit and 'h' to see other commands.

There are no command line options yet - it simply scans from the current directory looking for .js files containing bdd style tests.

It then finds all the module dependencies for those files and monitors them, re-running the tests when anything changes.
## npm scripts

- build - tsc build
- watch - tsc -w build
- test - run tests
- lint - run eslint
- pretty - run prettier
- pretty-write - run prettier --write
- start - run mutt

## To Do
- [ ] add tests
- [ ] command line params - path, debug mode,
- [ ] improve proces list
- [ ] rationalise key handling, help text and mode switching
- [ ] limit file stack render based on row count
- [ ] config file using configstore - refresh rate, etc
- [ ] log4js
- [ ] jsdoc
- [ ] fix execFile code for Windows