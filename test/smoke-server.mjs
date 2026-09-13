// 스모크: 서버 기동 → WS 접속 → join → user_joined 브로드캐스트 수신 확인
import { WebSocket } from "ws";

const PORT = process.env.PORT ?? "8091";
const ws = new WebSocket(`ws://127.0.0.1:${PORT}/ws/smoke-room`);

const timer = setTimeout(() => {
  console.error("FAIL: 타임아웃 (user_joined 미수신)");
  process.exit(1);
}, 5000);

ws.on("open", () => {
  ws.send(JSON.stringify({ type: "join", user_name: "테스터", solo: true }));
});

ws.on("message", (raw) => {
  const msg = JSON.parse(raw.toString());
  if (msg.type === "user_joined" && msg.user_name === "테스터") {
    console.log("PASS: user_joined 수신 —", JSON.stringify(msg));
    clearTimeout(timer);
    ws.close();
    process.exit(0);
  }
});

ws.on("error", (e) => {
  console.error("FAIL: WS 오류", e.message);
  process.exit(1);
});
