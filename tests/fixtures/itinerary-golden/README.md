# Itinerary Golden Fixtures

파싱 정확도 개선 기준으로 사용할 대표 샘플 5건을 이 폴더에 둔다.

## Required cases

| ID | Source type | Purpose |
| --- | --- | --- |
| `mcp-product` | MCP 상품코드 응답 | 상품 DB 매핑 정확도 검증 |
| `xlsx-tabular` | `.xlsx` | 표/병합 셀/식사 열/호텔 행 검증 |
| `pdf-text` | 텍스트 추출 PDF | PDF 텍스트 추출 후 파싱 검증 |
| `pdf-ocr` | 이미지형 PDF | OCR 텍스트와 파서 연결 검증 |
| `direct-text` | 복붙 텍스트 | 메신저/메일 자유 텍스트 검증 |

## File convention

각 케이스는 같은 basename을 사용한다.

- `{id}.input.txt` 또는 `{id}.input.json`
- `{id}.expected.json`

`expected.json`은 `ItineraryData` 형태여야 한다. 고객명, 담당자명, 전화번호, 이메일, 협력사명, 실제 견적번호는 저장하지 않는다.

## Pass criteria

- 일차 수와 날짜가 맞아야 한다.
- 주요 일정 항목, 식사, 숙박이 expected와 맞아야 한다.
- 견적번호, 요금표 헤더, 푸터, 엑셀 리본 텍스트 같은 노이즈가 일정 항목에 섞이면 실패다.
- `/api/itinerary/parse?debug=1` 기준 `qualityScore`가 70 미만이면 실패 후보로 본다.
