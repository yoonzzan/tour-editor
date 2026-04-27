# Excel 출력 레이아웃 스펙

> 기준 샘플: `docs/sample/여행일정표_*.xlsx` / `docs/sample/견적산출내역서_*.xlsx`  
> 구현 대상: `src/lib/excel/generateItinerary.ts` (T-702), `src/lib/excel/generateCostSheet.ts` (T-703)  
> 로고 파일: `docs/하나투어-로고_국문CMYK_풀컬러-가로형.png`  
> (fallback: `public/images/hanatour-logo.png`)

---

## 공통 스타일 상수

```typescript
const STYLE = {
  font: {
    name: '맑은 고딕',        // 기본 폰트
    nameAlt: 'Malgun Gothic', // 영문 fallback
    sizeBody: 9,
    sizeTitle: 14,            // 문서 제목 (견적 산출 내역서, 쿨인싱아웃4박...)
    sizeHeader: 11,           // 표 헤더
  },
  color: {
    headerBg: 'FFE8E8F0',   // 열 헤더 배경 (연보라/회색)
    categoryBg: 'FFFAFAFA',  // 항목 구분 셀 배경
    totalRed: 'FFCC0000',    // TOTAL 금액 빨간색
    border: 'FF000000',      // 테두리 검정
    borderLight: 'FFB0B0B0', // 내부 얇은 테두리 회색
    logoTitle: 'FF4B0082',   // 하나투어 로고 보라색 (이미지 사용이므로 참고용)
    bold: 'FF1A1A1A',        // 숙박 bold 항목 등
  },
  border: {
    thin: { style: 'thin', color: { argb: 'FF000000' } },
    medium: { style: 'medium', color: { argb: 'FF000000' } },
    dashDot: { style: 'dashDot', color: { argb: 'FF888888' } }, // 인감 가이드
  },
}
```

---

## 1. 여행일정표 (generateItinerary.ts)

### 1-1. 전체 페이지 설정

```
용지: A4 세로 (portrait)
여백: 상 15mm / 하 15mm / 좌 15mm / 우 15mm
열 너비 (단위: 엑셀 문자 너비):
  A (일자):    12
  B (지역):     8
  C (교통편):   8
  D (시간):     7
  E (세부일정): 38
  F (식사):    14
```

### 1-2. 헤더 영역 (행 1~4)

```
행 1~2: 높이 각 20pt

[A1:B2] 병합 → 하나투어 로고 이미지 삽입
  worksheet.addImage(logoId, { tl: { col: 0, row: 0 }, br: { col: 2, row: 2 } })
  이미지 비율: 가로형 유지 (editAs: 'oneCell')

[C1:E2] 병합 → 상품명 + 비딩코드
  값: `${상품명} ${비딩코드}`  (예: "쿨인싱아웃4박 1209 QA0058262301")
  font: bold, size 14, 가운데 정렬
  
[F1:F2] 병합 → 견적 작성일
  값: `견적 작성일: ${yyyy}. ${M}. ${d}.`
  font: size 9, 우측 정렬, 세로 하단 정렬

행 3: 높이 8pt (빈 행 — 간격)
행 4: 높이 8pt (빈 행 — 간격)
```

### 1-3. 견적 개요 테이블 (행 5~9)

```
행 5~9: 높이 18pt
테두리: 전체 thin

행 5 — [A5] 수신 (헤더, 배경 headerBg)
  [A5]      "수 신"     font bold, 가운데 정렬, 배경 headerBg
  [B5:C5]   값 (수신처) 병합
  [D5]      "여행도시"  font bold, 가운데 정렬, 배경 headerBg
  [E5]      값 (여행도시)
  [F5]      "여행기간"  font bold, 가운데 정렬, 배경 headerBg  ← 이 열에 여행기간 레이블+값 함께
  ※ 실제 PDF: [F5] = "여행기간" + [다음 열은 없으므로] E열 뒤에 날짜 합쳐서 표시
  실제 병합 구조:
    A5        "수 신"    배경 headerBg
    B5:C5     수신처 값
    D5        "여행도시" 배경 headerBg
    E5        여행도시 값
    F5 에 "여행기간" + 우측으로 날짜 이어서
    → [F5]를 "여행기간" (headerBg), [G5]가 없으므로 F5 안에 " 여행기간   {기간}" 표현
    ※ 실제 구조: F열이 마지막이므로 F5에 "여행기간  2026-03-18 ~ 2026-03-22" 전체 입력

행 6 — 인원
  [A6]      "인 원"     배경 headerBg
  [B6:C6]   "성인 {n}, 아동 {n}, 유아 {n}" 병합
  [D6]      "인솔자: {n}명"
  [E6]      "1인실: {n}" (또는 -)

행 7 — 여행요금 헤더
  [A7]      "여행 요금" 배경 headerBg (A7:A9 세로 병합)
  [B7]      "성인 인당"  배경 headerBg, 가운데 정렬
  [C7]      "아동 인당"  배경 headerBg, 가운데 정렬
  [D7]      "유아 인당"  배경 headerBg, 가운데 정렬
  [E7]      "총 금액"   배경 headerBg, 가운데 정렬
  [F7]      "카드 결제 시 금액" 배경 headerBg, 가운데 정렬

행 8 — 여행요금 값
  [A7:A8]   병합 (위에서 이어짐)
  [B8]      성인 인당 금액  ("W {금액}")
  [C8]      아동 인당 금액  ("-" 또는 값)
  [D8]      유아 인당 금액
  [E8]      총 금액        ("W {금액}")
  [F8]      카드 결제 시 금액
```

### 1-4. 구분 테이블 (행 10~17 — 항목 수에 따라 가변)

```
행 10: 높이 16pt (헤더)
  [A10]       "구 분"    배경 headerBg, 가운데 정렬
  [B10:E10]   "내 용"    배경 headerBg, 가운데 정렬, 병합
  [F10]       "비 고"    배경 headerBg, 가운데 정렬

행 11 — 항공/차량
  [A11]       "항공/차량" 배경 categoryBg, font bold
  [B11:E11]   "[출발] {departure}\n[도착] {arrival}\n[현지차량] {vehicle}" 병합, 줄바꿈(wrapText)
  [F11]       비고 (예: "정보없음")

행 12 — 숙박
  [A12]       "숙박"     배경 categoryBg, font bold
  [B12:E12]   "[호텔] {hotels...}\n[등급] {grade}\n[이용인원] {n}" 병합, wrapText

행 13 — 포함사항
  [A13]       "포함사항"  배경 categoryBg, font bold
  [B13:E13]   포함 내용 텍스트 병합, wrapText

행 14 — 불포함사항
  [A14]       "불포함사항" 배경 categoryBg, font bold
  [B14:E14]   불포함 내용 텍스트 병합, wrapText

행 15 — 선택관광
  [A15]       "선택관광"  배경 categoryBg, font bold
  [B15:E15]   내용

행 16 — 쇼핑센터
  [A16]       "쇼핑센터"  배경 categoryBg, font bold
  [B16:E16]   "{n}회"

행 17 — 유의사항
  [A17]       "유의사항"  배경 categoryBg, font bold
  [B17:E17]   내용

구분 테이블 전체 테두리: thin, 행 높이 최소 20pt (wrapText로 자동 조정)
```

### 1-5. 일자별 일정 테이블 (행 18~ — 일수에 따라 가변)

```
헤더 행 (18):
  [A18] "일자"    배경 headerBg, 가운데 정렬, font bold
  [B18] "지역"    배경 headerBg, 가운데 정렬, font bold
  [C18] "교통편"  배경 headerBg, 가운데 정렬, font bold
  [D18] "시간"    배경 headerBg, 가운데 정렬, font bold
  [E18] "세부일정" 배경 headerBg, 가운데 정렬, font bold
  [F18] "식사"    배경 headerBg, 가운데 정렬, font bold

데이터 행 규칙:
- 각 DaySchedule 당 여러 행이 생성됨
- A열 (일자): 해당 일의 첫 행 ~ 마지막 행까지 세로 병합
  값: "제 {n} 일\n{YYYY-MM-DD}\n({요일})"
  font bold, 가운데 정렬, wrapText
  
- 일반 항목 행:
  B열: 지역명 (같은 지역 연속이면 반복 표시 — PDF 참고: 지역 바뀔 때만 표시)
  C열: 교통편 (버스, 기차, 전용버스 등, 없으면 빈칸)
  D열: 시간 (09:00 형식, 없으면 빈칸)
  E열: 세부일정 텍스트
  F열: 식사 (해당 일의 첫 항목 행에만, 세로 병합 — 또는 각 행마다 빈칸)
  
- 숙박 항목 행: ⭐ 특별 처리
  E열: "[숙박] {호텔명}" — font bold, 대괄호 포함 전체 bold
  배경: 약간 진한 색 (예: 'FFEDEDED') 또는 border 강조
  
- 식사 표시 (F열):
  각 일의 마지막 항목 행에 세로 병합으로:
  "조식 {X or 내용}\n중식 {X or 내용}\n석식 {X or 내용}"
  wrapText: true
  ※ "X"는 없음을 의미, 뷔페/현지식/한식 등은 텍스트로 표기

행 높이: 기본 16pt, 세부일정이 긴 경우 자동 조정
테두리: 모든 셀 thin, 일자 구분선은 medium (다음 일로 넘어갈 때)
```

### 1-6. 푸터 영역 (마지막 일정 행 다음)

```
빈 행 1개

안내문구 행:
  [A:F] 병합
  값: "상기 일정은 항공 및 현지 사정에 의해 다소 변경될 수 있습니다."
  가운데 정렬, font size 9, 테두리 없음

빈 행 1개

서명 행:
  [A:F] 병합
  값: "{yyyy}년 {M}월 {d}일\n(주) 하나투어"
  가운데 정렬, font bold size 11, wrapText
```

---

## 2. 견적산출내역서 (generateCostSheet.ts)

### 2-1. 전체 페이지 설정

```
용지: A4 세로 (portrait)
여백: 상 15mm / 하 15mm / 좌 15mm / 우 15mm
열 너비 (단위: 엑셀 문자 너비):
  A (항목):    12
  B (지역):    12
  C (날짜):    12
  D (상세내역): 35
  E (인원/개수): 10
  F (단가):    15
  G (합계):    15
  H (건별합계): 15
```

### 2-2. 헤더 영역 (행 1~3)

```
행 1~2: 높이 각 22pt

[A1:B2] 병합 → 하나투어 로고 이미지 삽입
  worksheet.addImage(logoId, { tl: { col: 0, row: 0 }, br: { col: 2, row: 2 } })
  이미지 비율: 가로형 유지

[C1:F2] 병합 → "견적 산출 내역서"
  font: bold, size 16, 가운데 정렬

[G1:H2] 병합 → 견적 작성일
  값: `견적 작성일: ${yyyy}. ${M}. ${d}.`
  font: size 9, 우측 정렬

행 3: 높이 10pt (빈 행)
```

### 2-3. 테이블 헤더 (행 4)

```
행 4: 높이 18pt, 배경 headerBg, font bold, 가운데 정렬, 테두리 medium

[A4] "항 목"
[B4] "지역"
[C4] "날 짜"
[D4] "상세내역"
[E4] "인원 / 개수"
[F4] "단가"
[G4] "합계"
[H4] "건별합계"
```

### 2-4. 데이터 행 (행 5~ — 항목 수에 따라 가변)

```
항목 그룹 순서: 항공 → 숙박 → 관광 → 식사 → 차량 → 가이드 → 기타
(일정표/견적서 항목 순서: FLIGHT → HOTEL → SIGHTSEEING → MEAL → VEHICLE → GUIDE → OTHER)

각 항목 그룹 규칙:

A열 (항목):
  그룹의 첫 행 ~ 마지막 행 세로 병합
  값: 항목 한글명 ("항공" / "숙박" / "관광" / "식사" / "차량" / "가이드" / "기타")
  font bold, 가운데 정렬 (세로/가로), 배경 categoryBg

B열 (지역):
  같은 지역 연속 행: 지역명 반복 안 함 (첫 등장 시에만 표시)
  ※ PDF 확인: 지역이 바뀔 때만 새로 표시

C열 (날짜):
  "YYYY-MM-DD" 형식

D열 (상세내역):
  메인 항목명 (bold)
  줄바꿈 후 상세 (예: "중식 현지식\n순두부찌게") — wrapText: true

E열 (인원/개수):
  숫자, 우측 정렬

F열 (단가):
  통화코드 + 숫자 (단가), 우측 정렬, 천단위 콤마
  0원인 경우 "0" 표시

G열 (합계):
  숫자 (합계 = 단가 × 인원 × 환율), 우측 정렬, 천단위 콤마
  0원인 경우 "0" 표시

H열 (건별합계): ⭐ 핵심 규칙
  각 항목 그룹의 마지막 행에만 값 표시
  그룹 내 모든 행 세로 병합 (A열과 동일 범위)
  값: 그룹 합계 금액, 우측 정렬, font bold, 천단위 콤마
  0원인 그룹: "0" 표시
```

### 2-5. 예상 총 경비 섹션

```
항목소계 행:
  [B:F] 병합 → "항목소계" 가운데 정렬
  [G:H] 병합 → 합계 금액, 우측 정렬, 천단위 콤마, font bold
  배경: categoryBg, 테두리 thin

"예상 총 경비" 라벨 행:
  [A:A] "예상 총 경비" — 항목소계/여행사수수료/VAT/TOTAL 4행 세로 병합, font bold, 가운데 정렬, 배경 categoryBg

여행사수수료 행:
  [B:F] 병합 → "여행사수수료" 가운데 정렬
  [G:H] 병합 → 지상비수익 + 하나투어수익 합산 금액, 우측 정렬, 천단위 콤마
  ※ 지상비수익은 출력 문서에서 별도 행으로 노출하지 않는다.

VAT 행:
  [B:F] 병합 → "VAT" 우측 정렬
  [G:H] 병합 → VAT 금액, 우측 정렬, 천단위 콤마

TOTAL 행:
  [B:F] 병합 → "TOTAL" 우측 정렬, font bold, size 11
  [G:H] 병합 → TOTAL 금액, 우측 정렬, font bold, color totalRed ('FFCC0000'), size 11
  배경: 'FFEFEFEF'

유효기간 안내 행:
  TOTAL 행 바로 아래 [B:H] 병합
  값: "이 견적은 yyyy년 m월 d일 까지만 유효합니다"
  우측 정렬, font bold, size 9
```

### 2-6. 푸터 (회사 정보 + 인감 가이드) ⭐

```
빈 행 2개

회사 정보 행:
  [A:E] 병합 (좌측)
  값 (여러 줄, wrapText):
    "(주)하나투어"     — font bold
    "서울시 종로구 인사동 5길 41"
    "TEL: 1577-1233 | FAX: 02-1234-5678"
  세로 정렬: 상단

인감 가이드 영역 [F:H] 병합: ⭐ T-704 구현 핵심
  크기: 약 4행 × 3열 (대략 70×70pt 정사각형)
  테두리: dashDot 스타일 (점선)
  내부 텍스트: "(인)" — 가운데 정렬, font size 20, color gray
  
  ExcelJS 구현:
  worksheet.addConditionalFormatting 대신 직접 border 적용:
    border: {
      top: { style: 'dashDot' },
      left: { style: 'dashDot' },
      right: { style: 'dashDot' },
      bottom: { style: 'dashDot' },
    }
  cell.value = '(인)'
  cell.alignment = { horizontal: 'center', vertical: 'middle' }
  cell.font = { size: 20, color: { argb: 'FF888888' } }
```

---

## 3. ExcelJS 로고 삽입 코드 패턴

```typescript
import * as path from "path";
import { existsSync } from "node:fs";
import ExcelJS from "exceljs";

const LOGO_PATHS = [
  path.join(process.cwd(), "docs", "하나투어-로고_국문CMYK_풀컬러-가로형.png"),
  path.join(process.cwd(), "public", "images", "hanatour-logo.png"),
];

function resolveLogoPath(): string {
  for (const logoPath of LOGO_PATHS) {
    if (existsSync(logoPath)) return logoPath;
  }
  throw new Error("하나투어 로고 파일을 찾을 수 없습니다.");
}

function addLogoToWorksheet(workbook: ExcelJS.Workbook, worksheet: ExcelJS.Worksheet) {
  const logoId = workbook.addImage({
    filename: resolveLogoPath(),
    extension: 'png',
  });
  worksheet.addImage(logoId, {
    tl: { col: 0, row: 0 },  // 좌상단 A1
    ext: { width: 280, height: 80 },
    editAs: 'oneCell',
  });
}
```

---

## 4. 파일명 규칙 (filename.ts)

샘플 파일명 기준:
```
여행일정표_{상품명}_{비딩코드}_{quoteNo}_{YYYY-MM-DD}.xlsx
견적산출내역서_{상품명}_{비딩코드}_{quoteNo}_{YYYY-MM-DD}.xlsx
```

예시:
```
여행일정표_쿨인싱아웃4박_1209_QA0058262301_2026-03-18.xlsx
견적산출내역서_쿨인싱아웃4박_1209_QA0058262301_2026-03-18.xlsx
```

HTTP 헤더 (RFC 5987 한글 파일명):
```typescript
const encoded = encodeURIComponent(filename)
res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encoded}`)
res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
```

---

## 5. 색상·항목 매핑 요약

| 구분 | 일정표 항목 타입 | 견적서 항목명 |
|------|----------------|-------------|
| 숙박 | ACCOMMODATION | 숙박 |
| 식사 | MEAL | 식사 |
| 관광 | SIGHTSEEING | 관광 |
| 이동 | TRANSFER | 차량 |
| 항공 | FLIGHT | 항공 |
| 가이드 | GUIDE | 가이드 |
| 기타 | OTHER | 기타 |
| 진입/출발 | (첫날/마지막) | 기타 |
