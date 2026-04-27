---
paths:
  - "src/lib/version/**"
  - "src/app/api/versions/**"
---
# 버전 관리 규칙 — 절대 준수

## 핵심 불변 원칙
```
협력사 최초 제출 → v1.0  (createVersion에서 자동)
이후 수정 저장   → v1.1, v1.2 ... (항상 +0.1)
기존 버전 수정   → 절대 금지 (DB 레벨에서도 차단)
```

## 버전 번호 생성 — createVersion.ts만 사용
```typescript
// ✅ 올바름
import { createVersion } from '@/lib/version/createVersion'
const newVersion = await createVersion(quoteId, data, userId)

// ❌ 금지 — 직접 계산
const next = `v${parseFloat(current.replace('v', '')) + 0.1}`
```

## 스냅샷 범위 — 두 문서 항상 함께 저장
```typescript
interface VersionSnapshot {
  itineraryData: ItineraryData  // 일정표 전체
  quoteData: QuoteData          // 견적서 전체
  // 분리 저장 절대 금지
}
```

## 메타데이터 필수 필드
```typescript
{
  versionNo: string      // "v1.0"
  savedBy: string        // userId
  savedByRole: Role      // 저장 시점 역할
  savedAt: Date          // UTC
  changeReason?: string  // 선택
}
```

## DB 쿼리 패턴
```typescript
// ✅ 새 버전 생성 (INSERT)
await prisma.quoteVersion.create({ data: { ...snapshot } })

// ❌ 절대 금지 (UPDATE)
await prisma.quoteVersion.update({ where: { id }, data: { ... } })
```

## 버전 충돌 (낙관적 잠금)
- 저장 요청 시 `expectedVersion` 받음
- DB의 `latestVersion`과 비교
- 불일치 → `VERSION_CONFLICT` 에러 반환 (덮어쓰기 금지)
