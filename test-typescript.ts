// TypeScript 测试 - 完整的类型导入测试
import { readFileSync, writeFileSync } from 'fs';
import { 
  binaryPreprocess, 
  quantizePreprocess, 
  potrace, 
  optimizeSvg 
} from 'cv-trace';

// 🎯 这是你要求的类型导入格式！
import type { 
  BinaryOptions, 
  QuantizeOptions, 
  PotraceOptions,
  SvgoOptions,
  LayerData, 
  VectorizeResult 
} from 'cv-trace';

async function testTypeScript(): Promise<void> {
  console.log('🧪 TypeScript 完整类型测试开始...\n');
  
  try {
    // 使用类型定义的配置选项
    const binaryConfig: BinaryOptions = {
      threshold: [120, 255],
      brightness: 0.1,
      blur: 1,
      contrast: 0.2,
      color: '#FF0000'
    };
    
    const quantizeConfig: QuantizeOptions = {
      colorCount: 8,
      minPercent: 0.01,
      stack: false,
      brightness: 0.1
    };
    
    const potraceConfig: PotraceOptions = {
      turdSize: 3,
      alphaMax: 1.5,
      optCurve: true,
      optTolerance: 0.3,
      threshold: 0.5,
      blackOnWhite: true
    };
    
    const svgoConfig: SvgoOptions = {
      multipass: true,
      js2svg: {
        indent: 2,
        pretty: true
      }
    };
    
    console.log('✅ 所有类型导入成功！');
    console.log('📦 配置类型验证:');
    console.log(`- BinaryOptions: ${typeof binaryConfig}`);
    console.log(`- QuantizeOptions: ${typeof quantizeConfig}`);
    console.log(`- PotraceOptions: ${typeof potraceConfig}`);
    console.log(`- SvgoOptions: ${typeof svgoConfig}`);
    
    // 实际功能测试
    console.log('\n🔄 测试带类型的二值化预处理...');
    const imageBuffer: Buffer = readFileSync('test.jpg');
    
    const layerData: LayerData = await binaryPreprocess(imageBuffer, binaryConfig);
    console.log('✅ 类型化二值化预处理完成');
    console.log(`- LayerData类型验证: ${layerData.layers.length}层`);
    
    const result: VectorizeResult = await potrace(layerData, potraceConfig);
    console.log('✅ 类型化矢量化完成');
    
    const optimizedSvg: string = await optimizeSvg(result.svg, svgoConfig);
    const savings = ((result.svg.length - optimizedSvg.length) / result.svg.length * 100).toFixed(1);
    console.log(`✅ 类型化SVG优化完成 (压缩率: ${savings}%)`);
    
    // 保存结果
    writeFileSync('output-ts.svg', optimizedSvg);
    writeFileSync('preview-ts.png', result.preprocessedImage);
    
    console.log('\n💾 TypeScript测试文件已保存:');
    console.log('- output-ts.svg'); 
    console.log('- preview-ts.png');
    
    console.log('\n🎉 TypeScript 完整类型测试成功！');
    console.log('🎯 所有 "import type { ... } from \'cv-trace\'" 格式都工作正常！');
    
  } catch (error) {
    console.error('❌ TypeScript 测试失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testTypeScript();
