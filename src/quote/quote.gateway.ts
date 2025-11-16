import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { QuoteService } from './quote.service';

/**
 * WebSocket 网关
 * 处理客户端连接，转发行情数据
 */
@WebSocketGateway({
  cors: {
    origin: '*', // 允许所有来源，生产环境请修改为具体域名
  },
  namespace: '/quote', // 命名空间
})
export class QuoteGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(QuoteGateway.name);

  constructor(private quoteService: QuoteService) {}

  /**
   * WebSocket 网关初始化
   */
  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway 初始化成功');

    // 连接外部行情源
    this.quoteService.connect().then(() => {
      this.logger.log('外部行情源连接成功');
    });

    // 监听外部行情数据，转发给所有客户端
    this.quoteService.onMessage((data) => {
      // 广播给所有连接的客户端
      this.server.emit('quote-data', data);
    });
  }

  /**
   * 客户端连接时触发
   */
  handleConnection(client: Socket) {
    this.logger.log(`客户端连接: ${client.id}`);
    
    // 发送连接状态
    client.emit('connection-status', {
      status: 'connected',
      message: '连接成功',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 客户端断开连接时触发
   */
  handleDisconnect(client: Socket) {
    this.logger.log(`客户端断开: ${client.id}`);
  }

  /**
   * 订阅股票行情
   * 客户端发送: { symbols: ['700.HK', 'AAPL.US'], depthLevel: 5 }
   */
  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() data: { symbols: string[]; depthLevel?: number },
    @ConnectedSocket() client: Socket,
  ) {
    const { symbols, depthLevel = 5 } = data;

    if (!symbols || symbols.length === 0) {
      client.emit('error', { message: '请提供要订阅的股票代码' });
      return;
    }

    this.logger.log(`客户端 ${client.id} 订阅: ${symbols.join(', ')}`);
    
    // 调用 QuoteService 订阅
    this.quoteService.subscribe(symbols, depthLevel);

    client.emit('subscribe-success', {
      message: `成功订阅 ${symbols.length} 个股票`,
      symbols,
    });
  }

  /**
   * 取消订阅股票行情
   * 客户端发送: { symbols: ['700.HK'] }
   */
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @MessageBody() data: { symbols: string[] },
    @ConnectedSocket() client: Socket,
  ) {
    const { symbols } = data;

    if (!symbols || symbols.length === 0) {
      client.emit('error', { message: '请提供要取消订阅的股票代码' });
      return;
    }

    this.logger.log(`客户端 ${client.id} 取消订阅: ${symbols.join(', ')}`);
    
    // 调用 QuoteService 取消订阅
    this.quoteService.unsubscribe(symbols);

    client.emit('unsubscribe-success', {
      message: `成功取消订阅 ${symbols.length} 个股票`,
      symbols,
    });
  }

  /**
   * 获取连接状态
   */
  @SubscribeMessage('get-status')
  handleGetStatus(@ConnectedSocket() client: Socket) {
    const status = this.quoteService.getConnectionStatus();
    const subscribedSymbols = this.quoteService.getSubscribedSymbols();

    client.emit('status-info', {
      connectionStatus: status,
      subscribedSymbols,
      timestamp: new Date().toISOString(),
    });
  }
}