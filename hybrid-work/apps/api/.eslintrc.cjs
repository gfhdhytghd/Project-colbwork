module.exports = {
  extends: ['@hybrid-work/eslint-config', 'plugin:@typescript-eslint/recommended', 'prettier'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.json'],
  },
  ignorePatterns: ['dist', 'node_modules'],
};
