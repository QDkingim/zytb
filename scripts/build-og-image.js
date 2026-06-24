const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.join(__dirname, '..');
const svgPath = path.join(root, 'og-image.svg');
const pngPath = path.join(root, 'og-image.png');

sharp(fs.readFileSync(svgPath))
  .png()
  .toFile(pngPath)
  .then((info) => {
    console.log(`og-image.png generated (${info.width}x${info.height}, ${info.size} bytes)`);
  })
  .catch((err) => {
    console.error('Failed to build og-image.png:', err.message);
    process.exit(1);
  });
