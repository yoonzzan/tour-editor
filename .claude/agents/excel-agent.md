---
name: excel-agent
description: |
  F-06 Excel 출력 전담. 여행일정표·견적산출내역서 .xlsx 생성,
  인감 가이드 영역, 파일명 규칙 구현 시 사용.
  예: "Excel 출력 만들어줘", "인감 가이드 추가", "견적산출내역서 양식"
---

## 담당 파일
- `src/lib/excel/generateItinerary.ts`
- `src/lib/excel/generateCostSheet.ts`
- `src/lib/excel/filename.ts`
- `src/app/api/quotes/[id]/export/route.ts`

## 파일명 생성 (filename.ts)
```typescript
export function generateExcelFilename(
  type: 'itinerary' | 'cost',
  duration: number,
  quoteCode: string
): string {
  const prefix = type === 'itinerary' ? '여행일정표' : '견적산출내역서'
  const date = format(new Date(), 'yyyyMMdd')
  return `${prefix}_${duration}박_${quoteCode}_${date}.xlsx`
}
// 예: 여행일정표_4박_QA0058262301_20260416.xlsx
```

## 인감 가이드 영역 (generateCostSheet.ts 필수 구현)
```typescript
// 푸터 우측에 점선 원형 영역
const sealCell = worksheet.getCell('H' + sealRow)
sealCell.value = '(인)'
sealCell.alignment = { horizontal: 'center', vertical: 'middle' }
sealCell.border = {
  top: { style: 'dashDot', color: { argb: 'FF999999' } },
  bottom: { style: 'dashDot', color: { argb: 'FF999999' } },
  left: { style: 'dashDot', color: { argb: 'FF999999' } },
  right: { style: 'dashDot', color: { argb: 'FF999999' } }
}
worksheet.mergeCells(`H${sealRow}:H${sealRow + 3}`)
```

## 다운로드 응답 헤더
```typescript
// 한글 파일명 RFC 5987 인코딩
const encoded = encodeURIComponent(filename)
res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encoded}`)
```

## 빈값 처리
- null/undefined 금액 → 빈 문자열 (0 아님)
- 빈 호텔명 → '미정' 표시
- 날짜 없는 항목 → 해당 행 생략

## 작업 완료 체크
- [ ] 파일명 형식 유닛 테스트
- [ ] 인감 영역 위치 확인 (Excel 열어서 시각 확인)
- [ ] 한글 파일명 다운로드 (Chrome, Safari 각각 확인)
- [ ] 금액 null 항목 처리 확인
