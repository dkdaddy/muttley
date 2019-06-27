# mutt - Monitor Unit Test Tool

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

## Intro

mutt is a command line tool for watching unit test dependencies and running tests. For now it uses mocha but the intention is to make that a plugin.

To run it just type 'mutt' or 'npm start'.

The UI is inspired by the unix command 'top'. Type 'q' to quit and 'h' to see other commands.

It then finds all the module dependencies for those files and monitors them, re-running the tests when anything changes.
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