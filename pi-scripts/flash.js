// Inspired by https://www.raspberrypi.org/documentation/installation/installing-images/linux.md

const sh       = require('shelljs');
const inquirer = require('inquirer');

if (!process.getuid || process.getuid() !== 0) {
  throw new Error('Need to be launch as root');
}

inquirer.prompt([
  {
    type    : 'input',
    name    : 'deviceName',
    message : 'SD card device name',
    default : '/dev/sde'
  },
  {
    type     : 'input',
    name     : 'partitions',
    message  : 'Number of partitions on device',
    default  : '1',
    validate : number => Number.isNaN(parseInt(number, 10)) ? 'Number needed' : true,
    filter   : number => parseInt(number, 10)
  },
  {
    type     : 'input',
    name     : 'imagePath',
    message  : 'Absolute path to img'
  },
  {
    type    : 'confirm',
    name    : 'confirm',
    message : ({ deviceName, imagePath }) =>
      `Are you sure to want to write ${imagePath} to ${deviceName}`,
    default : true
  }
]).then(({ deviceName, partitions, imagePath, confirm }) => {
  if (confirm) {
    // Umount partitions
    for (let i = 1; i <= partitions; i++) {
      sh.exec(`umount ${deviceName}${i}`);
    }
    // Check if image exists
    if (sh.test('-f', imagePath)) {
      // Flash SD card
      sh.exec(`dd bs=4M if=${imagePath} of=${deviceName}`);
      // Flush write cache
      sh.exec('sync');
      console.info('SD card flashed!');
    } else {
      console.error(`Aborted. SD card was not flashed. Image file not found at ${imagePath}`);
    }
  } else {
    console.info('Aborted. SD card was not flashed.');
  }
});
