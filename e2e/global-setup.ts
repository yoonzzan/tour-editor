// e2e/global-setup.ts
// E2E 테스트용 공통 데이터 초기화
// - Bid "BID-E2E-001" (duration: 4)
// - Quote "QCE2ETEST001" (v1.0 only)
// - Quote "QCE2ETEST002" (v1.0 + v1.1) ← 버전 읽기 전용 테스트용

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// 4박5일 기본 일정 데이터
const sampleItinerary = JSON.stringify({
  header: { groupName: "E2E 테스트 그룹", writtenAt: "2026-04-18" },
  overview: {
    recipient: "하나투어",
    cities: "싱가포르",
    travelPeriod: { start: "2026-05-01", end: "2026-05-05" },
    passengers: { adult: 10, child: 2, infant: 0, escort: 1 },
    fare: {
      adultPerPerson: 1200000,
      childPerPerson: 900000,
      infantPerPerson: 100000,
      total: 15000000,
      totalWithCard: 15450000,
    },
  },
  basics: {
    flight: {
      departure: "KE-123 인천→싱가포르",
      arrival: "KE-124 싱가포르→인천",
      localVehicle: "45인승 버스",
    },
    accommodation: {
      hotel: "마리나베이샌즈",
      grade: "5성급",
      occupancy: "더블룸",
    },
    included: "항공, 숙박, 조식",
    excluded: "개인경비, 여행자보험",
    optionalTour: "유니버설스튜디오",
    shoppingCenters: 2,
    notes: "여권 유효기간 6개월 이상 필요",
  },
  days: [
    {
      dayNo: 1,
      date: "2026-05-01",
      items: [
        { id: "item-d1-1", type: "TRANSFER", content: "인천공항 출발", note: "" },
        { id: "item-d1-2", type: "SIGHTSEEING", content: "가든스 바이 더 베이", note: "" },
        { id: "item-d1-3", type: "ACCOMMODATION", content: "마리나베이샌즈 체크인", note: "" },
      ],
    },
    {
      dayNo: 2,
      date: "2026-05-02",
      items: [
        { id: "item-d2-1", type: "MEAL", content: "조식 (호텔)", note: "" },
        { id: "item-d2-2", type: "SIGHTSEEING", content: "센토사섬 관광", note: "" },
        { id: "item-d2-3", type: "ACCOMMODATION", content: "마리나베이샌즈 연박", note: "" },
      ],
    },
    {
      dayNo: 3,
      date: "2026-05-03",
      items: [
        { id: "item-d3-1", type: "MEAL", content: "조식 (호텔)", note: "" },
        { id: "item-d3-2", type: "SIGHTSEEING", content: "리버 크루즈", note: "" },
        { id: "item-d3-3", type: "ACCOMMODATION", content: "마리나베이샌즈 연박", note: "" },
      ],
    },
    {
      dayNo: 4,
      date: "2026-05-04",
      items: [
        { id: "item-d4-1", type: "MEAL", content: "조식 (호텔)", note: "" },
        { id: "item-d4-2", type: "SIGHTSEEING", content: "유니버설스튜디오", note: "" },
        { id: "item-d4-3", type: "ACCOMMODATION", content: "마리나베이샌즈 연박", note: "" },
      ],
    },
    {
      dayNo: 5,
      date: "2026-05-05",
      items: [
        { id: "item-d5-1", type: "TRANSFER", content: "싱가포르 공항 출발", note: "" },
        { id: "item-d5-2", type: "TRANSFER", content: "인천공항 도착", note: "" },
      ],
    },
  ],
});

const sampleQuote = JSON.stringify({
  header: { writtenAt: "2026-04-18" },
  items: [
    {
      id: "q-item-1",
      category: "FLIGHT",
      region: "싱가포르",
      date: "2026-05-01",
      description: "KE-123 인천→싱가포르",
      quantity: 12,
      unitPrice: 500000,
      subtotal: 6000000,
    },
    {
      id: "q-item-2",
      category: "HOTEL",
      region: "싱가포르",
      date: "2026-05-01",
      description: "마리나베이샌즈 4박",
      quantity: 6,
      unitPrice: 400000,
      subtotal: 2400000,
    },
  ],
  summary: {
    subtotal: 8400000,
    agencyFee: 840000,
    vat: 924000,
    total: 10164000,
  },
});

async function main() {
  // 파트너 사용자 조회 (seed.ts에서 생성됨)
  const partnerUser = await db.user.findUniqueOrThrow({
    where: { email: "partner@test.com" },
  });

  const agentUser = await db.user.findUniqueOrThrow({
    where: { email: "agent@test.com" },
  });

  const salesUser = await db.user.findUniqueOrThrow({
    where: { email: "sales@test.com" },
  });

  // Bid 생성 (upsert)
  const bid = await db.bid.upsert({
    where: { bidCode: "BID-E2E-001" },
    update: {
      partnerId: partnerUser.id,
      agentId: agentUser.id,
      salesId: salesUser.id,
    },
    create: {
      bidCode: "BID-E2E-001",
      title: "E2E 테스트 비딩",
      region: "싱가포르",
      duration: 4,
      travelStart: new Date("2026-05-01"),
      travelEnd: new Date("2026-05-05"),
      status: "OPEN",
      partnerId: partnerUser.id,
      agentId: agentUser.id,
      salesId: salesUser.id,
    },
  });

  // Quote 1: QCE2ETEST001 (v1.0 only) — 팝업 진입, 다중 항목, 버전 생성, Excel 다운로드, 권한 테스트용
  const quote1 = await db.quote.upsert({
    where: { quoteCode: "QCE2ETEST001" },
    update: { latestVersion: "v1.0" },
    create: {
      quoteCode: "QCE2ETEST001",
      latestVersion: "v1.0",
      bidId: bid.id,
    },
  });
  await db.quoteVersion.deleteMany({ where: { quoteId: quote1.id } });

  // QuoteVersion v1.0 for quote1
  await db.quoteVersion.upsert({
    where: { quoteId_versionNo: { quoteId: quote1.id, versionNo: "v1.0" } },
    update: {},
    create: {
      quoteId: quote1.id,
      versionNo: "v1.0",
      changeReason: "초기 버전",
      itineraryData: sampleItinerary,
      quoteData: sampleQuote,
      savedById: agentUser.id,
      savedByRole: "AGENT",
    },
  });

  // Quote 2: QCE2ETEST002 (v1.0 + v1.1) — 구버전 읽기 전용 테스트용 (T-806)
  const quote2 = await db.quote.upsert({
    where: { quoteCode: "QCE2ETEST002" },
    update: { latestVersion: "v1.1" },
    create: {
      quoteCode: "QCE2ETEST002",
      latestVersion: "v1.1",
      bidId: bid.id,
    },
  });
  await db.quoteVersion.deleteMany({ where: { quoteId: quote2.id } });

  // QuoteVersion v1.0 for quote2
  await db.quoteVersion.upsert({
    where: { quoteId_versionNo: { quoteId: quote2.id, versionNo: "v1.0" } },
    update: {},
    create: {
      quoteId: quote2.id,
      versionNo: "v1.0",
      changeReason: "초기 버전",
      itineraryData: sampleItinerary,
      quoteData: sampleQuote,
      savedById: agentUser.id,
      savedByRole: "AGENT",
    },
  });

  // QuoteVersion v1.1 for quote2
  const updatedItinerary = JSON.stringify({
    ...JSON.parse(sampleItinerary),
    header: { groupName: "E2E 테스트 그룹 (수정)", writtenAt: "2026-04-18" },
  });

  await db.quoteVersion.upsert({
    where: { quoteId_versionNo: { quoteId: quote2.id, versionNo: "v1.1" } },
    update: {},
    create: {
      quoteId: quote2.id,
      versionNo: "v1.1",
      changeReason: "숙박 업그레이드 반영",
      itineraryData: updatedItinerary,
      quoteData: sampleQuote,
      savedById: agentUser.id,
      savedByRole: "AGENT",
    },
  });
}

export default async function globalSetup() {
  await main()
    .catch((e) => {
      // eslint-disable-next-line no-console
      console.error("[global-setup] 테스트 데이터 초기화 실패:", e);
      throw e;
    })
    .finally(() => db.$disconnect());
}
