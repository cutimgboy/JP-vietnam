# 股票行情轮询服务任务计划

## 任务概述
去除与客户端连接的相关逻辑，将 quote 模块改为纯服务端数据接收和缓存，通过 HTTP API 提供轮询接口。

## 任务列表

- [ ] 任务1：移除 QuoteGateway 相关代码
    - 1.1: 删除 quote.gateway.ts 文件
    - 1.2: 从 quote.module.ts 中移除 QuoteGateway 依赖
    - 1.3: 移除 WebSocket 相关的依赖导入

- [ ] 任务2：修改 QuoteService 移除客户端连接逻辑
    - 2.1: 移除消息回调相关的方法（onMessage, onTickData 等）
    - 2.2: 移除客户端订阅管理相关方法
    - 2.3: 简化连接逻辑，专注于数据接收

- [ ] 任务3：添加 Redis 缓存功能
    - 3.1: 在 QuoteService 中注入 RedisService
    - 3.2: 添加数据缓存方法
    - 3.3: 设置合理的缓存过期时间

- [ ] 任务4：创建 QuoteController
    - 4.1: 创建 quote.controller.ts 文件
    - 4.2: 实现获取单个股票行情的 GET 接口
    - 4.3: 实现批量获取股票行情的 GET 接口
   