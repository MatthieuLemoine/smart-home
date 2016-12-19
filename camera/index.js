const http            = require('http');
const express         = require('express');
const path            = require('path');
const util            = require('util');
const spawn           = require('child_process').spawn;
const WebSocketServer = require('ws').Server;
const Splitter        = require('stream-split');

const PORT         = process.env.PORT || 3000;
const NALseparator = new Buffer([0, 0, 0, 1]);

// Express app
const app  = express();
app.use(express.static(path.join(__dirname, 'public')));

const server  = http.createServer(app);

const options = {
  width  : 640,
  height : 480,
  fps    : 20
};

const wss = new WebSocketServer({ server });
wss.on('connection', onNewClient);
let readStream;

function onNewClient(socket) {
  console.info('New client');

  socket.send(JSON.stringify({
    action : 'init',
    width  : options.width,
    height : options.height,
  }));

  socket.on('message', data => {
    const cmd = `${data}`;
    const action = cmd.split(' ')[0];
    console.info("Incomming action '%s'", action);

    if (action === 'REQUESTSTREAM') {
      startFeed();
    } else if (action === 'STOPSTREAM' && readStream) {
      readStream.pause();
    }
  });

  socket.on('close', () => {
    if (readStream) {
      readStream.end();
    }
  });
}

function startFeed() {
  const stream = getFeed();
  readStream = stream.pipe(new Splitter(NALseparator));
  readStream.on('data', broadcast);
}

function broadcast(data) {
  wss.clients.forEach(socket => {
    if (socket.buzy) {
      return;
    }
    socket.buzy = false;
    socket.send(Buffer.concat([NALseparator, data]), { binary : true }, error => {
      socket.buzy = false;
      console.error(error);
    });
  });
}

function getFeed() {
  const msk = 'raspivid -t 0 -o - -w %d -h %d -fps %d';
  const cmd = util.format(msk, options.width, options.height, options.fps);
  console.info(cmd);
  const streamer = spawn(
    'raspivid',
    [
      '-t', '0', '-o', '-', '-w', options.width,
      '-h', options.height, '-fps', options.fps,
      '-pf', 'baseline'
    ]);
  streamer.on('exit', code => console.log('Failure', code));
  return streamer.stdout;
}

server.listen(3000, () => console.info(`Video surveillance service started on port ${PORT}`));
