const fs = require('fs');
const sharp = require('sharp');

const regions1 = {
  typ: { left: 1133, top: 197, width: 164, height: 37 },
  name: { left: 1127, top: 387, width: 542, height: 51 },
  desc: { left: 1127, top: 439, width: 542, height: 219 },
  'desc-full': { left: 1127, top: 439, width: 542, height: 427 },
  tag1: { left: 1556, top: 218, width: 88, height: 33 },
  tag2: { left: 1556, top: 258, width: 88, height: 33 },
  'range-image': { left: 1160, top: 678, width: 152, height: 152 },
  'range-tags': { left: 1316, top: 678, width: 330, height: 30 },
  'range-tags-half': { left: 1316, top: 678, width: 165, height: 30 },

  'range-1-label': { left: 1322, top: 712, width: 200, height: 34 },
  'range-1-value-all': { left: 1540, top: 712, width: 100, height: 34 },

  'range-2-label': { left: 1322, top: 752, width: 200, height: 34 },
  'range-2-value-all': { left: 1530, top: 752, width: 100, height: 34 },

  'range-3-label': { left: 1322, top: 792, width: 200, height: 34 },
  'range-3-value-all': { left: 1530, top: 792, width: 100, height: 34 },
};

const regions2 = {
  typ: { left: 513, top: 56, width: 104, height: 37 },
  name: { left: 514, top: 247, width: 526, height: 49 },
  desc: { left: 515, top: 299, width: 524, height: 465 },
  'desc-full': { left: 515, top: 299, width: 524, height: 465 },
  tag1: { left: 935, top: 78, width: 88, height: 33 },
  tag2: { left: 935, top: 117, width: 88, height: 33 },
  'range-image': { left: 543, top: 785, width: 152, height: 152 },
  'range-tags': { left: 719, top: 784, width: 290, height: 33 },
  'range-tags-half': { left: 719, top: 784, width: 145, height: 33 },

  'range-1-label': { left: 710, top: 819, width: 180, height: 34 },
  'range-1-value-all': { left: 900, top: 819, width: 115, height: 34 },

  'range-2-label': { left: 710, top: 860, width: 180, height: 34 },
  'range-2-value-all': { left: 900, top: 860, width: 115, height: 34 },

  'range-3-label': { left: 710, top: 900, width: 180, height: 34 },
  'range-3-value-all': { left: 900, top: 900, width: 115, height: 34 },
}

module.exports.createSlices = async (imageType, inputFile, outputDir) => {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  var regions = regions1;
  if (imageType == 1) {
    regions = regions1;
  }
  if (imageType == 2) {
    regions = regions2;
  }

  for (const name in regions) {
    const region = regions[name];
    await sharp(inputFile)
      .extract(region)
      .toFile(`${outputDir}/${name}.png`);
  }
}