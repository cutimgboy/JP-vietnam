-- 创建股票实时价格表
CREATE TABLE IF NOT EXISTS `stock_realtime_price` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(20) NOT NULL COMMENT '股票代码',
  `price` DECIMAL(18,6) NOT NULL COMMENT '实时价格',
  `volume` BIGINT DEFAULT 0 COMMENT '成交量',
  `turnover` DECIMAL(20,2) DEFAULT 0 COMMENT '成交额',
  `tick_time` TIMESTAMP NOT NULL COMMENT 'tick时间戳',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_code_created` (`code`, `createdAt`),
  KEY `idx_created_at` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='股票实时价格表';

-- 创建股票价格变动记录表
CREATE TABLE IF NOT EXISTS `stock_price_change` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(20) NOT NULL COMMENT '股票代码',
  `old_price` DECIMAL(18,6) NOT NULL COMMENT '变化前价格',
  `new_price` DECIMAL(18,6) NOT NULL COMMENT '变化后价格',
  `price_change` DECIMAL(18,6) NOT NULL COMMENT '价格变动',
  `change_rate` DECIMAL(10,6) NOT NULL COMMENT '变动率',
  `volume` BIGINT DEFAULT 0 COMMENT '成交量',
  `tick_time` TIMESTAMP NOT NULL COMMENT 'tick时间戳',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_code_created` (`code`, `createdAt`),
  KEY `idx_created_at` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='股票价格变动记录表';

-- 确保trading_settings表有必要的索引
ALTER TABLE `trading_settings` ADD INDEX `idx_code` (`code`);

-- 插入或更新目标股票的价差设置（如果不存在则使用默认值）
INSERT INTO `trading_settings` (`orderNum`, `type`, `code`, `nameCn`, `nameEn`, `spread`, `askSpread`, `createdAt`, `updatedAt`) VALUES
(1, 'US_STOCK', 'NVDA.US', '英伟达', 'NVIDIA Corporation', 0.20, 0.20, NOW(), NOW()),
(2, 'US_STOCK', 'MSFT.US', '微软', 'Microsoft Corporation', 0.15, 0.15, NOW(), NOW()),
(3, 'US_STOCK', 'AAPL.US', '苹果', 'Apple Inc.', 0.10, 0.10, NOW(), NOW()),
(4, 'US_STOCK', 'AMZN.US', '亚马逊', 'Amazon.com Inc.', 0.25, 0.25, NOW(), NOW()),
(5, 'US_STOCK', 'GOOG.US', '谷歌', 'Alphabet Inc.', 0.20, 0.20, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  `spread` = VALUES(`spread`),
  `askSpread` = VALUES(`askSpread`),
  `updatedAt` = NOW();