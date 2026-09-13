import { createServer, IncomingMessage, Server } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { ConnectionDeps, handleConnection } from "./connection-handler.js";
import { RoomRegistry } from "./room-registry.js";

// ws://host/ws/{roomId} 로 들어오는 연결을 방별로 붙인다.
export class SubtitleServer {
  private readonly registry = new RoomRegistry();

  constructor(private readonly deps: ConnectionDeps) {}

  listen(port: number): Server {
    const http = createServer();
    const wss = new WebSocketServer({ server: http });
    wss.on("connection", (socket, request) => this.attach(socket, request));
    http.listen(port);
    return http;
  }

  private attach(socket: WebSocket, request: IncomingMessage): void {
    const roomId = roomIdOf(request.url ?? "");
    if (roomId === null) {
      socket.close();
      return;
    }
    handleConnection(socket, roomId, this.registry, this.deps);
  }
}

function roomIdOf(url: string): string | null {
  const match = url.match(/^\/ws\/([^/?]+)/);
  return match?.[1] ?? null;
}
