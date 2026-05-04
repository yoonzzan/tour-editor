# Skill: mcp-integrate
# 트리거: "MCP", "상품 조회", "상품코드", "하나투어 상품"

## MCP 연동 작업 순서

### Step 1: MCP 서버 확인
```bash
# .Codex/settings.json 또는 claude_desktop_config.json 에서
# 하나투어 상품 데이터 MCP 서버 연결 확인
```

### Step 2: API Route 구현
```typescript
// src/app/api/mcp/products/[code]/route.ts
// GET /api/mcp/products/S22C-7i

import { getMCPClient } from '@/lib/mcp/client'

export async function GET(req, { params }) {
  const client = getMCPClient('hanatour-products')
  const result = await client.callTool('search_product_by_code', {
    productCode: params.code
  })
  return NextResponse.json({ data: result })
}
```

### Step 3: 응답 타입 매핑
```typescript
interface MCPProductResponse {
  productName: string
  region: string
  duration: number          // 박수
  itinerary: DaySchedule[]  // src/types/itinerary.ts 형식으로 변환
}
```

### Step 4: 에러 처리
```typescript
// MCP 응답 없음 → { error: 'PRODUCT_NOT_FOUND' }
// MCP 서버 다운 → { error: 'MCP_UNAVAILABLE' }
// 클라이언트: "상품코드를 찾을 수 없습니다" 안내 후 직접 입력 유도
```

### Step 5: 로딩 UX
```
- 조회 중: 버튼 스피너 + "조회 중..."
- 결과: 미리보기 패널 표시
- 실패: 인라인 에러 메시지 + 다른 방법 제안
```

### Mock 대체 (MCP 미연결 시)
```typescript
// src/mocks/products.json 에서 반환
// 개발 환경에서만 — USE_MOCK_MCP=true 환경변수로 제어
```
