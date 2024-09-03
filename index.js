const fs = require('fs');
const { Jimp } = require('jimp');
const { createSlices } = require('./utils/CreateSlices');
const { readText } = require('./utils/ReadText');

if (!fs.existsSync('out/images')) {
  fs.mkdirSync('out/images', { recursive: true });
}


// start(1, `ss/come-on.png`).then(console.log);
// start(2, `ss2/justice.png`).then(console.log);

// batch(1, 'ss');
batch(2, 'ss2');

async function batch(typ, dir) {
  const files = fs.readdirSync(dir);
  const results = [];
  const finalPromise = files.reduce((p, fileName) => {
    return p.then(() => {
      return start(typ, `${dir}/${fileName}`).then(result => {
        results.push(result);
      });
    });
  }, Promise.resolve());

  finalPromise.then(() => {
    fs.writeFileSync(`out/${dir}-result.json`, JSON.stringify(results, null, 2));
  });
}

async function start(typ, file) {
  console.log(file);
  const id = Date.now();
  await createSlices(typ, file, `tmp/${id}`);
  return Promise.all([
    Promise.all([
      readText(`tmp/${id}/name.png`).then(trim),
      readText(`tmp/${id}/desc.png`, true).then(trim).then(replaceNewLine).then(fixBuffs),
      readText(`tmp/${id}/desc-full.png`, true).then(trim).then(replaceNewLine).then(fixBuffs),
      readText(`tmp/${id}/typ.png`).then(trim).then(fixType),
      readText(`tmp/${id}/range-tags-half.png`, true).then(parseRangeTags),
    ]).then(values => {
      console.log(values[0]);
      var desc = values[1];
      if (getRangeTags(values[4]).length === 0) {
        desc = values[2];
      }
      return {
        name: values[0],
        desc,
        type: values[3]
      };
    }),
    Promise.all([
      readText(`tmp/${id}/tag1.png`).then(getTagType),
      readText(`tmp/${id}/tag2.png`).then(getTagType),
      // readText(`tmp/${id}/tag1.png`),
      // readText(`tmp/${id}/tag2.png`),
    ]).then(values => {
      let info = {};
      // info.tag1 = values[2];
      // info.tag2 = values[3];
      if (values[0]) {
        info[values[0].name] = values[0].value;
      }
      if (values[1]) {
        info[values[1].name] = values[1].value;
      }
      return info;
    }),
    Promise.all([
      readText(`tmp/${id}/range-tags.png`, true).then(parseRangeTags),
      readText(`tmp/${id}/range-tags-half.png`, true).then(parseRangeTags),

      readText(`tmp/${id}/range-1-label.png`).then(trim),
      readText(`tmp/${id}/range-1-value-all.png`).then(trim).then(formatRange),

      readText(`tmp/${id}/range-2-label.png`).then(trim),
      readText(`tmp/${id}/range-2-value-all.png`).then(trim).then(formatRange),

      readText(`tmp/${id}/range-3-label.png`).then(trim),
      readText(`tmp/${id}/range-3-value-all.png`).then(trim).then(formatRange),
    ]).then(values => {
      let range = { rangeInfo: {} };
      range.rangeTags = getRangeTags(values[1], values[0]);
      // range.rangeTagsRaw = getRangeTagsRaw(values[1], values[0]);
      const rangeTypes = []
      rangeTypes.push({ label: values[2], range: values[3] });
      rangeTypes.push({ label: values[4], range: values[5] });
      rangeTypes.push({ label: values[6], range: values[7] });
      rangeTypes.forEach((info) => {
        if (info.label === 'Range' || info.label === 'Height Range' || info.label === 'Effect Height') {
          range.rangeInfo[info.label] = {
            low: info.range[0],
            high: info.range[1]
          };
        }
      });
      return range;
    }),
  ]).then(objects => {
    var result = {};
    objects.forEach(obj => {
      for (const key in obj) {
        result[key] = obj[key];
      }
    });

    if (result.range || result.rangeTags.length > 0 || Object.keys(result.rangeInfo).length > 0) {
      var nameParts = [];
      if (result.range) {
        nameParts.push(result.range.join('-'));
      }
      result.rangeTags.forEach(tag => {
        nameParts.push(tag.toLowerCase());
      });
      for (const name in result.rangeInfo) {
        nameParts.push(name.split(/\s+/).map(word => word[0].toLowerCase()).join(''));
        nameParts.push(result.rangeInfo[name].low);
        nameParts.push(result.rangeInfo[name].high);
      }
      result.rangeImage = nameParts.join('-');
      fs.copyFileSync(`tmp/${id}/range-image.png`, `out/images/${result.rangeImage}.png`);
    }
    return result;
  });
}

function trim(str) {
  return str.trim();
}

function replaceNewLine(str) {
  return str
    .replaceAll('-\n', '-')
    .replaceAll('\n', ' ');
}

function getTagType(str) {
  if (str.indexOf('+') !== -1 || str.indexOf('(4)') !== -1) {
    return {
      name: 'cost',
      value: Number(str[0])
    };
  } else if (str.indexOf('x') !== -1 || str.indexOf('X') !== -1) {
    return {
      name: 'cd',
      value: Number(str[0])
    };
  } else {
    return null;
  }
}

function parseRangeTags(str) {
  const allowed = ['AoE', 'Unit', 'Melee', 'Ground', 'Ranged'];
  const good = [];
  const bad = [];
  str.split(/\s+/).forEach(tag => {
    if (allowed.includes(tag)) {
      good.push(tag);
    } else {
      bad.push(tag)
    }
  });
  return [good, bad];
}

function getRangeTags(a, b) {
  var tags = [];
  if (a) {
    tags.push(...a[0])
  }
  if (b) {
    tags.push(...b[0])
  }
  return removeDuplicates(tags);
}

function getRangeTagsRaw(a, b) {
  return [].concat(...a[0]).concat(...a[1]).concat(...b[0]).concat(...b[1])
}

function removeDuplicates(arr) {
  var obj = {};
  arr.forEach(item => {
    obj[item] = true;
  });
  return Object.keys(obj);
}

function rangeCorrection(str) {
  if (!str) {
    return null;
  }
  if (str === 'IA') {
    return 4;
  }
  return Number(str);
}

function formatRange(str) {
  if (str.indexOf('-') !== -1) {
    return str.split(/\s*-\s*/).map(value => {
      return value
        .replace(/1(\d+)/, '$1')
        .replace(/t(\d+)/, '$1')
        .replace(/V(\d+)/, '$1')
    });
  }
  return null;
}

function fixType(str) {
  if (str === 'React') {
    return 'Reaction';
  }
  if (str === 'Basic') {
    return 'Basic Attack'
  }
  return str;
}

function fixBuffs(str) {
  return str
    .replaceAll(/\[\s*Z*A+\s+/g, '[{+}')
    .replaceAll('[AATK', '[{+}ATK')
    .replaceAll(/\[\s*V+\s+/g, '[{-}')
    .replaceAll(/\[\s*¥+\s+/g, '[{-}')
    .replaceAll(/\[\s*7+\s+/g, '[{-}')
    .replaceAll(/\[\s*©+\s+/g, '[{x}')
    .replaceAll('111]', 'III]')
    .replaceAll('11]', 'II]')
    .replaceAll('1]', 'I]')
    .replaceAll('ATKII', 'ATK II')

    .replaceAll('forall', 'for all')
    .replaceAll('DMGand', 'DMG and')
}