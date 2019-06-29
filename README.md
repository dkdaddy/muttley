# mutt - Monitor Unit Test Tool

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

## Intro

mutt is a command line tool for watching unit test dependencies and running tests. For now it uses mocha but the intention is to make that a plugin.

To run it just type 'mutt' or 'npm start'.

The UI is inspired by the unix command 'top'. Type 'q' to quit and 'h' to see other commands.

It then finds all the module dependencies for those files and monitors them, re-running the tests when anything changes.


## How it works
-  test detection - it scans the folder reading each .js file and regex matches for bdd style tests
-  dependencies - it looks at the imports of each test file ( in commonJS require form) and follows these, ignoring node_modules
-  watch for changes - it periodicaly (see config setting) checks the mtime on each monitored files and re-runs the tests
-  run test - on each file it thinks is a test file it runs mocha --reporter=xunit and parses the output

## Usage
From the package folder you can runn mutt on itself to see how it works
-  mutt src to monitor mutt's own unit tests
-  mutt demo to see it on the demo folder. The demo folder has some failing tests to illustrate mutt features. Type 'z' to see details of the failures or '1' to see source code.

## Know Issues
 It seems there are bugs in the xunit reporter for mocha so there are cases the XML does not contain all the tests. If you think mutt is not showing all your tests, run mocha cli with --reporter=xunit and check the output.

## npm scripts
- build - tsc build
- watch - tsc -w build
- test - run tests
- lint - run eslint
- pretty - run prettier
- pretty-write - run prettier --write
- start - run mutt

## mutt -h
```
mutt [paths...]
Monitor all Unit Tests in the paths. If no paths supplied use current directory.

Positionals:
  paths  paths to watch                                  [string] [default: "."]

Options:
  --version      Show version number                                   [boolean]
  --verbose, -v  Log to file. Pass info|debug|warn etc                 [string]
  --help, -h     Show help                                             [boolean]
  ```