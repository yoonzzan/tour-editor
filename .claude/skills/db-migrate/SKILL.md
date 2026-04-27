# Skill: db-migrate
# 트리거: "스키마", "마이그레이션", "DB 변경", "테이블", "prisma"

## DB 변경 워크플로우

### Step 1: 현재 스키마 확인
```bash
cat prisma/schema.prisma
npx prisma db pull  # 현재 DB 상태 동기화 (있다면)
```

### Step 2: 스키마 수정 → 검토 요청
```
- 변경 내용을 먼저 설명
- QuoteVersion 테이블: 컬럼 추가는 가능, 기존 컬럼 타입 변경은 신중
- 삭제 컬럼: 절대 제안하지 않음 (데이터 보존 정책)
```

### Step 3: 마이그레이션 생성
```bash
npx prisma migrate dev --name [변경_내용_설명]
# 예: npx prisma migrate dev --name add_quote_version_change_reason
```

### Step 4: 타입 재생성
```bash
npx prisma generate
npm run typecheck  # Prisma 타입 변경 후 반드시
```

### Step 5: 시드 업데이트
```bash
# prisma/seed.ts 업데이트 (새 필드 포함)
npm run db:seed
```

## ⚠️ 주의
- `QuoteVersion` 레코드 삭제 마이그레이션 절대 금지
- 프로덕션 DB 직접 접근 금지
- 마이그레이션 파일 수동 편집 금지
