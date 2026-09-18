import { Module } from '@nestjs/common';
import { RealtimeGateway } from './socket_nest';

@Module({
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class SocketModule {}
