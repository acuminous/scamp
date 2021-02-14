module.exports = {
  'env': {
    'node': true,
    'es2015': true,
  },
  'extends': 'esnext',
  'parserOptions': {
    'ecmaVersion': 'es2015'
  },
  'rules': {
    'class-methods-use-this': 'off',
    'indent': ['error', 2],
    'import/no-commonjs': 'off',
    'import/no-nodejs-modules': 'off',
    'no-empty-function': 'off',
    'no-prototype-builtins': 'off',
    'no-use-before-define': 'off',
    'semi': ['error', 'always'],
  }
};
