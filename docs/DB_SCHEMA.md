# DB 스키마 설계

## Prisma Schema (현재 구현 기준)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// 역할 enum
enum Role {
  PARTNER  // 협력사
  AGENT    // 견적 담당자
  SALES    // 영업 담당자
}

// 사용자
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  role      Role
  company   String?  // 협력사명 (PARTNER인 경우)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  bids              Bid[] @relation("BidPartner") // 협력사의 비딩
  assignedAgentBids Bid[] @relation("BidAgent")   // 견적 담당자 배정 비딩
  assignedSalesBids Bid[] @relation("BidSales")   // 영업 담당자 배정 비딩
  versions          QuoteVersion[]                // 수정한 버전 이력
}

// 비딩 (견적 요청 단위)
model Bid {
  id          String    @id @default(cuid())
  bidCode     String    @unique  // 비딩 코드
  title       String             // 상품명
  region      String             // 여행 지역
  duration    Int                // 여행 기간 (박수)
  travelStart DateTime
  travelEnd   DateTime
  status      BidStatus @default(OPEN)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  partner     User      @relation("BidPartner", fields: [partnerId], references: [id])
  partnerId   String
  agent       User?     @relation("BidAgent", fields: [agentId], references: [id])
  agentId     String?
  sales       User?     @relation("BidSales", fields: [salesId], references: [id])
  salesId     String?
  quotes      Quote[]

  @@index([bidCode])
  @@index([region])
  @@index([agentId])
  @@index([salesId])
}

enum BidStatus {
  OPEN       // 비딩 진행 중
  SELECTED   // 견적 선정됨
  CONFIRMED  // 최종 확정
  CLOSED     // 종료
}

// 견적 (비딩에 대한 견적서+일정표 세트)
model Quote {
  id            String   @id @default(cuid())
  quoteCode     String   @unique  // 예: QA0058262301
  latestVersion String   @default("v1.0")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  bid           Bid      @relation(fields: [bidId], references: [id])
  bidId         String
  versions      QuoteVersion[]

  @@index([quoteCode])
}

// 견적 버전 (절대 수정 금지 — 새 버전만 생성)
model QuoteVersion {
  id            String   @id @default(cuid())
  versionNo     String   // "v1.0", "v1.1" 형식
  changeReason  String?  // 변경 사유 (선택)
  savedAt       DateTime @default(now())

  // 스냅샷 데이터 (JSON)
  itineraryData String   // 일정표 전체 데이터 (SQLite: JSON 직렬화)
  quoteData     String   // 견적서 전체 데이터 (SQLite: JSON 직렬화)

  quote         Quote    @relation(fields: [quoteId], references: [id])
  quoteId       String
  savedBy       User     @relation(fields: [savedById], references: [id])
  savedById     String
  savedByRole   Role     // 저장 시점의 역할

  @@unique([quoteId, versionNo])
  @@index([quoteId])
}

// 패키지 상품 템플릿 (검색용)
model PackageTemplate {
  id          String   @id @default(cuid())
  productCode String   @unique
  title       String
  region      String
  duration    Int
  itinerary   String   // 일정표 템플릿 데이터 (SQLite: JSON 직렬화)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  @@index([region, duration])
}
```

## JSON 데이터 구조

### itineraryData
```typescript
interface ItineraryData {
  header: {
    groupName: string
    writtenAt: string  // yyyy-mm-dd
  }
  overview: {
    recipient: string
    cities: string
    travelPeriod: { start: string; end: string }
    passengers: {
      adult: number; child: number; infant: number; escort: number
    }
    singleCharge?: number
    fare: {
      adultPerPerson: number
      childPerPerson: number
      infantPerPerson: number
      total: number
      totalWithCard: number
    }
  }
  basics: {
    flight: { departure: string; arrival: string; localVehicle: string }
    accommodation: { hotel: string; grade: string; occupancy: string }
    included: string
    excluded: string
    optionalTour: string
    shoppingCenters: number
    notes: string
  }
  days: DaySchedule[]
}

interface DaySchedule {
  dayNo: number
  date: string
  items: ScheduleItem[]
}

interface ScheduleItem {
  id: string
  type: 'TRANSFER' | 'SIGHTSEEING' | 'MEAL' | 'ACCOMMODATION' | 'OTHER'
  region?: string
  transport?: string
  time?: string
  content: string
  meal?: { breakfast?: string; lunch?: string; dinner?: string }
  hotel?: string
}
```

### quoteData
```typescript
interface QuoteData {
  header: {
    writtenAt: string
    validUntil?: string
  }
  exchangeRates?: QuoteExchangeRate[]
  items: QuoteItem[]
  summary: {
    subtotal: number
    groundProfit: number
    agencyFee: number
    vat: number
    total: number
  }
}

interface QuoteExchangeRate {
  id: string
  code: string
  rateToKrw: number
}

interface QuoteItem {
  id: string
  category: 'FLIGHT' | 'HOTEL' | 'SIGHTSEEING' | 'MEAL' | 'VEHICLE' | 'GUIDE' | 'OTHER'
  region: string
  date: string
  description: string
  quantity: number
  unitPrice: number
  currencyRateId?: string
  subtotal: number  // quantity * unitPrice * rateToKrw
  refPrice?: number  // 원가 DB 참고 단가
}
```
