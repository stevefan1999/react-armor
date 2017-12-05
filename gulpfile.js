require('babel-register')({
  only: ['config'],
  presets: require('./config/babel/node/dev'),
  retainLines: true,
});
require('babel-polyfill');
require('./config/gulp');
