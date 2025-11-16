# CFD 产品搜索接口文档

## 📝 接口概述

**接口路径：** `GET /cfd/search`  
**认证要求：** 无需认证（公开接口）  
**功能描述：** 实时搜索 trading_settings 表中的产品，支持代码和名称模糊匹配

---

## 🎯 需求实现

### （1）提示文字
- **前端展示：** "请输入代码或名称"

### （2）支持输入
- **产品代码**：如 `US500`、`NAS100`、`GOLD` 等
- **产品名称**：如 `标普`、`纳斯达克`、`黄金` 等（支持中文、英文、越南语）

### （3）取消按钮
- 前端实现：点击后清空输入框，关闭搜索结果弹窗

### （4）交互逻辑
- **实时匹配**：输入时调用接口搜索 `trading_settings` 表
- **结果展示**：返回匹配的产品列表
- **跳转详情**：点击搜索结果可跳转至产品行情详情页

### （5）搜索匹配优先级
1. **代码完全匹配**（最高优先级）：精确匹配产品代码
2. **名称关键词匹配**（中等优先级）：名称中包含关键词
3. **模糊匹配**（最低优先级）：代码或名称模糊包含关键词

### （6）无结果处理
- 当搜索无结果时返回：`{ "success": false, "message": "未找到相关产品" }`

---

## ?? 接口详情

### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| keyword | string | 是 | 搜索关键词（代码或名称） | `US500` / `标普` |

### 请求示例

```bash
# 搜索代码
GET /cfd/search?keyword=US500

# 搜索中文名称
GET /cfd/search?keyword=标普

# 搜索英文名称
GET /cfd/search?keyword=Dow

# 空关键词
GET /cfd/search?keyword=
```

---

## 📤 响应格式

### 成功响应（找到结果）

```json
{
  "success": true,
  "message": "找到 1 个相关产品",
  "data": [
    {
      "id": 1,
      "orderNum": 1,
      "type": "指数",
      "code": "US500",
      "nameCn": "标准普尔500指数",
      "nameEn": "S&P 500",
      "nameVn": "Chỉ số S&P 500",
      "currencyType": "USD",
      "marginCurrency": "USD",
      "decimalPlaces": 0.01,
      "bidSpread": 30.00,
      "askSpread": 30.00,
      "spread": 0.60,
      "contractSize": 1.00,
      "minPriceChange": 0.50,
      "fixedLeverage": 200.00,
      "liquidationRange": 0.0025,
      "forcedLiquidationRatio": 0.50,
      "tradingHours": "（GMT0时区）：周日 22:00 - 周五21:00",
      "matchType": "exact",
      "source": "trading_settings",
      "createdAt": "2025-11-16T06:35:29.123Z",
      "updatedAt": "2025-11-16T06:35:29.123Z"
    }
  ]
}
```

### 失败响应（未找到结果）

```json
{
  "success": false,
  "message": "未找到相关产品",
  "data": []
}
```

### 错误响应（空关键词）

```json
{
  "success": false,
  "message": "请输入代码或名称",
  "data": []
}
```

---

## 🔍 搜索逻辑说明

### 匹配类型（matchType）

| 匹配类型 | 说明 | 示例 |
|---------|------|------|
| `exact` | 代码完全匹配 | 搜索 `US500` → 精确匹配 `US500` |
| `keyword` | 名称关键词匹配 | 搜索 `标普` → 匹配到 `标准普尔500指数` |
| `fuzzy` | 模糊匹配 | 搜索 `500` → 匹配到 `US500` 或包含500的名称 |

### 搜索范围

- ✅ **代码字段**：`code`（不区分大小写）
- ✅ **简体名称**：`nameCn`
- ✅ **英文名称**：`nameEn`
- ✅ **越南名称**：`nameVn`

### 搜索策略

1. **第一步：代码完全匹配**
   - 将关键词转为大写
   - 与 `code` 字段进行精确匹配
   - 如果找到结果，直接返回，不再继续搜索

2. **第二步：名称关键词匹配**
   - 如果第一步未找到结果
   - 在三个名称字段（`nameCn`、`nameEn`、`nameVn`）中查找包含关键词的记录
   - 返回所有匹配结果

3. **第三步：模糊匹配**
   - 如果前两步都未找到结果
   - 在代码和名称字段中进行更宽松的模糊搜索
   - 返回所有可能相关的结果

---

## 💻 前端集成示例

### Vue 3 + TypeScript

```typescript
// 搜索接口调用
async function searchProducts(keyword: string) {
  if (!keyword.trim()) {
    return { success: false, message: '请输入代码或名称', data: [] };
  }

  try {
    const response = await fetch(
      `http://localhost:3000/cfd/search?keyword=${encodeURIComponent(keyword)}`
    );
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('搜索失败:', error);
    return { success: false, message: '搜索失败', data: [] };
  }
}

// 实时搜索（防抖）
import { debounce } from 'lodash';

const handleSearch = debounce(async (keyword: string) => {
  const result = await searchProducts(keyword);
  
  if (result.success) {
    // 展示搜索结果列表
    showResults(result.data);
  } else {
    // 显示 "未找到相关产品"
    showNoResults(result.message);
  }
}, 300); // 300ms 防抖
```

### React

```typescript
import { useState, useEffect } from 'react';

function useProductSearch(keyword: string) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!keyword.trim()) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `http://localhost:3000/cfd/search?keyword=${encodeURIComponent(keyword)}`
        );
        const result = await response.json();
        
        if (result.success) {
          setResults(result.data);
          setError('');
        } else {
          setResults([]);
          setError(result.message);
        }
      } catch (err) {
        setError('搜索失败');
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [keyword]);

  return { results, loading, error };
}
```

---

## 🧪 测试用例

### 测试场景

| 测试用例 | 关键词 | 预期结果 |
|---------|--------|---------|
| 代码完全匹配 | `US500` | 返回标普500，`matchType: "exact"` |
| 名称关键词匹配 | `标普` | 返回标准普尔500指数，`matchType: "keyword"` |
| 英文名称匹配 | `Dow` | 返回道琼斯指数，`matchType: "keyword"` |
| 越南语名称匹配 | `Chỉ số` | 返回包含该关键词的产品 |
| 不存在的产品 | `AAPL` | `"未找到相关产品"` |
| 空关键词 | ` ` | `"请输入代码或名称"` |
| 模糊匹配 | `100` | 返回所有包含100的产品 |

---

## ⚙️ 性能优化建议

### 前端优化
1. **防抖处理**：用户输入时等待 300-500ms 再发送请求
2. **缓存策略**：对相同关键词的搜索结果进行本地缓存（5分钟内有效）
3. **取消请求**：用户快速输入时取消前一个未完成的请求

### 后端优化
1. **数据库索引**：在 `code`、`nameCn`、`nameEn` 字段添加索引
2. **查询优化**：如代码完全匹配成功，直接返回，不再执行后续查询
3. **结果限制**：限制返回结果数量（如最多20条）

---

## 🔗 相关接口

- `GET /cfd/trading-settings/:code` - 获取指定产品的详细信息
- `GET /cfd/trading-settings` - 获取所有产品列表
- `GET /cfd/stocks/:code` - 获取股票信息
- `GET /cfd/cryptos/:code` - 获取加密货币信息

---

## 📞 技术支持

如有问题请查看：
- API 文档：http://localhost:3000/docs
- 项目文档：`src/cfd/README.md`