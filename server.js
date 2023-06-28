const express = require('express');
const chokidar = require('chokidar');
const { exec } = require('child_process');

const app = express();

app.use(express.static('public'));

const watcher = chokidar.watch(['./src']);

watcher.on('change', (path) => {
  console.log(`${path} has changed. Rebuilding...`);

  exec('pnpm run build', (err, stdout, stderr) => {
    if (err) {
      console.error(`exec error: ${err}`);
      return;
    }

    console.log(stdout);
    console.log('Rebuild complete. Refreshing browser...');
  });
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});
