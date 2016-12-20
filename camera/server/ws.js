const WebSocketServer = require('uws').Server;
const Splitter        = require('stream-split');

const NALseparator = new Buffer([0, 0, 0, 1]);

module.exports = ws;

function ws(server, options, record) {
  const wss = new WebSocketServer({ server });
  wss.on('connection', onNewClient);
  let readStream;

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
      }
    });
    socket.on('close', () => {
      readStream.end();
      readStream = null;
    });
  }

  function startFeed() {
    const stream = record.getFeed();
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

  return wss;
}
