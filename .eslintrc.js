module.exports = {
    'env': {
        'es6': true,
        'node': true
    },
    "extends": ["plugin:@typescript-eslint/recommended"],

    "parser": "@typescript-eslint/parser",
    'parserOptions': {
        'ecmaVersion': 2018,
        'sourceType': 'module',
        "project": "./tsconfig.json",
    },
    "plugins": ["@typescript-eslint"],
    'rules': {

        // possible errors

        'no-async-promise-executor': 'error',
        'no-await-in-loop': 'error',
        'no-console': 'error',
        'require-atomic-updates': 'error',

        //best practices

        'class-methods-use-this': 'error',
        'complexity': 'error',
        "complexity": ["error", 10],
        'default-case': 'error',
        'max-classes-per-file': 'error',
        'no-alert': 'error',
        'no-caller': 'error',
        'no-eq-null': 'error',
        'no-eval': 'error',
        'no-extend-native': 'error',
        'no-implied-eval': 'error',
        'no-invalid-this': 'error',
        'no-magic-numbers': ['error', { "ignore": [0,1], 'enforceConst':true }],
        'no-return-assign': 'error',
        'no-return-await': 'error',
        'no-self-compare': 'error',
        'no-sequences': 'error',
        'no-throw-literal': 'error',
        'no-useless-call': 'error',
        'no-useless-catch': 'error',
        'no-useless-concat': 'error',
        'require-await': 'error',
        'no-shadow': 'error',
        'no-undefined': 'error',

        //node.js
        'callback-return': 'error',
        'handle-callback-err': 'error',
        'no-buffer-constructor': 'error',
        'no-mixed-requires': 'error',
        'no-new-require': 'error',
        'no-path-concat': 'error',
        'no-process-env': 'error',
        'no-process-env': 'error',

        // stylistic
        "camelcase": "error",
        "comma-spacing": ["error", { "before": false, "after": true }],
        "func-call-spacing": ["error", "never"],
        "id-blacklist": ["error", "data", "err", "e", "cb", "callback"],
        "id-length": ["error", { "min": 2 }],
        'indent': [ 'error', 4, { "SwitchCase": 1 }],
        'linebreak-style': [ 'error', 'unix' ],
        "max-depth": ["error", 4],
        'max-len': ['error', 120],
        "max-lines": ["error", 400],
        "max-params": ["error", 6],
        "max-statements": ["error", 50],
        "newline-per-chained-call": ["error"],
        "no-array-constructor": "error",
        "no-continue": "error",
        "no-lonely-if": "error",
        "no-mixed-operators": "error",
        "no-multi-assign": "error",
        "no-negated-condition": "error",
        "no-nested-ternary": "error",
        "no-unneeded-ternary": "error",
        "operator-assignment": ["error", "always"],
        "operator-linebreak": ["error", "after"],
        "quotes": ["error", "single"],
        "semi": ["error", "always"],
        "semi-style": ["error", "last"],
        "sort-keys": ["off"],
        "semi": ["error", "always"],

        // es6
        "no-confusing-arrow": "error",
        "no-duplicate-imports": "error",
        "no-useless-computed-key": "error",
        "no-useless-constructor": "error",
        "no-var": "error",
        "object-shorthand": "error",
        "prefer-const": "error",
        "prefer-destructuring": "error",
        "prefer-rest-params": "error",
        "prefer-spread": "error",
        "prefer-template": "error",

        // typescript plugin

        '@typescript-eslint/no-for-in-array': "error",
        '@typescript-eslint/restrict-plus-operands': "error"
    },

}