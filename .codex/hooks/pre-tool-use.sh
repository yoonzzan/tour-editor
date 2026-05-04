#!/bin/bash
# .claude/hooks/pre-tool-use.sh
# PreToolUse Hook — 위험한 명령 실행 전 차단
# Exit 2 = 차단, Exit 0 = 허용

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

# ── 1. 위험 bash 명령 차단 ──────────────────────────
if [ "$TOOL" = "Bash" ]; then
  DANGER_PATTERNS=(
    "rm -rf"
    "git push.*main"
    "git push.*master"
    "git push --force"
    "git reset --hard"
    "sudo "
    "chmod 777"
    "DROP TABLE"
    "DELETE FROM.*WHERE"
    "truncate"
    "> .env"
    "curl.*| bash"
    "wget.*| sh"
  )

  for pattern in "${DANGER_PATTERNS[@]}"; do
    if echo "$COMMAND" | grep -qi "$pattern"; then
      echo "🚫 [HOOK] 위험 명령 차단: $pattern 패턴 감지" >&2
      echo "명령: $COMMAND" >&2
      exit 2
    fi
  done
fi

# ── 2. 민감 파일 쓰기 차단 ──────────────────────────
if [ "$TOOL" = "Write" ] || [ "$TOOL" = "str_replace" ]; then
  PROTECTED_FILES=(".env" ".env.local" ".env.production")
  for protected in "${PROTECTED_FILES[@]}"; do
    if [[ "$FILE_PATH" == *"$protected"* ]]; then
      echo "🚫 [HOOK] 민감 파일 수정 차단: $FILE_PATH" >&2
      exit 2
    fi
  done
fi

exit 0
