module.exports = {
  root: true,
  parserOptions: {
    parser: require.resolve('babel-eslint'),
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  env: {
    es6: true,
    node: true,
    browser: true
  },
  plugins: [
    "flowtype"
  ],
  extends: [
    "eslint:recommended",
    "plugin:flowtype/recommended"
  ],
  globals: {
    "__WEEX__": true,
    "WXEnvironment": true,
    "App": true,
    "Page": true
  },
  rules: {
    // 'no-console': process.env.NODE_ENV !== 'production' ? 0 : 2,
    'no-console': 'off',
    'no-useless-escape': 0,
    'no-empty': 0
  }
}
