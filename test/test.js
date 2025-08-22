import { readFileSync, writeFileSync } from "fs";
import { BinaryPreprocess, Potrace, OptimizeSvg, QuantizePreprocess } from "../dist/index.js";


////////// test 1 : Binary //////////

const imageBuffer = readFileSync("./test.jpg");

// 1. Preprocess (if use BinaryPreprocess)
const layerData = await BinaryPreprocess(imageBuffer, {
  threshold: [128, 255],
  color: "#000000",
});

// 2. Trace (if use Potrace)
const result = await Potrace(layerData);
// 3. Optimize (optional)
result.svg = await OptimizeSvg(result.svg);

writeFileSync("./output.svg", result.svg);
writeFileSync("./preview.png", result.preprocessedImage);

////////// test 2 : Color //////////

const imageBuffer1 = readFileSync("./test1.jpg");

// 1. Preprocess (if use BinaryPreprocess)
const layerData1 = await QuantizePreprocess(imageBuffer1, {
  colorCount: 16,
  minPercent: 0,
  stack: true,
});

// 2. Trace (if use Potrace)
const result1 = await Potrace(layerData1);
// 3. Optimize (optional)
result1.svg = await OptimizeSvg(result1.svg);

writeFileSync("./output1.svg", result1.svg);
writeFileSync("./preview1.png", result1.preprocessedImage);

