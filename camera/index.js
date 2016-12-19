const http            = require('http');
const express         = require('express');
const path            = require('path');
const spawn           = require('child_process').spawn;
const WebSocketServer = require('uws').Server;
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
let child;

// WS streaming

function onNewClient(socket) {
  socket.send(JSON.stringify({
    action : 'init',
    width  : options.width,
    height : options.height,
  }));
  socket.on('message', data => {
    const cmd = `${data}`;
    const action = cmd.split(' ')[0];
    if (action === 'REQUESTSTREAM') {
      startFeed();
    } else if (action === 'STOPSTREAM' && readStream) {
      readStream.end();
      child.stdout.pause();
    }
  });
  socket.on('close', killChild);
}

function killChild() {
  if (child) {
    child.kill('SIGINT');
    readStream.end();
  }
  readStream = null;
  child      = null;
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
    socket.send(Buffer.concat([NALseparator, data]), { binary : true }, () => {
      socket.buzy = false;
    });
  });
}

function getFeed() {
  if (child) {
    child.stdout.resume();
  } else {
    child = spawn(
      'raspivid',
      [
        '-t', '0', '-o', '-', '-w', options.width,
        '-h', options.height, '-fps', options.fps,
        '-pf', 'baseline'
      ]);
    child.on('exit', code => console.log('Camera process exiting', code));
  }
  return child.stdout;
}

server.listen(3000, () => console.info(`Video surveillance service started on port ${PORT}`));

// Kill child on crash
process.on('uncaughtException', killChild);
