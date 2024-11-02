module.exports = {
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser
  parserOptions: {
    project: './tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended', // Uses recommended rules from the @typescript-eslint/eslint-plugin
    'plugin:prettier/recommended', // Enables eslint-plugin-prettier and displays Prettier errors as ESLint errors
  ],
  rules: {
    'prettier/prettier': [
      'error',
      {
        semi: false, // Ensure semicolons are omitted
      },
    ],
    // Place to specify additional ESLint rules.
    // Note: ESLint rules that conflict with Prettier are already disabled by `eslint-config-prettier`.
  },
}
