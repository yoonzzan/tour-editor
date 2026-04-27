---
paths:
  - "src/**/*.test.ts"
  - "src/**/*.test.tsx"
  - "e2e/**"
---
# 테스트 규칙

## 유닛 테스트 필수 커버 대상
1. `src/lib/version/createVersion.ts` — 버전 채번 로직 전체
2. `src/lib/version/` — 버전 충돌 감지 (낙관적 잠금)
3. `src/lib/auth/` — 역할별 권한 헬퍼
4. `src/lib/excel/` — 파일명 생성 함수
5. 모든 API Route의 권한 체크

## E2E 필수 시나리오 (Playwright)
```
e2e/
├── popup-init.spec.ts       # 팝업 진입, quoteNo 로드
├── itinerary-multi.spec.ts  # 동일 일차 다중 관광 항목 추가
├── version-create.spec.ts   # 저장 → 버전 생성 → 이력 확인
├── version-readonly.spec.ts # 구버전 읽기 전용 확인
├── excel-download.spec.ts   # Excel 다운로드 + 파일명 형식
└── role-permissions.spec.ts # 역할별 버튼 표시/숨김
```

## 테스트 데이터
- Fixture: `tests/fixtures/` (quoteNo, 버전 데이터 등)
- DB: `TEST_DATABASE_URL` 별도 스키마
- 각 테스트 독립 — 이전 테스트 상태 의존 금지

## 완료 기준
- 새 기능 구현 시 유닛 테스트 함께 제출
- 버그 수정 시 재발 방지 테스트 함께 제출
- `npm run test` 전체 통과 후에만 완료 선언
