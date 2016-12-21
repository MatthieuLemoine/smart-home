const spawn  = require('child_process').spawn;
const fs     = require('fs');
const path   = require('path');
const logger = require('../logger');

let recordProcess;
let options;
const videoFile       = path.join(__dirname, '..', 'videos', 'out.h264');
const backupVideoFile = path.join(__dirname, '..', 'videos', 'back.h264');
let localVideoStream = fs.createWriteStream(videoFile);

// Clear output video every 2 hours
setInterval(clearOutput, 7200000);

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
  recordProcess.on('exit', code => logger.error('Camera process exiting', code));
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

function clearOutput() {
  logger.info('Clear output video');
  if (recordProcess) {
    recordProcess.stdout.unpipe(localVideoStream);
  }
  localVideoStream.end();
  // Backup video
  fs.rename(videoFile, backupVideoFile, () => {
    // w flag by default i.e replace file
    localVideoStream = fs.createWriteStream(videoFile);
    if (recordProcess) {
      recordProcess.stdout.pipe(localVideoStream);
    }
  });
}
