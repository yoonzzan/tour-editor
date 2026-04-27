# 엑셀 다운로드 및 내보내기 기능 마이그레이션 가이드

본 문서는 현재 여행 견적 빌더 프로젝트의 "엑셀 파일 다운로드(견적서/일정표)" 및 "구글 시트 내보내기" 기능을 다른 빈 프로젝트나 신규 프로젝트로 이식하기 위한 방법과 필요 파일 목록을 정의합니다.

## 1. 엑셀 관련 폴더 및 파일 전체 목록

현재 엑셀 기능은 크게 로컬 엑셀 생성 기능과 서버 API를 이용한 구글 시트 연동 기능으로 나뉩니다. 두 기능에 대해 다음 파일들을 복사해야 합니다.

### [필수] 로컬 엑셀 다운로드 핵심 폴더 및 파일
- **`lib/excel/` 폴더 전체**
  - `lib/excel/cost-sheet.ts` : 견적산출내역서 엑셀 파일을 생성하고 다운로드하는 로직 (UI 스타일링 포함)
  - `lib/excel/itinerary.ts` : 여행일정표 엑셀 파일을 9-Column Grid 시스템 기반으로 생성하고 다운로드하는 로직
  - `lib/excel/common.ts` : 이미지 생성(인감 도장 캔버스), 여백 크롭, 파일명 생성 등 공통 헬퍼 함수
- **`lib/excel-export.ts`** : 위 `excel` 폴더를 외부에서 손쉽게 쓰도록 묶어주는 인덱스 역할의 파일
- **`lib/export-utils.ts`** : 견적 항목(Item) 데이터를 날짜별(`groupItemsByDate`), 카테고리별(`groupItemsByCategory`)로 그룹화하고 규격화하는 핵심 비즈니스 로직

### [선택] 구글 시트 연동 파일
서버 API를 통해 구글 시트 탭을 생성하고 자동으로 데이터를 밀어넣는 기능이 필요하다면 아래 파일도 복사합니다.
- **`app/api/sheet/export/route.ts`** : Service Account를 이용한 구글 스프레드시트 API 연동 라우트

### [정적 자산]
엑셀 내부에 포함되는 회사 로고 이미지입니다. 이식할 프로젝트의 `public/images/` 에 동일하게 준비해야 합니다.
- **`public/images/hanatour_logo.png`** (또는 해당 프로젝트에 맞는 로고)

---

## 2. 패키지 설치 방법

엑셀 생성 기능(`ExcelJS`)과 브라우저 다운로드(`FileSaver`) 기능을 수행하기 위해 다음 패키지를 설치해야 합니다.

```bash
# 필수: 로컬 엑셀 파일 다운로드 기능
npm install exceljs file-saver
npm install -D @types/file-saver

# 선택: 구글 시트 내보내기 기능이 필요할 경우 추가 설치
npm install google-spreadsheet google-auth-library
```

---

## 3. 다른 프로젝트에 이식하는 순서 (Step-by-Step)

### 단계 1: 의존성 패키지 설치
위의 npm 명령어를 신규 프로젝트 터미널에서 실행하여 패키지를 설치합니다.

### 단계 2: 공통 타입(Type) 이식하기
엑셀 데이터는 현재 프로젝트의 `QuoteItem`과 `QuoteMeta` 인터페이스를 강하게 참조하고 있습니다.
- 현재 프로젝트의 `types/index.ts` 등을 확인하여 인자로 받는 데이터 타입(날짜, 카테고리, 수량, 단가 구조)을 신규 프로젝트에 맞게 이식하거나 새로 정의해야 합니다.

### 단계 3: 유틸리티 함수 복사
`lib/export-utils.ts` 파일을 신규 프로젝트의 `lib` 폴더 등 알맞은 위치에 복사합니다. 이 유틸리티는 타입 의존성이 강하므로 '단계 2'의 타입이 맞는지 제일 먼저 체크해야 합니다.

### 단계 4: 엑셀 코어 로직 복사
`lib/excel` 폴더 전체와 `lib/excel-export.ts`를 신규 프로젝트로 복사합니다.
- 이미지 로고를 처리하는 `lib/excel/common.ts` 파일 내부에서 `/images/hanatour_logo.png` 경로를 참조하고 있으므로, 신규 프로젝트에 맞게 회사 로고 경로나 파일명을 변경해 줍니다.

### 단계 5: 구글 시트 연동 설정 (해당될 경우)
구글 시트 연동이 필요하다면 `app/api/sheet/export/route.ts`를 복사하고 구글 클라우드 콘솔에서 발급한 환경 변수를 신규 프로젝트의 `.env` 파일에 셋팅합니다.
- `GOOGLE_EXPORT_SHEET_ID`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`

### 단계 6: 버튼에 연결하여 기능 구현 마무리
모든 준비가 끝났다면 프론트엔드 UI 컴포넌트에서 클릭 이벤트로 연결해 주면 됩니다.

```tsx
import { downloadCostSheetExcel, downloadItineraryExcel } from '@/lib/excel-export';

// 사용 예시
const handleDownloadExport = async () => {
    // 1. 일정표 다운로드
    await downloadItineraryExcel(items, partnerName, city, meta, quoteTitle);
    
    // 2. 견적서 다운로드
    await downloadCostSheetExcel(items, partnerName, city, meta, quoteTitle);
}
```

---
## 요약
새로운 프로젝트에 기능을 이식할 때 핵심은 **1) 설치 패키지(`exceljs`, `file-saver`) 추가, 2) 동일한 데이터 구조(타입) 맞추기, 3) 묶음 폴더(`lib/excel`) 및 유틸 파일 복사**의 3가지입니다. 경로 수정(이미지 및 타입 참조 경로)만 주의하시면 그대로 사용할 수 있습니다.
