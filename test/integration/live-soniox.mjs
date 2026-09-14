// 라이브 통합 검증: TS 서버 실 기동 → 실제 오디오 스트리밍 →
// Soniox STT + 화자분리(solo) + LibreTranslate 번역 → WS 자막 수신 확인.
//
// 실 Soniox 키가 있어야 도는 수동 검증(유닛 스위트와 별개, CI 제외).
// 사용법: node test/integration/live-soniox.mjs <wav> [envfile]
//   wav      : s16le 16kHz mono WAV (실제 사람 목소리)
//   envfile  : SONIOX_API_KEY=... 가 든 .env (기본 speetch-translator/backend/.env)
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { WebSocket } from "ws";

const WAV = process.argv[2];
const ENVFILE =
  process.argv[3] ??
  `${process.env.HOME}/Project/speetch-translator/backend/.env`;
const PORT = 8097;
const LT_PORT = 15097;

const sonioxKey = readFileSync(ENVFILE, "utf8")
  .split("\n")
  .find((l) => l.startsWith("SONIOX_API_KEY="))
  ?.split("=", 2)[1]
  ?.trim()
  ?.replace(/^"|"$/g, "");

if (!sonioxKey) {
  console.error("SONIOX_API_KEY 없음:", ENVFILE);
  process.exit(1);
}

// 1) LibreTranslate 스텁 — 번역 파이프라인 배선만 검증(실 LT 미도달 환경)
const stub = createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const { q } = JSON.parse(body || "{}");
    res.setHeader("Content-Type", "application/json");
    if (req.url === "/detect") return res.end(JSON.stringify([{ language: "ko" }]));
    res.end(JSON.stringify({ translatedText: "〔번역〕" + q }));
  });
});
await new Promise((r) => stub.listen(LT_PORT, r));

// 2) TS 서버 기동
const server = spawn("npx", ["tsx", "src/main.ts"], {
  env: {
    ...process.env,
    PORT: String(PORT),
    SONIOX_API_KEY: sonioxKey,
    LIBRETRANSLATE_URL: `http://127.0.0.1:${LT_PORT}`,
  },
  stdio: ["ignore", "pipe", "pipe"],
});
server.stdout.on("data", (d) => process.stdout.write(`[server] ${d}`));
server.stderr.on("data", (d) => process.stderr.write(`[server:err] ${d}`));

const cleanup = () => {
  server.kill();
  stub.close();
};

await new Promise((r) => setTimeout(r, 2500));

// 3) WS 접속 → join(solo) → PCM 스트리밍
const pcm = readFileSync(WAV).subarray(44); // WAV 헤더 스킵
const ws = new WebSocket(`ws://127.0.0.1:${PORT}/ws/live-room`);
const realtime = [];
const finals = [];

ws.on("open", async () => {
  ws.send(JSON.stringify({ type: "join", user_name: "테스터", solo: true }));
  await new Promise((r) => setTimeout(r, 300));
  const CHUNK = 3200; // 100ms @ 16k s16le
  for (let i = 0; i < pcm.length; i += CHUNK) {
    ws.send(pcm.subarray(i, i + CHUNK));
    await new Promise((r) => setTimeout(r, 20)); // ~5배속
  }
  ws.send(Buffer.alloc(3200 * 12)); // 끝 침묵 → endpoint
});

ws.on("message", (raw) => {
  const m = JSON.parse(raw.toString());
  if (m.type === "realtime_transcript") realtime.push(m);
  if (m.type === "transcript") finals.push(m);
});

// 4) 결과 집계
await new Promise((r) => setTimeout(r, 45000));
ws.close();

const speakers = new Set(finals.map((f) => f.speaker).filter((s) => s != null));
console.log(`\n=== 라이브 통합 결과 ===`);
console.log(`realtime_transcript(부분자막): ${realtime.length}건`);
console.log(`transcript(원문+번역): ${finals.length}건`);
console.log(`감지된 화자: ${[...speakers].sort().join(", ")} (${speakers.size}명)\n`);
for (const f of finals.slice(0, 12)) {
  console.log(`[화자 ${f.speaker}][${f.original_language}] ${f.original_text}`);
  console.log(`   → [${f.translated_language}] ${f.translated_text}`);
}

const ok = finals.length > 0 && finals.some((f) => f.translated_text);
console.log(`\n${ok ? "PASS" : "FAIL"}: STT→화자분리→번역→WS 자막 파이프라인`);
cleanup();
process.exit(ok ? 0 : 2);
