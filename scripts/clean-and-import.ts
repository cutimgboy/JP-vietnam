import * as mysql from 'mysql2/promise';
import * as XLSX from 'xlsx';
import * as path from 'path';

async function cleanAndImport() {
  console.log('🚀 开始清空旧数据并重新导入...\n');

  // 直接连接数据库，不通过 NestJS
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '123456',
    database: 'vietnam_test',
  });

  try {
    // 1. 删除旧表
    console.log('🗑️  删除旧表结构...');
    await connection.query('DROP TABLE IF EXISTS `trading_settings`');
    await connection.query('DROP TABLE IF EXISTS `stock_info`');
    await connection.query('DROP TABLE IF EXISTS `crypto_info`');
    console.log('✅ 旧表已删除\n');

    // 2. 创建新表结构（使用英文字段名）
    console.log('🔄 创建新表结构...');
    
    // 创建 trading_settings 表
    await connection.query(`
      CREATE TABLE \`trading_settings\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`orderNum\` int NOT NULL COMMENT '序号',
        \`type\` varchar(50) NOT NULL COMMENT '品种类型',
        \`code\` varchar(20) NOT NULL COMMENT '代码',
        \`nameCn\` varchar(100) NOT NULL COMMENT '简体名称',
        \`nameEn\` varchar(100) NOT NULL COMMENT '英文名称',
        \`nameVn\` varchar(100) DEFAULT NULL COMMENT '越南语名称',
        \`currencyType\` varchar(10) DEFAULT NULL COMMENT '货币类型',
        \`marginCurrency\` varchar(10) DEFAULT NULL COMMENT '保证金货币',
        \`decimalPlaces\` decimal(10,2) DEFAULT NULL COMMENT '小数位',
        \`bidSpread\` decimal(10,2) DEFAULT NULL COMMENT '买价价差',
        \`askSpread\` decimal(10,2) DEFAULT NULL COMMENT '卖价价差',
        \`spread\` decimal(10,2) DEFAULT NULL COMMENT '价差',
        \`contractSize\` decimal(10,2) DEFAULT NULL COMMENT '合约量',
        \`minPriceChange\` decimal(10,2) DEFAULT NULL COMMENT '交易最小变动',
        \`fixedLeverage\` decimal(10,2) DEFAULT NULL COMMENT '固定杠杆',
        \`liquidationRange\` decimal(10,6) DEFAULT NULL COMMENT '涨跌爆仓幅度',
        \`forcedLiquidationRatio\` decimal(10,2) DEFAULT NULL COMMENT '强制平仓比例',
        \`tradingHours\` text COMMENT '交易时间',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`IDX_code\` (\`code\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    // 创建 stock_info 表
    await connection.query(`
      CREATE TABLE \`stock_info\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`orderNum\` int NOT NULL COMMENT '序号',
        \`type\` varchar(50) NOT NULL COMMENT '品种类型',
        \`code\` varchar(20) NOT NULL COMMENT '股票代码',
        \`nameCn\` varchar(100) NOT NULL COMMENT '简体名称',
        \`nameEn\` varchar(200) NOT NULL COMMENT '英文名称',
        \`companyName\` varchar(200) DEFAULT NULL COMMENT '公司名称',
        \`listingDate\` date DEFAULT NULL COMMENT '上市日期',
        \`issuePrice\` decimal(10,2) DEFAULT NULL COMMENT '发行价格',
        \`isinCode\` varchar(50) DEFAULT NULL COMMENT 'ISIN代码',
        \`foundedYear\` int DEFAULT NULL COMMENT '成立日期（年份）',
        \`ceo\` varchar(200) DEFAULT NULL COMMENT 'CEO',
        \`marketCn\` varchar(100) DEFAULT NULL COMMENT '所属市场(简)',
        \`marketEn\` varchar(100) DEFAULT NULL COMMENT '所属市场(英/越)',
        \`employees\` int DEFAULT NULL COMMENT '员工数量',
        \`fiscalYearEnd\` date DEFAULT NULL COMMENT '年结日',
        \`address\` varchar(500) DEFAULT NULL COMMENT '公司地址',
        \`city\` varchar(200) DEFAULT NULL COMMENT '城市',
        \`provinceCn\` varchar(100) DEFAULT NULL COMMENT '省份（简）',
        \`provinceEn\` varchar(100) DEFAULT NULL COMMENT '省份(英/越)',
        \`countryCn\` varchar(100) DEFAULT NULL COMMENT '国家(简)',
        \`countryEn\` varchar(100) DEFAULT NULL COMMENT '国家(英)',
        \`countryVn\` varchar(100) DEFAULT NULL COMMENT '国家(越)',
        \`zipCode\` varchar(50) DEFAULT NULL COMMENT '邮编',
        \`phone\` varchar(50) DEFAULT NULL COMMENT '电话',
        \`website\` varchar(200) DEFAULT NULL COMMENT '网址',
        \`descriptionCn\` text COMMENT '公司简介（简体）',
        \`descriptionVn\` text COMMENT '公司简介（越南）',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`IDX_code\` (\`code\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    // 创建 crypto_info 表
    await connection.query(`
      CREATE TABLE \`crypto_info\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`orderNum\` int NOT NULL COMMENT '序号',
        \`type\` varchar(50) NOT NULL COMMENT '品种类型',
        \`code\` varchar(20) NOT NULL COMMENT '加密货币代码',
        \`nameCn\` varchar(100) NOT NULL COMMENT '简体名称',
        \`nameEn\` varchar(200) NOT NULL COMMENT '英文名称',
        \`marketCapRank\` int DEFAULT NULL COMMENT '市值排名',
        \`marketCap\` varchar(200) DEFAULT NULL COMMENT '市值',
        \`fullyDilutedMarketCap\` varchar(200) DEFAULT NULL COMMENT '完全稀释市值',
        \`circulatingSupply\` varchar(100) DEFAULT NULL COMMENT '流通数量',
        \`maxSupply\` varchar(100) DEFAULT NULL COMMENT '最大供给量',
        \`totalSupply\` varchar(100) DEFAULT NULL COMMENT '总量',
        \`launchDate\` date DEFAULT NULL COMMENT '发行日期',
        \`allTimeHigh\` decimal(20,8) DEFAULT NULL COMMENT '历史最高价',
        \`allTimeLow\` decimal(20,8) DEFAULT NULL COMMENT '历史最低价',
        \`descriptionCn\` text COMMENT '币种简介（简体）',
        \`descriptionVn\` text COMMENT '币种简介（越南）',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`IDX_code\` (\`code\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    console.log('✅ 新表结构已创建\n');

    // 3. 读取 Excel 并导入数据
    const filePath = path.resolve(__dirname, '../CFD品种信息表.xlsx');
    const workbook = XLSX.readFile(filePath);

    // 辅助函数：Excel 日期转换
    function excelDateToJSDate(excelDate: number): string | null {
      if (!excelDate || typeof excelDate !== 'number') {
        return null;
      }
      const date = new Date((excelDate - 25569) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }

    // 4. 导入品种交易设置
    console.log('📊 导入品种交易设置...');
    const tradingSettingsSheet = workbook.Sheets['品种交易设置'];
    const tradingSettingsData = XLSX.utils.sheet_to_json(tradingSettingsSheet);
    
    for (const item of tradingSettingsData as any[]) {
      await connection.query(
        `INSERT INTO trading_settings 
        (orderNum, type, code, nameCn, nameEn, nameVn, currencyType, marginCurrency, decimalPlaces, bidSpread, askSpread, spread, contractSize, minPriceChange, fixedLeverage, liquidationRange, forcedLiquidationRatio, tradingHours)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item['序号'],
          item['品种类型'],
          item['代码'],
          item['简体名称'],
          item['英文名称'],
          item['越南语名称'],
          item['货币类型'],
          item['保证金货币'],
          item['小数位'],
          item['买价价差'],
          item['卖价价差'],
          item['价差'],
          item['合约量'],
          item['交易最小变动'],
          item['固定杠杆'],
          item['涨跌爆仓幅度'],
          item['强制平仓比例'],
          item['交易时间'],
        ]
      );
    }
    console.log(`✅ 成功导入 ${tradingSettingsData.length} 条品种交易设置数据\n`);

    // 5. 导入股票基础信息
    console.log('📊 导入股票基础信息...');
    const stockInfoSheet = workbook.Sheets['股票基础信息'];
    const stockInfoData = XLSX.utils.sheet_to_json(stockInfoSheet);
    
    for (const item of stockInfoData as any[]) {
      await connection.query(
        `INSERT INTO stock_info 
        (orderNum, type, code, nameCn, nameEn, companyName, listingDate, issuePrice, isinCode, foundedYear, ceo, marketCn, marketEn, employees, fiscalYearEnd, address, city, provinceCn, provinceEn, countryCn, countryEn, countryVn, zipCode, phone, website, descriptionCn, descriptionVn)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item['序号'],
          item['品种类型'],
          item['代码'],
          item['简体名称'],
          item['英文名称'],
          item['公司名称'],
          excelDateToJSDate(item['上市日期']),
          item['发行价格'],
          item['ISIN代码'],
          item['成立日期'],
          item['CEO'],
          item['所属市场(简)'],
          item['所属市场(英/越)'],
          item['员工数量'],
          excelDateToJSDate(item['年结日']),
          item['公司地址'],
          item['城市(简/英/越)'],
          item['省份（简）'],
          item['省份(英/越)'],
          item['国家(简)'],
          item['国家(英)'],
          item['国家(越)'],
          item['邮编'],
          item['电话'],
          item['网址'],
          item['公司简介（简体）'],
          item['公司简介（越南）'],
        ]
      );
    }
    console.log(`✅ 成功导入 ${stockInfoData.length} 条股票基础信息数据\n`);

    // 6. 导入加密货币基础信息
    console.log('?? 导入加密货币基础信息...');
    const cryptoInfoSheet = workbook.Sheets['加密货币基础信息'];
    const cryptoInfoData = XLSX.utils.sheet_to_json(cryptoInfoSheet);
    
    for (const item of cryptoInfoData as any[]) {
      await connection.query(
        `INSERT INTO crypto_info 
        (orderNum, type, code, nameCn, nameEn, marketCapRank, marketCap, fullyDilutedMarketCap, circulatingSupply, maxSupply, totalSupply, launchDate, allTimeHigh, allTimeLow, descriptionCn, descriptionVn)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item['序号'],
          item['品种类型'],
          item['代码'],
          item['简体名称'],
          item['英文名称'],
          item['市值排名'],
          item['市值'],
          item['完全稀释市值'],
          item['流通数量'],
          item['最大供给量'],
          item['总量'],
          excelDateToJSDate(item['发行日期']),
          item['历史最高价'],
          item['历史最低价'],
          item['币种简介（简体）'],
          item['币种简介（越南）'],
        ]
      );
    }
    console.log(`✅ 成功导入 ${cryptoInfoData.length} 条加密货币基础信息数据\n`);

    console.log('🎉 所有数据导入完成！');
  } catch (error) {
    console.error('❌ 操作失败:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

cleanAndImport()
  .then(() => {
    console.log('\n✨ 重构完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 重构失败:', error);
    process.exit(1);
  });