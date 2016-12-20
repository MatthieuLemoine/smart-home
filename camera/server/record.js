const spawn = require('child_process').spawn;
const fs    = require('fs');
const path  = require('path');

const localVideoStream = fs.createWriteStream(path.join(__dirname, '..', 'videos', 'out.h264'));

let recordProcess;
let options;

module.exports = {
  start,
  getFeed,
  stop,
  setOptions
};

function start() {
  recordProcess = spawn(
    'raspivid',
    [
      '-t', '0', '-o', '-', '-w', options.width,
      '-h', options.height, '-fps', options.fps,
      '-pf', 'baseline'
    ]);
  recordProcess.stdout.pipe(localVideoStream);
  recordProcess.on('exit', code => console.log('Camera process exiting', code));
}

function stop() {
  if (recordProcess) {
    recordProcess.kill('SIGINT');
  }
  recordProcess = null;
}

function getFeed() {
  if (!recordProcess) {
    start();
  }
  return recordProcess.stdout;
}

function setOptions(opts) {
  options = opts;
}
