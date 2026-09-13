#!/bin/bash
# CLAUDE.md 핵심 규칙을 쓰기 도구 실행 직전에 주입 (전문은 CLAUDE.md — 여기는 요지만)
cat <<'EOF'
{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":"[CLAUDE.md 규칙 요지] R2 최소코드·요청외기능금지 / R3 필요한곳만·주변개선금지 / R13 체조9원칙(들여쓰기1·else금지·원시값포장·클래스필드≤2·게터세터금지) / R14 의존방향: domain은 외부를 모른다, 어댑터만 외부접촉, VO불변, 애그리게이트경유 / R15 주석은 없는것이 기본(의도·제약만) / R16 테스트명 1초가독(한글 「조건 → 결과」) / R17 WS메시지 계약은 추가만, 선언은 env로. 위반 소지는 진행 전 표면화(R12)."}}
EOF
