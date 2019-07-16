# mutt - Monitor Unit Test Tool

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

## Intro

mutt is a command line tool for watching unit test dependencies and running tests. By default it uses commonJS module loading for dependencies and mocha for test running. Config settings allow the dependency discovery and test runner to be customised.

To run it just type 'mutt' or 'npm start'.

It then finds all the module dependencies for those files and monitors them, re-running the tests when anything changes.

The UI is inspired by the unix command 'top'. Type 'q' to quit and 'h' to see other commands.

## How it works
-  test detection - it scans the folder reading each .js file and regex matches for bdd style tests
-  dependencies - it looks at the imports of each test file (in commonJS require form) and follows these, ignoring node_modules. This can be customised to use a different mechanism by supplying another module for this and specifying it in the config setting `dependencyModule`. It must have the same exports as src/dependency.ts.
-  watch for changes - it periodicaly (see config setting `refreshIntervalMs`) checks the mtime on each monitored file and re-runs any tests invalidated.
-  run test - on each file it thinks is a test file it runs mocha --reporter=xunit and parses the output. The test runner can be changed by settings in the config file - `testCmd` and `testArgs`.

## Usage
From the package folder you can run mutt on itself to see how it works
-  mutt src to monitor mutt's own unit tests
-  mutt demo to see it on the demo folder. The demo folder has some failing tests to illustrate mutt features. Type 'z' to see details of the failures or '1' to see source code.

## Docker
There is a Dockerfile which can be used as the basis for your own docker based test watcher. The default file builds mutt, runs it's tests and runs the app on itself.
```
docker build  -t mutt .
docker run -it mutt
```

Use `docker run` with -v and -w to map your code into the docker image.

## Know Issues
- mocha and source-map-support need to be installed globally or the process.exec won't find them
- It seems there are bugs in the xunit reporter for mocha so there are cases the XML does not contain all the tests. If you think mutt is not showing all your tests, run mocha cli with --reporter=xunit and check the output.
- Windows support - ymmv - you may be better off using the docker image

## npm scripts
- build - tsc build
- watch - tsc -w build
- test - run tests mocha
- jest - run tests with jest
- cover - run test with coverage stats in jest
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
