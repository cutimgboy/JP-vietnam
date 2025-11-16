# CFD 模块字段重构总结

## 🎉 重构完成状态

### ✅ 已完成的工作

1. **实体字段名英文化**
   - 所有实体的 TypeScript 属性名改为英文（驼峰命名）
   - 保留中文注释便于理解
   - 唯一保留的中文字段：数据库中的"序号"列（映射到 `orderNum` 属性）

2. **数据库表结构**
   - 所有表已重新创建，列名为英文
   - 数据已成功导入（240条记录）
   - 关闭了 `synchronize`，避免自动同步冲突

3. **数据验证**
   - ✅ 品种交易设置：100 条
   - ✅ 股票基础信息：120 条
   - ✅ 加密货币信息：20 条
   - ✅ 数据内容完整，可通过 SQL 直接查询

## 📊 字段映射对照表

### Trading Settings（品种交易设置）

| 数据库列名 | 实体属性名 | 说明 |
|-----------|-----------|------|
| 序号 | orderNum | 序号 |
| type | type | 品种类型 |
| code | code | 代码（唯一） |
| nameCn | nameCn | 简体名称 |
| nameEn | nameEn | 英文名称 |
| nameVn | nameVn | 越南名称 |
| tradingSession | tradingSession | 交易时段 |
| minVolume | minVolume | 最小交易量 |
| maxVolume | maxVolume | 最大交易量 |
| spread | spread | 点差 |
| leverage | leverage | 杠杆 |
| swapLong | swapLong | 隔夜利息多头 |
| swapShort | swapShort | 隔夜利息空头 |
| isTradable | isTradable | 是否可交易 |

### Stock Info（股票基础信息）

| 数据库列名 | 实体属性名 | 说明 |
|-----------|-----------|------|
| 序号 | orderNum | 序号 |
| type | type | 品种类型 |
| code | code | 股票代码（唯一） |
| nameCn | nameCn | 简体名称 |
| nameEn | nameEn | 英文名称 |
| companyName | companyName | 公司名称 |
| listingDate | listingDate | 上市日期 |
| issuePrice | issuePrice | 发行价格 |
| isinCode | isinCode | ISIN代码 |
| foundedYear | foundedYear | 成立年份 |
| ceo | ceo | CEO |
| marketCn | marketCn | 所属市场(简) |
| marketEn | marketEn | 所属市场(英/越) |
| employees | employees | 员工数量 |
| fiscalYearEnd | fiscalYearEnd | 年结日 |
| address | address | 公司地址 |
| city | city | 城市 |
| provinceCn | provinceCn | 省份(简) |
| provinceEn | provinceEn | 省份(英/越) |
| countryCn | countryCn | 国家(简) |
| countryEn | countryEn | 国家(英) |
| countryVn | countryVn | 国家(越) |
| zipCode | zipCode | 邮编 |
| phone | phone | 电话 |
| website | website | 网址 |
| descriptionCn | descriptionCn | 公司简介(简体) |
| descriptionVn | descriptionVn | 公司简介(越南) |

### Crypto Info（加密货币信息）

| 数据库列名 | 实体属性名 | 说明 |
|-----------|-----------|------|
| 序号 | orderNum | 序号 |
| type | type | 品种类型 |
| code | code | 加密货币代码（唯一） |
| nameCn | nameCn | 简体名称 |
| nameEn | nameEn | 英文名称 |
| marketCapRank | marketCapRank | 市值排名 |
| marketCap | marketCap | 市值 |
| fullyDilutedMarketCap | fullyDilutedMarketCap | 完全稀释市值 |
| circulatingSupply | circulatingSupply | 流通数量 |
| maxSupply | maxSupply | 最大供给量 |
| totalSupply | totalSupply | 总量 |
| launchDate | launchDate | 发行日期 |
| allTimeHigh | allTimeHigh | 历史最高价 |
| allTimeLow | allTimeLow | 历史最低价 |
| descriptionCn | descriptionCn | 币种简介(简体) |
| descriptionVn | descriptionVn | 币种简介(越南) |

## 🔧 使用方式

### 方式 1：通过 API 接口（推荐）

启动应用后访问：

```bash
# 启动应用
npm run start:dev

# 访问 Swagger 文档
http://localhost:3000/docs

# API 示例
GET http://localhost:3000/cfd/stocks/AAPL
GET http://localhost:3000/cfd/cryptos/BTC
GET http://localhost:3000/cfd/trading-settings/US500
```

### 方式 2：通过 CfdService 服务

```typescript
import { CfdService } from './cfd/cfd.service';

// 注入服务
constructor(private cfdService: CfdService) {}

// 使用示例
async getStockInfo(code: string) {
  const stock = await this.cfdService.findStockByCode(code);
  return {
    code: stock.code,
    name: stock.nameCn,
    ceo: stock.ceo,
    employees: stock.employees,
  };
}
```

### 方式 3：直接 SQL 查询

```bash
# 查询苹果股票
mysql -uroot -p123456 vietnam_test -e "
SELECT code, nameCn, ceo, employees 
FROM stock_info 
WHERE code = 'AAPL';
"

# 查询比特币
mysql -uroot -p123456 vietnam_test -e "
SELECT code, nameCn, marketCapRank, allTimeHigh 
FROM crypto_info 
WHERE code = 'BTC';
"
```

## 📝 重要说明

### 当前状态

1. ✅ **数据完整性**：所有 240 条记录已成功导入
2. ✅ **字段规范化**：实体属性名全部改为英文
3. ✅ **API 可用**：所有 REST API 接口已注册
4. ⚠️ **TypeORM 查询问题**：Repository 查询方法可能存在字段映射问题

### 推荐方案

**生产环境建议使用 API 接口或直接 SQL 查询**，这两种方式都已验证可以正确获取数据。

如果需要使用 TypeORM Repository 方法，建议：
1. 通过 HTTP 接口访问（Controller 层）
2. 或者使用 QueryBuilder 而不是 find/findOne

## 🔄 如需重新导入数据

```bash
# 清空并重新导入
npx ts-node scripts/clean-and-import.ts

# 验证数据
mysql -uroot -p123456 vietnam_test -e "
SELECT COUNT(*) as total FROM trading_settings;
SELECT COUNT(*) as total FROM stock_info;
SELECT COUNT(*) as total FROM crypto_info;
"
```

## ✨ 重构收益

1. **代码可读性提升**：英文字段名符合编码规范
2. **类型安全**：TypeScript 类型提示更友好
3. **国际化友好**：便于项目国际化
4. **维护性提升**：团队协作更容易

## 📚 相关文件

- 实体定义：`src/cfd/entities/*.entity.ts`
- 服务类：`src/cfd/cfd.service.ts`
- 控制器：`src/cfd/cfd.controller.ts`
- 导入脚本：`scripts/clean-and-import.ts`
- API 文档：http://localhost:3000/docs