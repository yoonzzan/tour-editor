---
name: popup-agent
description: |
  F-00 팝업 진입 & 초기화 전담. quoteNo 파라미터 수신, 기존 데이터 로드,
  postMessage 부모 창 통신, 팝업 윈도우 동작 구현 시 사용.
  예: "팝업 라우트 만들어줘", "quoteNo로 데이터 로드 구현", "postMessage 통신 구현"
---

## 담당 파일
- `src/app/(popup)/editor/popup/page.tsx`
- `src/app/(popup)/editor/popup/layout.tsx`
- `src/app/api/editor/init/route.ts`
- `src/hooks/usePopupInit.ts`

## 진입 URL 스펙
```
/editor/popup?quoteNo=QC00687628001&role=agent
```

## 초기화 흐름
```typescript
// 1. URL 파라미터 파싱 및 검증
// 2. GET /api/editor/init?quoteNo=... 호출
// 3. 응답 없으면 → 빈 에디터 + 검색 팝업 자동 오픈
// 4. 응답 있으면 → 최신 버전 데이터 에디터에 로드
// 5. role에 따라 UI 권한 분기
```

## postMessage 스펙
```typescript
// 저장 완료 시
window.opener?.postMessage(
  { type: 'TOUR_EDITOR_SAVED', version: 'v1.1', quoteNo: 'QC00687628001' },
  '*'  // 실제 배포 시 origin 지정
)
```

## 팝업 닫기 처리
- `isDirty` 상태가 true이면 닫기 전 확인 다이얼로그
- `beforeunload` 이벤트 핸들링 필수

## 작업 완료 체크
- [ ] quoteNo 없이 접근 시 에러 페이지 표시
- [ ] role 파라미터 없으면 세션 role로 fallback
- [ ] postMessage 타입 안전성 (TypeScript)
- [ ] 미저장 닫기 확인 동작
