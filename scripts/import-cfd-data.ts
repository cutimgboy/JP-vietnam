import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { CfdService } from '../src/cfd/cfd.service';
import * as XLSX from 'xlsx';
import * as path from 'path';

async function importData() {
  console.log('🚀 开始导入 CFD 数据...\n');

  // 创建 NestJS 应用上下文
  const app = await NestFactory.createApplicationContext(AppModule);
  const cfdService = app.get(CfdService);

  try {
    // 读取 Excel 文件
    const filePath = path.resolve(__dirname, '../CFD品种信息表.xlsx');
    const workbook = XLSX.readFile(filePath);

    // 1. 导入品种交易设置
    console.log('📊 导入品种交易设置...');
    const tradingSettingsSheet = workbook.Sheets['品种交易设置'];
    const tradingSettingsData = XLSX.utils.sheet_to_json(tradingSettingsSheet);
    
    if (tradingSettingsData.length > 0) {
      const count = await cfdService.importTradingSettings(tradingSettingsData);
      console.log(`✅ 成功导入 ${count} 条品种交易设置数据\n`);
    } else {
      console.log('⚠️  品种交易设置数据为空\n');
    }

    // 2. 导入股票基础信息
    console.log('📊 导入股票基础信息...');
    const stockInfoSheet = workbook.Sheets['股票基础信息'];
    const stockInfoData = XLSX.utils.sheet_to_json(stockInfoSheet);
    
    if (stockInfoData.length > 0) {
      const count = await cfdService.importStockInfo(stockInfoData);
      console.log(`✅ 成功导入 ${count} 条股票基础信息数据\n`);
    } else {
      console.log('⚠️  股票基础信息数据为空\n');
    }

    // 3. 导入加密货币基础信息
    console.log('📊 导入加密货币基础信息...');
    const cryptoInfoSheet = workbook.Sheets['加密货币基础信息'];
    const cryptoInfoData = XLSX.utils.sheet_to_json(cryptoInfoSheet);
    
    if (cryptoInfoData.length > 0) {
      const count = await cfdService.importCryptoInfo(cryptoInfoData);
      console.log(`✅ 成功导入 ${count} 条加密货币基础信息数据\n`);
    } else {
      console.log('⚠️  加密货币基础信息数据为空\n');
    }

    console.log('🎉 所有数据导入完成！');
  } catch (error) {
    console.error('❌ 数据导入失败:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// 执行导入
importData()
  .then(() => {
    console.log('\n✨ 导入任务执行完毕');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 导入任务失败:', error);
    process.exit(1);
  });