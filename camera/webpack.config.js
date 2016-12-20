const { createConfig, entryPoint, setOutput } = require('@webpack-blocks/webpack');
const babel  = require('@webpack-blocks/babel6');

module.exports = createConfig([
  entryPoint('./app/index.js'),
  setOutput('./dist/bundle.js'),
  babel()
]);
