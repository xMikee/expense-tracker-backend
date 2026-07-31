import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*' }, // restringi al dominio del frontend in produzione
  namespace: 'expenses',
})
export class ExpenseGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ExpenseGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connesso: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnesso: ${client.id}`);
  }

  /** Chiamato dal ExpensesService ogni volta che viene creata una nuova spesa */
  emitNewExpense(expense: unknown) {
    this.server.emit('expense:created', expense);
  }

  /** Chiamato quando cambia il riepilogo budget vs reale (es. dopo ogni nuova spesa) */
  emitBudgetUpdate(summary: unknown) {
    this.server.emit('budget:updated', summary);
  }
}
