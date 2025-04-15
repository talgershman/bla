import {writeFile} from 'fs';

const targetPath = './.env';

const envFile = 'AG_GRID_LICENSE="<Your_License_Key>"';

// eslint-disable-next-line
writeFile(targetPath, envFile, 'utf8', (err) => {
  if (err) {
    // eslint-disable-next-line
    return console.log(err);
  }
});
