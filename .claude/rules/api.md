---
paths:
  - "src/app/api/**"
---
# API Route 규칙

## 인증 — 모든 엔드포인트 필수
```typescript
const session = await getServerSession(authOptions)
if (!session) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
```

## 역할 체크 — 서버사이드에서만
```typescript
// ✅ 올바름
const role = session.user.role  // DB에서 온 역할

// ❌ 금지
const role = req.headers['x-role']  // 클라이언트 전달 값 신뢰 금지
```

## 입력 검증 — zod 필수
```typescript
const schema = z.object({ quoteNo: z.string().min(1) }).strict()
const result = schema.safeParse(body)
if (!result.success) return NextResponse.json({ error: 'Bad Request', details: result.error }, { status: 400 })
```

## 에러 응답 형식 (통일)
```typescript
// 성공
{ data: T }

// 실패
{ error: string, code: string, details?: unknown }
// code 예시: UNAUTHORIZED, FORBIDDEN, NOT_FOUND, VERSION_CONFLICT, VALIDATION_ERROR
```

## 버전 충돌 처리
- 저장 요청에 `expectedVersion` 필드 포함
- DB의 latestVersion과 다르면 `{ code: 'VERSION_CONFLICT', currentVersion: 'v1.2' }` 반환

## 금지
- raw SQL string concatenation
- 응답에 DB 내부 에러 메시지 노출
- console.log에 민감 데이터
- `any` 타입 응답
