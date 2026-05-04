# Skill: implement-feature
# 트리거: "구현", "만들어줘", "추가해줘", "개발해줘"

## Plan-and-Execute 패턴 (반드시 이 순서)

### Step 1: 컨텍스트 읽기 (실행 전 필수)
```
1. AGENTS.md 읽기
2. AGENTS.md 읽기
3. docs/PROGRESS.md 에서 현재 태스크 확인
4. 관련 .Codex/rules/ 파일 읽기
5. 관련 .Codex/agents/ 파일 읽기 (해당되는 경우)
```

### Step 2: 계획 수립 (구현 전 반드시 사람에게 보여주기)
```
계획 항목:
1. 변경할 파일 목록
2. 새로 만들 파일 목록
3. DB 스키마 변경 여부
4. API 추가/변경 여부
5. 테스트 케이스 목록 (3개 이상)
6. 완료 기준 (acceptance criteria)

→ 계획 승인 후 구현 시작
```

### Step 3: 타입 먼저
```typescript
// src/types/[도메인].ts 먼저 작성
// 구현 전 인터페이스 확정
// npm run typecheck 통과 확인
```

### Step 4: 구현 순서
```
DB 스키마(있다면) → API Route → 서버 로직 → 훅 → UI 컴포넌트
각 단계마다 typecheck 실행
```

### Step 5: 테스트
```
유닛 테스트 작성 → 통과 확인
E2E 시나리오 추가 (해당되는 경우)
```

### Step 6: 완료 처리
```
npm run quality  # typecheck + lint + test 전체
docs/PROGRESS.md 태스크 체크 업데이트
```

## ⚠️ 절대 금지
- 계획 단계 건너뛰기
- 타입 에러 있는 상태로 다음 단계 진행
- 테스트 없이 완료 선언
