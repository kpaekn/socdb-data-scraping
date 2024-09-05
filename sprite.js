const fs = require('fs');
const sharp = require('sharp');

if (!fs.existsSync('out/sprite')) {
  fs.mkdirSync('out/sprite', {
    recursive: true
  });
}

// slice('common.png');

const files = fs.readdirSync('in/sprite');
files.forEach(async fileName => {
  if (fileName != '.DS_Store') {
    await slice(fileName);
  }
});
console.log('done');

async function slice(fileName) {
  console.log(fileName);
  await sharp(`in/sprite/${fileName}`)
    // .extract({ left: 1935, top: 311, width: 210, height: 210 })
    .ensureAlpha()
    // .resize(70, 70, {
    .resize(804, 360, {
      fit: 'contain',
      background: 'transparent',
      kernel: 'nearest',
    })
    // .toFile(`out/sprite/${fileName}`)
    .raw()
    .toBuffer({ resolveWithObject: true })
    .then(async ({ data, info }) => {
      const { width, height, channels } = info;
      const newData = convertToRawData(data, width, height);
      eraseBackground2(newData, width, height);
      // colorBlackAndWhite(newData);
      const rebuiltData = convertToBuffer(newData)
      await sharp(rebuiltData, { raw: { width, height, channels } })
        // .toFormat('webp')
        // .toFile(`out/sprite/${fileName.replace('png', 'webp')}`)
        .toFile(`out/sprite/${fileName}`)
    })
}

function convertToRawData(rawData) {
  const newData = [];
  for (let i = 0; i < rawData.length; i += 4) {
    newData.push({
      r: rawData[i],
      g: rawData[i + 1],
      b: rawData[i + 2],
      a: rawData[i + 3]
    })
  }
  return newData
}

function convertToBuffer(data) {
  const buffer = [];
  for (let i = 0; i < data.length; i++) {
    buffer.push(data[i].r);
    buffer.push(data[i].g);
    buffer.push(data[i].b);
    buffer.push(data[i].a);
  }
  return Buffer.from(buffer);
}

// function resizeImage

function eraseBackground2(data, width, height) {
  eraseNonBlackRegion(data, width, height);
  eraseSmallBlackRegions(data, width, height);
}

function eraseNonBlackRegion(data, width, height) {
  const candidates = [{ x: 0, y: 0 }];
  while (candidates.length > 0) {
    const curr = candidates.pop();
    if (curr.x < 0 || curr.x >= width || curr.y < 0 || curr.y >= height) {
      continue;
    }
    const n = curr.y * width + curr.x;
    if (isBlackOrWhite(data[n])) {
      continue;
    }
    if (data[n].v1) {
      continue;
    }
    data[n].v1 = true;
    data[n].r = 0;
    data[n].g = 255;
    data[n].b = 0;
    data[n].a = 0;
    candidates.push({ x: curr.x + 1, y: curr.y });
    candidates.push({ x: curr.x - 1, y: curr.y });
    candidates.push({ x: curr.x, y: curr.y + 1 });
    candidates.push({ x: curr.x, y: curr.y - 1 });
  }
}

function eraseSmallBlackRegions(data, width, height) {
  const blackPixels = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const n = y * width + x;
      if (isBlackOrWhite(data[n])) {
        blackPixels.push({ x, y, n });
      }
    }
  }

  for (let i = 0; i < blackPixels.length; i++) {
    const region = expandRegion(blackPixels[i].x, blackPixels[i].y, data, width, height);
    if (region.length !== 0 && region.length < 10) {
      for (let j = 0; j < region.length; j++) {
        const n = region[j].y * width + region[j].x;
        data[n].a = 0;
      }
    }
  }
}

function expandRegion(x, y, data, width, height) {
  const region = [];
  const candidates = [{ x, y }];
  while (candidates.length > 0) {
    const curr = candidates.pop();
    if (curr.x < 0 || curr.x >= width || curr.y < 0 || curr.y >= height) {
      continue
    }
    const n = curr.y * width + curr.x;
    if (isTransparent(data[n])) {
      continue
    }
    if (data[n].v2) {
      continue
    }
    data[n].v2 = true;
    region.push(curr);
    candidates.push({ x: curr.x + 1, y: curr.y });
    candidates.push({ x: curr.x - 1, y: curr.y });
    candidates.push({ x: curr.x, y: curr.y + 1 });
    candidates.push({ x: curr.x, y: curr.y - 1 });
  }
  return region;
}

function colorBlackAndWhite(data) {
  for (let i = 0; i < data.length; i++) {
    if (isBlackOrWhite(data[i])) {
      data[i].r = 0;
      data[i].g = 255;
      data[i].b = 0;
    }
  }
}

function isBlackOrWhite(pixel) {
  // black
  if (pixel.r <= 30 || pixel.g <= 30 || pixel.b <= 30) {
    return true;
  }
  if ((pixel.r + pixel.g + pixel.b) / 3 < 26) {
    return true;
  }

  // white
  if (pixel.r > 240 && pixel.g > 240 && pixel.b > 240) {
    return true
  }
  if ((pixel.r + pixel.g + pixel.b) / 3 > 245) {
    return true;
  }

  return false;
}

function isTransparent(pixel) {
  if (pixel.r === 0 && pixel.g === 255 && pixel.b === 0) {
    return true;
  }
  return pixel.a === 0;
}