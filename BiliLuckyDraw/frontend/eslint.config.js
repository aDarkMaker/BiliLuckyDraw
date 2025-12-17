import js from '@eslint/js';
import vue from 'eslint-plugin-vue';
import tseslint from 'typescript-eslint';
import vueParser from 'vue-eslint-parser';

export default [
    { ignores: ['dist/**', 'node_modules/**', 'wailsjs/**', '*.d.ts'] },

    js.configs.recommended,

    ...tseslint.configs.recommended,

    ...vue.configs['flat/recommended'],

    {
        files: ['**/*.{ts,tsx,vue,js}', 'src/vite-env.d.ts'],
        languageOptions: {
            parser: vueParser,
            parserOptions: {
                parser: tseslint.parser,
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
            globals: {
                window: 'readonly',
                document: 'readonly',
                localStorage: 'readonly',
                alert: 'readonly',
            },
        },
        rules: {
            'vue/multi-word-component-names': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-empty-object-type': 'off',
            'vue/html-indent': 'off',
            'vue/max-attributes-per-line': 'off',
            'vue/html-self-closing': 'off',
            'vue/singleline-html-element-content-newline': 'off',
        },
    },
];
