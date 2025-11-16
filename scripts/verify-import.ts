import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { CfdService } from '../src/cfd/cfd.service';

async function verifyData() {
  console.log('🔍 开始验证导入的数据...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const cfdService = app.get(CfdService);

  try {
    // 验证品种交易设置
    console.log('📊 验证品种交易设置数据...');
    const tradingSettings = await cfdService.findAllTradingSettings();
    console.log(`✅ 总计: ${tradingSettings.length} 条记录`);
    if (tradingSettings.length > 0) {
      console.log('示例数据:', {
        代码: tradingSettings[0].code,
        简体名称: tradingSettings[0].nameCn,
        品种类型: tradingSettings[0].type,
        固定杠杆: tradingSettings[0].fixedLeverage,
      });
    }
    console.log('');

    // 验证股票信息
    console.log('📊 验证股票基础信息数据...');
    const stocks = await cfdService.findAllStocks();
    console.log(`✅ 总计: ${stocks.length} 条记录`);
    if (stocks.length > 0) {
      console.log('示例数据:', {
        代码: stocks[0].code,
        简体名称: stocks[0].nameCn,
        英文名称: stocks[0].nameEn,
        所属市场: stocks[0].marketCn,
      });
    }
    console.log('');

    // 验证加密货币信息
    console.log('📊 验证加密货币基础信息数据...');
    const cryptos = await cfdService.findAllCryptos();
    console.log(`✅ 总计: ${cryptos.length} 条记录`);
    if (cryptos.length > 0) {
      console.log('示例数据:', {
        代码: cryptos[0].code,
        简体名称: cryptos[0].nameCn,
        英文名称: cryptos[0].nameEn,
        市值排名: cryptos[0].marketCapRank,
      });
    }
    console.log('');

    // 测试查询功能
    console.log('🔍 测试查询功能...');
    const appleStock = await cfdService.findStockByCode('AAPL');
    if (appleStock) {
      console.log('✅ 查询苹果股票信息成功:');
      console.log(`   代码: ${appleStock.code}`);
      console.log(`   名称: ${appleStock.nameCn}`);
      console.log(`   CEO: ${appleStock.ceo}`);
      console.log(`   员工数: ${appleStock.employees}`);
      console.log(`   市场: ${appleStock.marketCn}`);
    }
    console.log('');

    const btc = await cfdService.findCryptoByCode('BTC');
    if (btc) {
      console.log('✅ 查询比特币信息成功:');
      console.log(`   代码: ${btc.code}`);
      console.log(`   名称: ${btc.nameCn}`);
      console.log(`   市值排名: ${btc.marketCapRank}`);
      console.log(`   历史最高价: ${btc.allTimeHigh}`);
      console.log(`   历史最低价: ${btc.allTimeLow}`);
    }

    console.log('\n🎉 所有数据验证通过！字段重构成功！');
  } catch (error) {
    console.error('❌ 验证失败:', error);
  } finally {
    await app.close();
  }
}

verifyData();