const express = require('express');
const fs      = require('fs');
const path    = require('path');
const logger  = require('../logger');
const dateFns = require('date-fns');

const app = express();

const PORT      = process.env.PORT || 3001;

app.post('/feed', (req) => {
  const videoPath = path.join(
    __dirname, 'videos', `${dateFns.format(new Date(), 'YYYY-MM-DD HH:mm:ss')}.h264`
  );
  const fileStream = fs.createWriteStream(videoPath);
  req.pipe(fileStream);
});

app.listen(3000, () => logger.info(`Remote video backup service started on port ${PORT}`));
