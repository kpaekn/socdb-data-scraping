const fs = require('fs');
const sharp = require('sharp');

if (!fs.existsSync('out/sprite')) {
  fs.mkdirSync('out/sprite', {
    recursive: true
  });
}

// slice('Screenshot_20240904-104508.png');

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
    .extract({ left: 1102, top: 416, width: 208, height: 265 })
    .toFormat('webp')
    .toFile(`out/sprite/${fileName.replace('png', 'webp')}`)
    // .toBuffer({ resolveWithObject: true })
    // .then(async ({ data, info }) => {
    //   const { width, height, channels } = info;
    //   const newData = convertToRawData(data, width, height);
    //   eraseBackground2(newData, width, height);
    //   const rebuiltData = convertToBuffer(newData)
    //   await sharp(rebuiltData, { raw: { width, height, channels } })
    //     .resize(264, 264, {
    //       fit: 'contain',
    //       background: 'transparent'
    //     })
    //     .toFormat('webp')
    //     .toFile(`out/sprite/${fileName}.webp`)
    // })
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
    if (pixelIsBlack(data[n])) {
      continue;
    }
    if (data[n].v1) {
      continue;
    }
    data[n].v1 = true;
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
      if (pixelIsBlack(data[n])) {
        blackPixels.push({ x, y, n });
      }
    }
  }

  for (let i = 0; i < blackPixels.length; i++) {
    const region = expandRegion(blackPixels[i].x, blackPixels[i].y, data, width, height);
    if (region.length !== 0 && region.length < 100) {
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

function pixelIsBlack(pixel) {
  if (pixel.r > 30 || pixel.g > 30 || pixel.b > 30) {
    return false;
  }
  return (pixel.r + pixel.g + pixel.b) / 3 < 26;
}

function isTransparent(pixel) {
  return pixel.a == 0;
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