const { Jimp } = require('jimp');
const { createWorker } = require('tesseract.js');

module.exports.readText = async (file, deNoise) => {
  var actualFile = file
  if (deNoise) {
    var jimpFile = file + '.jimp.png';
    await Jimp.read(file).then(image => {
      image
        .color([{ apply: 'desaturate', params: [50] }])
        .contrast(0.4)
        .write(jimpFile);
    });
    actualFile = jimpFile
  }

  const worker = await createWorker('eng');
  const { data: { text } } = await worker.recognize(actualFile);
  await worker.terminate();
  return text;
}
