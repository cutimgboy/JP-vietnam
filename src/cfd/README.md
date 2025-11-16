# CFD 品种信息模块使用说明

## 📦 模块概述

CFD（差价合约）品种信息模块用于管理和查询交易品种的基础信息，包括：
- 品种交易设置（100条）
- 股票基础信息（120条）
- 加密货币基础信息（20条）

## 📊 数据来源

数据从 `CFD品种信息表.xlsx` Excel 文件导入，包含三个工作表的完整信息。

## 🗄️ 数据库表结构

### 1. trading_settings（品种交易设置）
存储各类交易品种的交易规则和参数。

**主要字段：**
- `代码`：品种代码（如 AAPL、BTC）
- `简体名称`、`英文名称`、`越南名称`
- `品种类型`：指数、股票、加密货币等
- `交易时段`、`最小交易量`、`最大交易量`
- `点差`、`杠杆`
- `隔夜利息多头`、`隔夜利息空头`
- `是否可交易`

### 2. stock_info（股票基础信息）
存储股票的详细公司信息。

**主要字段：**
- `代码`：股票代码（如 AAPL、MSFT）
- `简体名称`、`英文名称`、`公司名称`
- `上市日期`、`发行价格`、`ISIN代码`
- `CEO`、`员工数量`、`所属市场`
- `公司地址`、`城市`、`省份`、`国家`
- `电话`、`网址`
- `公司简介（简体）`、`公司简介（越南）`

### 3. crypto_info（加密货币基础信息）
存储加密货币的详细信息。

**主要字段：**
- `代码`：加密货币代码（如 BTC、ETH）
- `简体名称`、`英文名称`
- `市值排名`、`市值`、`完全稀释市值`
- `流通数量`、`最大供给量`、`总量`
- `发行日期`
- `历史最高价`、`历史最低价`
- `币种简介（简体）`、`币种简介（越南）`

## 🚀 API 接口

所有接口路径前缀：`/cfd`

### 品种交易设置

```typescript
// 获取所有品种交易设置
GET /cfd/trading-settings
// 返回：TradingSettingsEntity[]

// 根据代码获取品种交易设置
GET /cfd/trading-settings/:code
// 示例：GET /cfd/trading-settings/AAPL
// 返回：TradingSettingsEntity | null
```

### 股票信息

```typescript
// 获取所有股票信息
GET /cfd/stocks
// 返回：StockInfoEntity[]

// 根据代码获取股票信息
GET /cfd/stocks/:code
// 示例：GET /cfd/stocks/AAPL
// 返回：StockInfoEntity | null
```

### 加密货币信息

```typescript
// 获取所有加密货币信息
GET /cfd/cryptos
// 返回：CryptoInfoEntity[]

// 根据代码获取加密货币信息
GET /cfd/cryptos/:code
// 示例：GET /cfd/cryptos/BTC
// 返回：CryptoInfoEntity | null
```

## 💡 使用示例

### 在其他模块中使用

```typescript
import { Injectable } from '@nestjs/common';
import { CfdService } from '../cfd/cfd.service';

@Injectable()
export class TradingService {
  constructor(private cfdService: CfdService) {}

  async getStockInfo(code: string) {
    // 查询股票信息
    const stock = await this.cfdService.findStockByCode(code);
    
    if (!stock) {
      throw new Error('股票不存在');
    }
    
    return {
      name: stock.简体名称,
      ceo: stock.CEO,
      employees: stock.员工数量,
      market: stock.所属市场简,
    };
  }

  async getCryptoInfo(code: string) {
    // 查询加密货币信息
    const crypto = await this.cfdService.findCryptoByCode(code);
    
    return {
      name: crypto.简体名称,
      rank: crypto.市值排名,
      highPrice: crypto.历史最高价,
      lowPrice: crypto.历史最低价,
    };
  }
}
```

### HTTP 请求示例

```bash
# 获取苹果股票信息
curl http://localhost:3000/cfd/stocks/AAPL

# 返回示例：
{
  "id": 3,
  "序号": 3,
  "品种类型": "股票",
  "代码": "AAPL",
  "简体名称": "苹果",
  "英文名称": "Apple Inc",
  "CEO": "Mr. Timothy D. Cook",
  "所属市场简": "纳斯达克",
  "员工数量": 164000,
  "公司地址": "One Apple Park Way",
  "城市": "Cupertino",
  "国家简": "美国",
  "电话": "1-408-996-1010",
  "网址": "http://www.apple.com",
  ...
}

# 获取比特币信息
curl http://localhost:3000/cfd/cryptos/BTC

# 返回示例：
{
  "id": 1,
  "序号": 1,
  "品种类型": "Crypto",
  "代码": "BTC",
  "简体名称": "比特币",
  "英文名称": "Bitcoin",
  "市值排名": 1,
  "流通数量": "1989.93万",
  "最大供给量": "2100万",
  "历史最高价": "123217.39000000",
  "历史最低价": "0.04864654",
  ...
}
```

## 🔄 数据导入

### 重新导入数据

如果需要重新导入 Excel 数据：

```bash
# 执行导入脚本
npx ts-node scripts/import-cfd-data.ts

# 验证导入结果
npx ts-node scripts/verify-import.ts
```

### 导入流程

1. 读取 `CFD品种信息表.xlsx` 文件
2. 解析三个工作表的数据
3. 转换数据格式（包括日期转换）
4. 批量插入数据库
5. 验证数据完整性

## 📝 注意事项

1. **唯一性约束**：`代码` 字段为唯一索引，不能重复
2. **日期格式**：Excel 日期会自动转换为 JavaScript Date 对象
3. **数据同步**：`synchronize: true` 开启时，实体变更会自动更新表结构
4. **生产环境**：建议关闭 `synchronize`，使用 migration 管理数据库结构

## 🎯 已导入数据统计

- ✅ 品种交易设置：100 条
- ✅ 股票基础信息：120 条  
- ✅ 加密货币信息：20 条

**总计：240 条记录**

## 🔗 相关文档

- [TypeORM 实体文档](https://typeorm.io/entities)
- [NestJS 模块文档](https://docs.nestjs.com/modules)
- [Swagger API 文档](http://localhost:3000/docs)

## 🛠️ 维护建议

1. **定期更新**：股票和加密货币信息需定期更新
2. **数据校验**：导入前验证 Excel 数据格式
3. **备份机制**：重要数据建议定期备份
4. **日志记录**：记录每次数据导入的时间和结果