const winston = require('winston');
const dateFns = require('date-fns');
const chalk   = require('chalk');

const levelColor = {
  trace   : 'white',
  debug   : 'blue',
  info    : 'green',
  warning : 'yellow',
  error   : 'red'
};

module.exports = new (winston.Logger)({
  level            : 'info',
  handleExceptions : false,
  transports : [
    new (winston.transports.Console)({
      timestamp() {
        return dateFns.format(new Date(), 'YYYY-MM-DD HH[h]mm');
      },
      formatter(params) {
        // Options object will be passed to the format function.
        // It's general properties are: timestamp, level, message, meta.
        return chalk[levelColor[params.level] || 'white'](
          `[${params.timestamp()}] ${params.message}`
        );
      },
    }),
  ],
});
