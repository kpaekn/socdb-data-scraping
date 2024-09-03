const fs = require('fs');
const { Jimp } = require('jimp');
const { createSlices } = require('./utils/CreateSlices');
const { readText } = require('./utils/ReadText');

if (!fs.existsSync('out/skill')) {
  fs.mkdirSync('out/skill', { recursive: true });
}
if (!fs.existsSync('out/range')) {
  fs.mkdirSync('out/range', { recursive: true });
}

// start(1, `in/battle/burning.png`).then(console.log);
// start(2, `in/tree/knockback.png`).then(console.log);
// start(3, `in/trait/Screenshot_20240903-090639.png`).then(console.log);

// doBatch();

async function doBatch() {
  const results = [];
  results.push(...(await batch(1, 'in/battle')));
  results.push(...(await batch(2, 'in/tree')));
  results.push(...(await batch(3, 'in/trait')));
  fs.writeFileSync(`out/result.json`, JSON.stringify(results, null, 2));
}

async function batch(typ, dir) {
  const files = fs.readdirSync(dir).filter(fileName => fileName !== '.DS_Store');
  const results = [];
  const finalPromise = files.reduce((p, fileName) => {
    return p.then(() => {
      return start(typ, `${dir}/${fileName}`).then(result => {
        results.push(result);
      });
    });
  }, Promise.resolve());

  return finalPromise.then(() => {
    return results;
  });
}

async function start(typ, file) {
  console.log(file);
  const id = Date.now();
  await createSlices(typ, file, `tmp/${id}`);

  return Promise.all([
    readText(`tmp/${id}/name.png`).then(trim),
    readText(`tmp/${id}/desc.png`, true).then(trim).then(replaceNewLine).then(fixBuffs),
    readText(`tmp/${id}/desc-full.png`, true).then(trim).then(replaceNewLine).then(fixBuffs),
    readText(`tmp/${id}/typ.png`).then(trim).then(fixType),
    readText(`tmp/${id}/cost-1.png`).then(trim).then(getCostOrCD),
    readText(`tmp/${id}/cost-2.png`).then(trim).then(getCostOrCD),
    readText(`tmp/${id}/range-tag-1.png`).then(parseRangeTags),
    readText(`tmp/${id}/range-tag-2.png`).then(parseRangeTags),
    readText(`tmp/${id}/range-1-label.png`).then(trim),
    readText(`tmp/${id}/range-1-value.png`).then(trim).then(formatRange),
    readText(`tmp/${id}/range-2-label.png`).then(trim),
    readText(`tmp/${id}/range-2-value.png`).then(trim).then(formatRange),
    readText(`tmp/${id}/range-3-label.png`).then(trim),
    readText(`tmp/${id}/range-3-value.png`).then(trim).then(formatRange),
  ]).then(values => {
    const name = values[0];
    const desc = values[1];
    const descFull = values[2];
    const typ = values[3];
    const cost1 = values[4];
    const cost2 = values[5];
    const rangeTag1 = values[6];
    const rangeTag2 = values[7];
    const rangeLabel1 = values[8];
    const rangeValue1 = values[9];
    const rangeLabel2 = values[10];
    const rangeValue2 = values[11];
    const rangeLabel3 = values[12];
    const rangeValue3 = values[13];

    const result = {
      name,
      type: typ,
    };

    const rangeTags = rangeTag1.concat(rangeTag2);
    if (typ === 'Trait') {
      result.desc = desc;
    } else if (rangeTags.length > 0) {
      result.desc = desc;
    } else {
      result.desc = descFull;
    }
    if (rangeTags.length > 0) {
      result.desc = desc;
    }

    if (cost1) {
      result[cost1.name] = cost1.value;
    }
    if (cost2) {
      result[cost2.name] = cost2.value;
    }

    const ranges = [
      {label: rangeLabel1, value: rangeValue1},
      {label: rangeLabel2, value: rangeValue2},
      {label: rangeLabel3, value: rangeValue3},
    ];
    ranges.forEach(range => {
      if (range.label === 'Range' || range.label === 'Height Range' || range.label === 'Effect Height') {
        if (!result.rangeInfo) result.rangeInfo = {};
        result.rangeInfo[range.label] = range.value;
      }
    });

    if (rangeTags.length > 0 || result.rangeInfo) {
      var nameParts = [];
      rangeTags.forEach(tag => {
        nameParts.push(tag.toLowerCase());
      });
      for (const name in result.rangeInfo) {
        nameParts.push(name.split(/\s+/).map(word => word[0].toLowerCase()).join(''));
        nameParts.push(result.rangeInfo[name][0]);
        nameParts.push(result.rangeInfo[name][1]);
      }
      result.rangeImage = nameParts.join('-');
      fs.copyFileSync(`tmp/${id}/range-image.png`, `out/range/${result.rangeImage}.png`);
    }

    fs.copyFileSync(`tmp/${id}/icon.png`, `out/skill/${slug(name)}.png`);

    return result;
  });
}

function trim(str) {
  return str.trim();
}

function slug(str) {
  return str.toLowerCase().replaceAll(/['"!\(\),]/g, '').replaceAll(/[\s-]+/g, '-');
}

function replaceNewLine(str) {
  return str
    .replaceAll('-\n', '-')
    .replaceAll('\n', ' ');
}

function getCostOrCD(str) {
  str = str.trim();
  const value = Number(str[0]);
  if (isNaN(value)) {
    return null;
  }

  const label = str.slice(1);
  if (label.indexOf('+') !== -1 || label.indexOf('4') !== -1) {
    return {
      name: 'cost',
      value
    };
  } else if (label.indexOf('x') !== -1 || label.indexOf('X') !== -1) {
    return {
      name: 'cooldown',
      value
    };
  } else {
    return null;
  }
}

function parseRangeTags(str) {
  const allowed = ['AoE', 'Unit', 'Melee', 'Ground', 'Ranged'];
  const good = [];
  str.split(/\s+/).forEach(tag => {
    if (allowed.includes(tag)) {
      good.push(tag);
    }
  });
  return good;
}

function formatRange(str) {
  // split on the hiphen
  if (str.indexOf('-') !== -1) {
    return str.split(/\s*-\s*/).map(value => {
      // try to remove the up/down arrow in front the the number
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