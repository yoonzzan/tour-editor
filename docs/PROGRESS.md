# PROGRESS — 작업 단위별 진행 현황

> 마지막 업데이트: 2026-04-21  
> 전체 진행률: 100% (Phase 0~8 + E2E 브라우저 검증 완료)  
> 원칙: 태스크 하나 = 30분 이내 완료 가능한 단위

---

## 작업 상태 범례
- `[ ]` 미시작
- `[~]` 진행 중
- `[x]` 완료
- `[-]` 2차 이후 / 스킵

---

## Phase 0: 프로젝트 기반 세팅

### P0-A. Next.js 초기화
- [x] **T-001** `npx create-next-app@latest` 실행 (TS, Tailwind, App Router, src/)
- [x] **T-002** 불필요한 보일러플레이트 제거 (기본 페이지, 스타일)
- [x] **T-003** `package.json` scripts 추가 (`typecheck`, `quality`, `db:*`)
- [x] **T-004** `tsconfig.json` — strict 모드 + path alias `@/*` 확인
- [x] **T-005** ESLint + Prettier 설정 (`.eslintrc`, `.prettierrc`)
- [x] **T-006** `.env.example` → `.env.local` 생성 및 DB URL 입력

### P0-B. DB 및 인증 세팅
- [x] **T-007** `prisma/schema.prisma` 작성 (User·Bid·Quote·QuoteVersion·PackageTemplate)
- [x] **T-008** `npx prisma migrate dev --name init` 실행 — dev.db 생성 완료
- [x] **T-009** `npx prisma generate` + `npm run typecheck` 통과 확인
- [x] **T-010** `prisma/seed.ts` 작성 (테스트용 User 3명 — partner/agent/sales, pw: password123)
- [x] **T-011** NextAuth 설정 (`src/lib/auth.ts`) — role 세션 포함, JWT 전략
- [x] **T-012** 로그인 페이지 (`src/app/login/page.tsx`) — Credentials 로그인 폼

### P0-C. 공통 기반
- [x] **T-013** `src/lib/db.ts` — Prisma client 싱글톤
- [x] **T-014** `src/lib/config.ts` — 환경변수 타입 안전 접근
- [x] **T-015** `src/types/index.ts` — Role enum, 공통 타입
- [x] **T-016** shadcn/ui CSS variables 설정 (`globals.css`, `components.json`, `tailwind.config.ts`)
- [x] **T-017** `scripts/quality-gate.sh` 실행 확인 — typecheck 0 errors

---

## Phase 1: F-00 팝업 진입 & 초기화

- [x] **T-101** `src/app/(popup)/editor/popup/page.tsx` — 팝업 라우트 생성
- [x] **T-102** URL 파라미터 파싱 (`quoteNo`, `role`) + 유효성 검증 (세션 role 우선)
- [x] **T-103** `GET /api/editor/init` Route 구현 (quoteCode → 견적 데이터 반환)
- [x] **T-104** 팝업 레이아웃 (`(popup)/layout.tsx`) — SessionProvider + QueryClientProvider, min-w-[1280px]
- [x] **T-105** `usePopupInit` 훅 — 초기 데이터 로드 + 로딩/에러 상태
- [x] **T-106** 견적 없을 때 → 빈 에디터 안내 메시지 (Phase 2 SearchPopup 연동 예정)
- [x] **T-107** `postMessage` 구현 (`src/lib/postMessage.ts`) — SAVE_COMPLETE / EDITOR_CLOSED
- [x] **T-108** 미저장 닫기 확인 (`beforeunload` 이벤트 + window.confirm)

---

## Phase 2: F-01 검색 및 불러오기 팝업

- [x] **T-201** `SearchPopup` 컴포넌트 껍데기 + 탭 구조 (상품코드/파일첨부/직접입력)
- [x] **T-202** 상품코드 입력 UI (텍스트 입력 + 조회 버튼)
- [x] **T-203** `GET /api/mcp/products/[code]` Route — MCP 연동 (Mock 우선)
- [x] **T-204** `src/mocks/products.json` Mock 데이터 3건 작성
- [x] **T-205** 조회 결과 미리보기 패널 (일정 요약 표시)
- [x] **T-206** "이 일정으로 시작" → 에디터 자동 세팅 (전체 교체)
- [x] **T-207** 파일 첨부 탭 UI (드래그앤드롭 + 파일 선택, 10MB 제한)
- [x] **T-208** 직접 입력 탭 UI (텍스트 영역 + 파싱 시도 버튼)

---

## Phase 3: F-02 일정표 에디터

- [x] **T-301** `src/types/itinerary.ts` — ItineraryData, DaySchedule, ScheduleItem 타입
- [x] **T-302** `ItineraryEditor` 컴포넌트 껍데기 + 헤더 영역 (단체명, 작성일)
- [x] **T-303** 견적 개요 테이블 (수신, 여행도시, 기간, 인원 입력)
- [x] **T-304** 여행요금 행 (성인/아동/유아 인당, 총금액 자동 계산)
- [x] **T-305** 일정 기본 항목 (항공, 숙박, 포함/불포함, 선택관광, 쇼핑, 유의사항)
- [x] **T-306** 일자별 블록 UI — `DayBlock` 컴포넌트 (헤더 + 항목 목록)
- [x] **T-307** 항목 추가 버튼 → 유형 선택 드롭다운 (이동/관광/식사/숙박/기타)
- [x] **T-308** `ScheduleItem` 각 유형별 입력 폼 (TRANSFER, SIGHTSEEING, MEAL, ACCOMMODATION, OTHER)
- [x] **T-309** **다중 항목 허용** — 동일 구분 여러 개 추가 동작 확인 테스트
- [x] **T-310** ACCOMMODATION 자동 마지막 고정 로직
- [x] **T-311** `@dnd-kit/core` 드래그앤드롭 — 같은 일차 내 순서 변경
- [x] **T-312** 드래그앤드롭 — 다른 일차로 이동
- [x] **T-313** 푸터 자동 생성 (안내 문구, 작성일, (주) 하나투어)

---

## Phase 4: F-03 견적서 에디터

- [x] **T-401** `src/types/quote.ts` — QuoteData, QuoteItem 타입
- [x] **T-402** `QuoteEditor` 컴포넌트 껍데기 + 헤더
- [x] **T-403** 일정표 항목 연동 → 견적 행 자동 생성 (항목 순서: 항공→숙박→관광→식사→차량→가이드→기타)
- [x] **T-404** 단가/통화/환율 입력 → 원화 합계 즉시 자동 계산
- [x] **T-405** 항목별 합계, 구분별 건별합계 자동 계산
- [x] **T-406** 총 경비 섹션 (항목소계 + 지상비수익 + 하나투어수익 + VAT + TOTAL, 1인당 수익 표시)
- [x] **T-407** `src/mocks/cost-reference.json` Mock 원가 데이터
- [x] **T-408** 원가 참고 단가 표시 (회색, 클릭 시 자동 채움)
- [x] **T-409** 가격 표시 방식 드롭다운 (sales 전용 — 상세/총액/숨김)
- [x] **T-410** 미리보기 모달 (일정표 탭 + 견적서 탭)

---

## Phase 5: F-05 버전 관리

- [x] **T-501** `src/lib/version/generateVersionNo.ts` + 유닛 테스트 (v1.9→v1.10 경계값 포함)
- [x] **T-502** `src/lib/version/createVersion.ts` — INSERT 전용, UPDATE 금지 로직
- [x] **T-503** `src/lib/version/diffVersions.ts` — 두 버전 간 변경 내역 계산
- [x] **T-504** `POST /api/quotes/[id]/versions` Route + 낙관적 잠금 (VERSION_CONFLICT)
- [x] **T-505** `GET /api/quotes/[id]/versions` Route — 버전 목록
- [x] **T-506** `GET /api/quotes/[id]/versions/[version]` — 특정 버전 조회
- [x] **T-507** `GET /api/quotes/[id]/versions/diff` — Diff 계산 API
- [x] **T-508** 저장 버튼 + 변경 사유 모달
- [x] **T-509** `VersionHistory` 패널 UI (버전 목록, 메타데이터)
- [x] **T-510** 구버전 클릭 → 읽기 전용 미리보기 (모든 입력 disabled)
- [x] **T-511** Diff/버전 비교 UI (좌우 비교, 추가/삭제/변경 시각 표시)
- [x] **T-512** 자동 임시 저장 (30초, localStorage)

---

## Phase 6: F-04 항공 조회 팝업

- [x] **T-601** `src/mocks/flights.json` Mock 항공 데이터 5건
- [x] **T-602** `GET /api/flights` Route — Mock 반환
- [x] **T-603** `FlightPopup` 컴포넌트 (입력폼: 출발일, 공항, 도착일, 공항)
- [x] **T-604** 조회 결과 테이블 (항공사, 편명, 요금, 유류할증료, 세금, 총액)
- [x] **T-605** partner 역할에서 항공 조회 버튼 숨김 확인

---

## Phase 7: F-06 Excel 출력

- [x] **T-701** `src/lib/excel/filename.ts` + 유닛 테스트 (3개 통과)
- [x] **T-702** `src/lib/excel/generateItinerary.ts` — 여행일정표 ExcelJS 구현
- [x] **T-703** `src/lib/excel/generateCostSheet.ts` — 견적산출내역서 ExcelJS 구현
- [x] **T-704** **인감 가이드 영역** 구현 (dashDot 테두리 + (인) 텍스트, H열 병합)
- [x] **T-705** `GET /api/quotes/[id]/export` Route — 스트리밍 다운로드
- [x] **T-706** 한글 파일명 RFC 5987 인코딩 (`filename*=UTF-8''...`)
- [x] **T-707** 특정 버전 기준 출력 (`?version=v1.2` 파라미터)

---

## Phase 8: 권한 + 완성도

- [x] **T-801** 역할별 API 권한 체크 전체 엔드포인트 검토
- [x] **T-802** 역할별 UI 버튼/기능 표시 통합 테스트
- [x] **T-803** E2E: 팝업 진입 시나리오 (`popup-init.spec.ts`)
- [x] **T-804** E2E: 다중 관광 항목 추가 (`itinerary-multi.spec.ts`)
- [x] **T-805** E2E: 버전 생성 → 이력 확인 (`version-create.spec.ts`)
- [x] **T-806** E2E: 구버전 읽기 전용 (`version-readonly.spec.ts`)
- [x] **T-807** E2E: Excel 다운로드 + 파일명 (`excel-download.spec.ts`)
- [x] **T-808** E2E: 역할별 권한 (`role-permissions.spec.ts`)
- [x] **T-809** 에디터 로딩 성능 목표 설정 (LCP < 2초 — Lighthouse 기준, CI 미측정)

---

## 작업 로그

| 날짜 | 태스크 | 내용 |
|------|--------|------|
| 2026-04-16 | 세팅 | Claude Code 하네스 세팅 완료 |
| 2026-04-17 | Phase 0 | T-001~T-017 완료 — typecheck 0 errors, seed 3 users, migrate init 완료 |
| 2026-04-17 | Phase 1·2 | T-101~T-108, T-201~T-208 완료 — typecheck 0 errors, SearchPopup·useEditorStore·Mock API 구현 |
| 2026-04-17 | Phase 3 | T-301~T-313 완료 — typecheck 0 errors, ItineraryEditor·DayBlock·ScheduleItemForm·mutations 구현 |
| 2026-04-17 | Phase 4 | T-401~T-410 완료 — typecheck 0 errors, QuoteEditor·generate.ts·cost-reference.json·PreviewModal·EditorShell 탭 구현 |
| 2026-04-17 | Phase 5 | T-501~T-512 완료 — typecheck 0 errors, 버전 생성·Diff·VersionHistory·SaveModal·자동임시저장 구현 |
| 2026-04-17 | Phase 6 | T-601~T-605 완료 — typecheck 0 errors, FlightPopup·/api/flights·flights.json·EditorShell 연동 |
| 2026-04-18 | Phase 7 | T-701~T-707 완료 — typecheck 0 errors, filename.ts(테스트3), generateItinerary, generateCostSheet(인감가이드), export API(RFC5987+버전파라미터) |
| 2026-04-18 | Phase 8 | T-801~T-809 완료 — 역할 API/UI 코드리뷰, E2E spec 6개(popup-init·itinerary-multi·version-create·version-readonly·excel-download·role-permissions), LCP<2초 목표 설정 |
| 2026-04-19 | 브라우저 검증 | 미리보기 모달(일정표·견적서 탭) 브라우저 확인 완료. PreviewModal React import 버그 수정 |
| 2026-04-20 | 최종 안정화 | typecheck 0 errors, 유닛 테스트 15/15 통과. 저장·버전이력·Excel·역할별UI·항공조회 코드 리뷰 완료. 전체 구현 100% 완료 |
| 2026-04-20 | E2E 브라우저 검증 | 저장(v1.2→v1.3), Excel 다운로드(RFC5987 한글파일명), partner/sales 역할UI, 항공조회 팝업 5건+선택 반영 브라우저 실확인. SaveModal ✕ 버튼 type="button" 누락 버그 수정. SALES 읽기전용 — main에 pointer-events-none+opacity-75 적용. |
| 2026-04-21 | E2E 안정화 | T-804/T-805 스펙 안정화(카운트 기준 보정, 저장 모달 선택자·응답 동기화). `e2e/global-setup.ts`에서 테스트 데이터 `QuoteVersion` 초기화 처리 추가. Quality Gate(`npm run quality`) 통과, `17 passed` 확인. |
| 2026-04-24 | UI/견적 현행화 | 일정표·견적서 에디터 폭 통일, 숫자 입력 앞자리 0 정규화, 견적 자동 생성 수량 성인 인원 기준 적용, 지상비수익·하나투어수익·견적 유효기간·버전 비교 UI 문서 현행화. |

---

## 알려진 이슈
없음

## 결정 사항 (ADR)
| # | 결정 | 이유 |
|---|------|------|
| ADR-01 | 항공·원가 DB = Mock | 1차에서 실 API 미확정 |
| ADR-02 | 패키지 템플릿 검색 = 2차 | MCP 상품코드 입력이 더 직접적 |
| ADR-03 | 삭제 API = 없음 | 데이터 영구 보존 정책 |
| ADR-04 | Excel = 서버사이드 ExcelJS | 클라이언트 라이브러리 번들 크기 문제 |
| ADR-05 | 에디터 = 팝업 진입 전용 | 기존 견적서 상세 화면과 연계 |
