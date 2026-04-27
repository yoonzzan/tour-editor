#!/bin/bash
# .claude/hooks/on-stop.sh
# Stop Hook — Claude 응답 완료 시 간단한 상태 요약

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 세션 종료 체크"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. any 타입 현황
ANY_COUNT=$(grep -rn ": any\b\|as any\b" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
if [ "$ANY_COUNT" -gt 0 ]; then
  echo "⚠️  any 타입: ${ANY_COUNT}건 (npm run typecheck 로 확인)"
else
  echo "✅ any 타입: 없음"
fi

# 2. TODO 주석 현황
TODO_COUNT=$(grep -rn "TODO\|FIXME\|HACK" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
if [ "$TODO_COUNT" -gt 0 ]; then
  echo "📌 TODO/FIXME: ${TODO_COUNT}건"
fi

# 3. 버전 덮어쓰기 패턴
VERSION_UPDATE=$(grep -rn "quoteVersion.*update" src/ --include="*.ts" 2>/dev/null | wc -l)
if [ "$VERSION_UPDATE" -gt 0 ]; then
  echo "🚨 버전 덮어쓰기 패턴 감지! 즉시 수정 필요"
fi

# 4. PROGRESS.md 업데이트 리마인더
echo ""
echo "💡 완료된 태스크가 있다면 docs/PROGRESS.md 업데이트를 잊지 마세요"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

exit 0
