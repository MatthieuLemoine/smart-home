const { createConfig, entryPoint, setOutput } = require('@webpack-blocks/webpack');
const babel  = require('@webpack-blocks/babel6');

module.exports = createConfig([
  entryPoint('./src/index.js'),
  setOutput('./public/bundle.js'),
  babel()
]);
