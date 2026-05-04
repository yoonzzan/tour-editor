# Skill: excel-export
# 트리거: "엑셀", "xlsx", "다운로드", "출력", "인감"

## Excel 출력 작업 순서

### Step 1: 어떤 문서인지 확인
- `itinerary` → 여행일정표 → `generateItinerary.ts`
- `cost` → 견적산출내역서 → `generateCostSheet.ts`

### Step 2: 데이터 검증
```typescript
// null 값 처리 규칙 확인
// 빈 금액 → '' (빈 문자열, 0 아님)
// 없는 호텔명 → '미정'
// 날짜 없는 항목 → 해당 행 생략
```

### Step 3: 파일명 생성
```typescript
import { generateExcelFilename } from '@/lib/excel/filename'
// 반드시 이 함수 사용, 직접 문자열 조합 금지
// 결과: 여행일정표_4박_QA0058262301_20260416.xlsx
```

### Step 4: 인감 가이드 (견적산출내역서만)
```
- 위치: 푸터 우측 (H열, 회사 주소 마지막 행 + 1)
- 스타일: dashDot 테두리, (인) 텍스트, 회색
- 크기: 4행 병합 (약 60pt 높이)
- .Codex/rules/excel.md 의 코드 참고
```

### Step 5: 다운로드 API
```
GET /api/quotes/[id]/export?type=itinerary&version=v1.2
→ Content-Type: xlsx
→ Content-Disposition: attachment; filename*=UTF-8''[인코딩된파일명]
```

### Step 6: 테스트
```bash
# 파일명 유닛 테스트
npm test -- filename

# 실제 파일 생성 통합 테스트
npm test -- excel

# 브라우저에서 다운로드 확인 (Chrome + Safari)
```
