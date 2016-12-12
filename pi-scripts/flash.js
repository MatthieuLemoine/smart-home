// Inspired by https://www.raspberrypi.org/documentation/installation/installing-images/linux.md

const sh       = require('shelljs');
const inquirer = require('inquirer');
const uuid     = require('uuid');
const path     = require('path');
const fs       = require('fs');
const chalk    = require('chalk');

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
    default  : '2',
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
      console.info(chalk.blue('Writing... It could take several minutes...'));
      // Flash SD card
      sh.exec(`dd bs=4M if=${imagePath} of=${deviceName}`);
      // Flush write cache
      sh.exec('sync');
      console.info(chalk.green('SD card flashed!'));
      inquirer.prompt([
        {
          type    : 'confirm',
          name    : 'configuration',
          message : 'Would you like to enable ssh remote access and configure WiFi ?',
          default : true
        },
        {
          type     : 'input',
          name     : 'ssid',
          message  : 'WiFi ssid',
          when     : ({ configuration }) => configuration
        },
        {
          type     : 'input',
          name     : 'password',
          message  : 'WiFi password',
          when     : ({ configuration }) => configuration
        }
      ]).then(({ configuration, ssid, password }) => {
        if (configuration) {
          // Mount boot partition
          const bootPath = path.join('/', 'tmp', uuid.v4());
          sh.mkdir(bootPath);
          sh.exec(`mount ${deviceName}1 ${bootPath}`);
          // Enable ssh
          sh.touch(path.join(bootPath, 'ssh'));
          // Unmount boot partition
          sh.exec(`umount ${deviceName}1`);

          // Mount main partition
          const mainPath = path.join('/', 'tmp', uuid.v4());
          sh.mkdir(mainPath);
          sh.exec(`mount ${deviceName}2 ${mainPath}`);
          // Configure WiFi
          const wpaSupplicantPath =
            path.join(mainPath, 'etc', 'wpa_supplicant', 'wpa_supplicant.conf');
          const fileData = fs.readFileSync(wpaSupplicantPath, { encoding : 'utf8' });
          // Add network info to wpa_supplicant
          fs.writeFileSync(
            wpaSupplicantPath,
            `${fileData}\nnetwork={\n  ssid="${ssid}"\n  psk="${password}"\n}\n`
          );
          // Unmount main partition
          sh.exec(`umount ${deviceName}2`);

          console.info(chalk.green('Pi has been successfully setup !'));
        }
      })
      .catch(err => console.error(chalk.red(err)));
    } else {
      console.error(
        chalk.red(`Aborted. SD card was not flashed. Image file not found at ${imagePath}`)
      );
    }
  } else {
    console.warn(chalk.yellow('Aborted. SD card was not flashed.'));
  }
})
.catch(err => console.error(chalk.red(err)));
