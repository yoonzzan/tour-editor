#!/bin/bash
# .claude/hooks/post-write-ts.sh
# PostToolUse Hook — TypeScript 파일 저장 후 자동 타입 체크
# notify 모드: 실패해도 차단하지 않고 경고만 표시

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

# TS/TSX 파일이 아니면 스킵
if [[ "$FILE_PATH" != *.ts ]] && [[ "$FILE_PATH" != *.tsx ]]; then
  exit 0
fi

echo "🔍 [HOOK] TypeScript 체크: $FILE_PATH"

# 타입 체크 실행 (에러만, 전체 프로젝트 대상)
RESULT=$(npx tsc --noEmit --pretty 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo "⚠️  [HOOK] 타입 에러 발견:" >&2
  echo "$RESULT" | head -20 >&2
  echo "" >&2
  echo "→ npm run typecheck 로 전체 확인하세요" >&2
  # notify only — exit 0으로 차단하지 않음
fi

# any 타입 감지
ANY_COUNT=$(grep -n ": any\b\|as any\b\|<any>" "$FILE_PATH" 2>/dev/null | wc -l)
if [ "$ANY_COUNT" -gt 0 ]; then
  echo "⚠️  [HOOK] 'any' 타입 ${ANY_COUNT}건 감지 in $FILE_PATH" >&2
  grep -n ": any\b\|as any\b\|<any>" "$FILE_PATH" >&2
fi

# 버전 덮어쓰기 패턴 감지
if grep -q "quoteVersion.*update\|\.update.*versionNo\|UPDATE.*quote_version" "$FILE_PATH" 2>/dev/null; then
  echo "🚨 [HOOK] 버전 덮어쓰기 패턴 감지! 버전은 새 레코드 INSERT만 허용합니다." >&2
  echo "파일: $FILE_PATH" >&2
fi

exit 0
