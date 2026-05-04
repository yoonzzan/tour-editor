# 프로젝트 아키텍처 및 핵심 로직 가이드

이 문서는 GitNexus 분석을 통해 파악된 `tour-editor` 프로젝트의 기술적 구조와 비즈니스 로직을 정리한 문서입니다.

## 1. 전체 아키텍처 개요

본 프로젝트는 Next.js 15 App Router를 기반으로 하며, 견적서(Quote)와 일정표(Itinerary)의 버전을 관리하고 엑셀로 수출하는 기능을 핵심으로 합니다. 모든 핵심 비즈니스 로직은 `src/lib` 폴더에 도메인별로 응집되어 있습니다.

## 2. 주요 기능 클러스터 (Functional Clusters)

GitNexus가 식별한 주요 기능 단위입니다.

| 클러스터 | 주요 경로 | 설명 |
| :--- | :--- | :--- |
| **Version** | `src/lib/version/` | 견적/일정의 불변 버전 관리 및 번호 생성 로직 |
| **Itinerary** | `src/lib/itinerary/` | 일정 데이터 처리, AI 기반 텍스트 파싱 로직 |
| **Quote** | `src/lib/quote/` | 견적 데이터 계산 및 상태 관리 |
| **Excel** | `src/lib/excel/` | 처리된 데이터를 바탕으로 양식화된 엑셀 파일 생성 |
| **Auth** | `src/lib/auth/` | 서버 사이드 권한 검증 및 세션 관리 |

## 3. 핵심 비즈니스 로직 (Execution Flows)

### 3.1 버전 생성 및 저장 (Version Immutability)
- **원칙:** 기존 버전은 수정하지 않으며, 변경 시 반드시 새로운 버전을 생성(INSERT)합니다.
- **로직 흐름:** 
  1. 클라이언트 요청 (`/api/quotes/[id]/versions`)
  2. 최신 버전 번호 계산 (`generateVersionNo.ts`)
  3. 편집 기준 버전과 최신 버전 비교하여 충돌 감지 (`VersionConflictError`)
  4. 새로운 버전 레코드 저장 (`createVersion.ts`)

### 3.2 일정표 및 엑셀 수출 (Itinerary & Excel)
- **로직 흐름:**
  1. DB 데이터를 일정표 객체로 매핑 (`mapSaleProductToItinerary.ts`)
  2. 한국 시간 기준 날짜 변환 (`GetKoreaDateParts`)
  3. ExcelJS를 사용하여 워크북 생성 및 스타일 적용 (`generateItinerary.ts`)

## 4. 반드시 지켜야 할 도메인 규칙

> [!IMPORTANT]
> 아래 규칙은 아키텍처의 무결성을 유지하기 위해 반드시 준수해야 합니다.

1. **버전 생성 단일 창구:** 모든 버전 생성은 반드시 `src/lib/version/createVersion.ts`를 거쳐야 합니다. 직접적인 DB INSERT를 지양하세요.
2. **날짜 처리 표준:** 모든 날짜 계산 및 표시값 생성은 `src/lib/date/korea.ts` 유틸리티를 사용하여 `Asia/Seoul` 기준으로 처리합니다.
3. **업무 무결성:** 일정표와 견적서는 항상 같은 버전 번호를 공유해야 하며, 분리되어 저장될 수 없습니다.

## 5. 참고 도구
- **GitNexus:** 코드 호출 관계 및 영향도 분석을 위해 사용합니다. (`npx gitnexus status`)
- **PlantUML:** `docs/diagrams/` 내의 다이어그램을 통해 시각적 구조를 확인할 수 있습니다.
