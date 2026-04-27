---
paths:
  - "src/components/editor/**"
  - "src/app/(popup)/**"
---
# 에디터 컴포넌트 규칙

## 팝업 진입 파라미터
- `quoteNo`: string (필수) — 기존 견적서 시스템 PK
- `role`: 'partner' | 'agent' | 'sales'
- URL: `/editor/popup?quoteNo=QC00687628001&role=agent`

## 상태 관리
- 에디터 전역 상태: `src/hooks/useEditorStore.ts` (Zustand)
- 서버 데이터: `src/hooks/useQuoteQuery.ts` (TanStack Query)
- 로컬 임시 저장: `localStorage['draft_${quoteId}']`

## 일정 항목 — 다중 허용 규칙
- **동일 일차에 동일 구분의 항목이 여러 개 가능** (핵심!)
- 예: 1일차에 관광-센토사섬, 관광-국립식물원, 관광-스카이파크 (모두 허용)
- 1개로 제한하는 로직 절대 금지
- 숙박만 예외: 일차당 1개, 항상 마지막 위치 고정

## 역할별 UI 분기
```typescript
// partner: 항공 조회 버튼 숨김
// sales: 저장/수정 버튼 숨김, 읽기 전용
// agent: 모든 기능 접근 가능
const canEdit = role !== 'sales'
const canViewFlights = role !== 'partner'
```

## 저장 흐름
1. 저장 버튼 클릭
2. 변경 사유 모달 (선택 입력)
3. `POST /api/versions` — 새 버전 생성
4. 성공 → 토스트 + `postMessage({ type: 'SAVED', version })` → 부모 창 갱신
5. 실패 → 에러 메시지 + 로컬스토리지 임시 저장 유지

## 드래그앤드롭
- 라이브러리: `@dnd-kit/core` 만 사용 (다른 DnD 라이브러리 금지)
- 숙박 항목: `isDraggable: false` 설정 필수

## 품질
- 모든 입력 필드에 `label` 또는 `aria-label` 필수
- 에러 메시지: `role="alert"`
- 로딩 상태: 저장 중 버튼 비활성화 + 스피너 필수
