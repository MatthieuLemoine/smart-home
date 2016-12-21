const http    = require('http');
const express = require('express');
const path    = require('path');
const logger  = require('../logger');
const initWS  = require('./ws');
const record  = require('./record');

const PORT = process.env.PORT || 3000;

// Express app
const app    = express();
app.use(express.static(path.join(__dirname, '..', 'dist')));
const server = http.createServer(app);

const options = {
  width  : 640,
  height : 480,
  fps    : 20
};

record.setOptions(options);
record.start();

initWS(server, options, record);

server.listen(3000, () => logger.info(`Video surveillance service started on port ${PORT}`));

// Kill child on crash
process.on('uncaughtException', record.stop);
