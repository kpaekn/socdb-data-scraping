const fs = require('fs');
const sharp = require('sharp');

const regionsType1 = {
  icon: { left: 1182, top: 77, width: 129, height: 129 },
  typ: { left: 946, top: 20, width: 119, height: 42 },
  name: { left: 949, top: 236, width: 595, height: 58 },
  desc: { left: 949, top: 294, width: 595, height: 533 },
  'desc-full': { left: 949, top: 294, width: 595, height: 533 },
  'desc-trait': { left: 974, top: 346, width: 545, height: 400 },

  'cost-1': { left: 1425, top: 46, width: 100, height: 35 },
  'cost-2': { left: 1425, top: 90, width: 100, height: 36 },

  'range-image': { left: 980, top: 848, width: 173, height: 173 },
  'range-tag-1': { left: 1181, top: 847, width: 147, height: 37 },
  'range-tag-2': { left: 1360, top: 847, width: 147, height: 37 },

  'range-1-label': { left: 1170, top: 885, width: 200, height: 41 },
  'range-1-value': { left: 1390, top: 885, width: 130, height: 41 },

  'range-2-label': { left: 1170, top: 931, width: 200, height: 41 },
  'range-2-value': { left: 1390, top: 931, width: 130, height: 41 },

  'range-3-label': { left: 1170, top: 977, width: 200, height: 41 },
  'range-3-value': { left: 1390, top: 977, width: 130, height: 41 },
}

const regionsType2 = {
  icon: { left: 1886, top: 237, width: 129, height: 129 },
  typ: { left: 1652, top: 181, width: 182, height: 40 },
  name: { left: 1645, top: 398, width: 610, height: 55 },
  desc: { left: 1645, top: 455, width: 610, height: 248 },
  'desc-full': { left: 1645, top: 455, width: 610, height: 484 },

  'cost-1': { left: 2130, top: 205, width: 100, height: 36 },
  'cost-2': { left: 2130, top: 250, width: 100, height: 36 },

  'range-image': { left: 1681, top: 726, width: 173, height: 173 },
  'range-tag-1': { left: 1901, top: 727, width: 116, height: 32 },
  'range-tag-2': { left: 2080, top: 727, width: 116, height: 32 },

  'range-1-label': { left: 1870, top: 765, width: 200, height: 40 },
  'range-1-value': { left: 2095, top: 765, width: 130, height: 40 },

  'range-2-label': { left: 1870, top: 811, width: 200, height: 40 },
  'range-2-value': { left: 2095, top: 811, width: 130, height: 40 },

  'range-3-label': { left: 1870, top: 857, width: 200, height: 40 },
  'range-3-value': { left: 2095, top: 857, width: 130, height: 40 },
};

const regionsType3 = {
  icon: { left: 1182, top: 80, width: 129, height: 129 },
  typ: { left: 946, top: 20, width: 178, height: 40 },
  name: { left: 949, top: 263, width: 595, height: 56 },
  desc: { left: 974, top: 346, width: 545, height: 700 },
  'desc-full': { left: 974, top: 346, width: 545, height: 400 },
}

module.exports.createSlices = async (imageType, inputFile, outputDir) => {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  var regions = regionsType1;
  if (imageType == 1) {
    regions = regionsType1;
  }
  if (imageType == 2) {
    regions = regionsType2;
  }
  if (imageType === 3) {
    regions = regionsType3;
  }

  for (const name in regions) {
    const region = regions[name];
    await sharp(inputFile)
      .extract(region)
      .toFile(`${outputDir}/${name}.png`);
  }
}