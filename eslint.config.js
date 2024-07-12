import js from '@eslint/js';
import tsESLint from 'typescript-eslint';

export default [
    {
        files: ['**/*.ts'],
        plugins: {
            '@typescript-eslint': tsESLint.plugin,
        },
        languageOptions: {
            sourceType: 'module',
            parser: tsESLint.parser,
            parserOptions: {
                project: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    js.configs.recommended,
    {
        // This is a compatibility ruleset that:
        //  - disables rules from eslint:recommended which are already handled by TypeScript.
        //  - enables rules that make sense due to TS's typechecking / transpilation
        rules: {
            'constructor-super': 'off', // ts(2335) & ts(2377)
            'getter-return': 'off', // ts(2378)
            'no-const-assign': 'off', // ts(2588)
            'no-dupe-args': 'off', // ts(2300)
            'no-dupe-class-members': 'off', // ts(2393) & ts(2300)
            'no-dupe-keys': 'off', // ts(1117)
            'no-func-assign': 'off', // ts(2630)
            'no-import-assign': 'off', // ts(2632) & ts(2540)
            'no-new-native-nonconstructor': 'off', // ts(7009)
            'no-obj-calls': 'off', // ts(2349)
            'no-redeclare': 'off', // ts(2451)
            'no-setter-return': 'off', // ts(2408)
            'no-this-before-super': 'off', // ts(2376) & ts(17009)
            'no-undef': 'off', // ts(2304) & ts(2552)
            'no-unreachable': 'off', // ts(7027)
            'no-unsafe-negation': 'off', // ts(2365) & ts(2322) & ts(2358)
            'no-var': 'error', // ts transpiles let/const to var, so no need for vars any more
            'prefer-const': 'error', // ts provides better types with const
            'prefer-rest-params': 'error', // ts provides better types with rest args over arguments
            'prefer-spread': 'error', // ts transpiles spread to apply, so no need for manual apply
        },
    },
    {
        // typescript-eslint/recommended-type-checked-only
        rules: {
            '@typescript-eslint/await-thenable': 'error',
            '@typescript-eslint/no-array-delete': 'error',
            '@typescript-eslint/no-base-to-string': 'error',
            '@typescript-eslint/no-duplicate-type-constituents': 'error',
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/no-for-in-array': 'error',
            'no-implied-eval': 'off',
            '@typescript-eslint/no-implied-eval': 'error',
            '@typescript-eslint/no-misused-promises': 'error',
            '@typescript-eslint/no-redundant-type-constituents': 'error',
            '@typescript-eslint/no-unnecessary-type-assertion': 'error',
            '@typescript-eslint/no-unsafe-argument': 'error',
            '@typescript-eslint/no-unsafe-assignment': 'error',
            '@typescript-eslint/no-unsafe-call': 'error',
            '@typescript-eslint/no-unsafe-enum-comparison': 'error',
            '@typescript-eslint/no-unsafe-member-access': 'error',
            '@typescript-eslint/no-unsafe-return': 'error',
            '@typescript-eslint/no-unsafe-unary-minus': 'error',
            'no-throw-literal': 'off',
            '@typescript-eslint/only-throw-error': 'error',
            'prefer-promise-reject-errors': 'off',
            '@typescript-eslint/prefer-promise-reject-errors': 'error',
            'require-await': 'off',
            '@typescript-eslint/require-await': 'error',
            '@typescript-eslint/restrict-plus-operands': 'error',
            '@typescript-eslint/restrict-template-expressions': 'error',
            '@typescript-eslint/unbound-method': 'error',
        },
    },
    {
        files: ['**/*.test.ts'],
        rules: {
            '@typescript-eslint/no-floating-promises': 'off',
        },
    }
];
