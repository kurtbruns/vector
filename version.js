const fs = require('fs');
const packageJson = require('./package.json');

const content = `\nexport const version = '${packageJson.version}';\n`;

fs.writeFile('./src/version.ts', content, err => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
});