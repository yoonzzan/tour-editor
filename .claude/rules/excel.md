---
paths:
  - "src/lib/excel/**"
  - "src/app/api/*/export*"
---
# Excel 출력 규칙

## 파일명 형식 (절대 준수)
```
여행일정표_{N}박_{상품코드}_{YYYYMMDD}.xlsx
견적산출내역서_{N}박_{상품코드}_{YYYYMMDD}.xlsx

예: 여행일정표_4박_QA0058262301_20260416.xlsx
```

## 인감 가이드 영역 (견적산출내역서 필수)
- 위치: 푸터 우측 (회사 주소 옆)
- 스타일: 점선 테두리, 60×60pt 정사각형
- 내용: `(인)` 텍스트 중앙 배치, 회색
- 배경 없음 (투명 — 실제 인감 날인 후 보이도록)

```typescript
// ExcelJS 구현 참고
ws.getCell('H50').value = '(인)'
ws.getCell('H50').alignment = { horizontal: 'center', vertical: 'middle' }
ws.getCell('H50').border = {
  top: { style: 'dashDot' }, bottom: { style: 'dashDot' },
  left: { style: 'dashDot' }, right: { style: 'dashDot' }
}
```

## 숫자 서식
- 금액: `#,##0` (천단위 콤마, 소수점 없음)
- 정렬: 숫자 오른쪽, 텍스트 왼쪽
- null/undefined → 빈 문자열 (0 표시 금지, 견적 미기재 항목)

## 색상 (하나투어 브랜드)
- 헤더 배경: `#5B2D8E` (보라), 텍스트: 흰색 Bold
- 섹션 헤더: `#EDE7F6` (연보라)
- 숙박 행: 텍스트 보라 Bold
- 교대 행: 흰색 / `#F9F9F9`

## 다운로드 API 응답
```typescript
res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`)
```
한글 파일명은 반드시 RFC 5987 인코딩 사용
