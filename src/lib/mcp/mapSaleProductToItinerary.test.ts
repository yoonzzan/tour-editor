import { describe, expect, it } from "vitest";
import { mapMcpProductToItinerary } from "@/lib/mcp/mapSaleProductToItinerary";

describe("mapMcpProductToItinerary", () => {
  it("filters non-schedule MCP cards and deduplicates repeated attraction cards", () => {
    const result = mapMcpProductToItinerary(
      {
        baseProductInfo: {
          saleProdNm: "테스트 상품",
          depDay: "2026-06-02",
          arrDay: "2026-06-06",
          shpnCntrVistCnt: 1,
          depFlgtCd: "BX0719",
          arrFlgtCd: "BX0710",
          trvlExpnInclList: [
            { trvlExpnClstNm: "[교통]", trvlExpnDesc: "왕복항공권" },
          ],
          trvlExpnNoneInclList: [
            { trvlExpnClstNm: "[가이드/기사]", trvlExpnDesc: "가이드/기사 경비 : 인당 USD 40" },
          ],
          trvlChcExpnList: [
            { trvlExpnClstNm: "[교통]", trvlExpnDesc: "항공리턴변경(문의)" },
          ],
          pkgAirSeqList: [
            {
              segSeq: "1",
              airlNm: "에어부산",
              flgtNm: "0719",
              depAptNm: "김해 국제공항",
              arrAptNm: "칼리보 국제공항",
              depHm: "2205",
              arrHm: "0130",
            },
            {
              segSeq: "2",
              airlNm: "에어부산",
              flgtNm: "0710",
              depAptNm: "칼리보 국제공항",
              arrAptNm: "김해 국제공항",
              depHm: "0230",
              arrHm: "0730",
            },
          ],
        },
        itineraryInfo: {
          schdInfoList: [
            {
              schdSeq: 1,
              strtDt: "2026-06-02",
              schdMainInfoList: [
                {
                  id: "generic-transfer",
                  schdCatgCd: "002",
                  schdCatgNm: "도시간이동",
                  memoTitlNm: "도시간이동",
                  schdRqrmTm: "00",
                  schdRqrmHm: "00",
                },
                {
                  id: "ueno-long",
                  schdCatgCd: "001",
                  schdCatgNm: "관광",
                  memoTitlNm: "우에노",
                  memoCont:
                    "우에노상세보기 일본의 예술과 전통의 모습을 우에노(上野)에서 이전다음 우에노 공원 설명",
                },
                {
                  id: "meeting",
                  schdCatgCd: "099",
                  schdCatgNm: "텍스트입력",
                  memoTitlNm: "인천출발 - 인천 공항 가이드 미팅 출국 3시간 전 인천공항 미팅 예정",
                },
                {
                  id: "ueno-short",
                  schdCatgCd: "001",
                  schdCatgNm: "관광",
                  memoTitlNm: "우에노",
                  memoCont: "우에노상세보기 일본의 예술과 전통의 모습을 우에노(上野)에서",
                },
                {
                  id: "notice",
                  schdCatgCd: "099",
                  schdCatgNm: "기타",
                  memoTitlNm: "쇼핑안내",
                  memoCont: "1회의 쇼핑이 포함된 상품입니다.",
                },
                {
                  id: "test-card",
                  schdCatgCd: "001",
                  schdCatgNm: "관광",
                  memoTitlNm: "묶음카드명 ttttttt",
                  memoCont: "2개의 카드매니저 등록되어 있음",
                },
                {
                  id: "card-html",
                  schdCatgCd: "001",
                  schdCatgNm: "관광지",
                  cardNm: "보라카이 리조트 소개",
                  cardCntntPc: "상세보기 이전다음 호텔소개 아주 긴 HTML 설명",
                },
                {
                  id: "untitled-card",
                  schdCatgCd: "001",
                  schdCatgNm: "관광지",
                  cmsCardId: "20180220000024",
                  cardCntntPc: "상세보기 이전다음 카드 본문만 있는 항목",
                },
                {
                  id: "meal",
                  schdCatgCd: "004",
                  schdCatgNm: "식사",
                  dtlMealDvNm: "조식",
                  memoTitlNm: "식사",
                },
                {
                  id: "placeholder",
                  schdCatgCd: "099",
                  schdCatgNm: "기타",
                  memoTitlNm: "일정",
                },
              ],
            },
          ],
        },
        scheduleAndTouristSpotInfo: {
          optiontourRemarksInfo: {
            remarkData: "선택관광은 상품가격에 불포함 입니다.",
          },
          chcInfoList: [
            { chcStsngNm: "[FreePack전용] 라바스톤 마사지" },
          ],
        },
      },
      "AVP999261231VNE",
    );

    const items = result.itinerary.days[0]?.items ?? [];
    const contents = items.map((item) => item.content);

    expect(contents.filter((content) => content.includes("우에노"))).toHaveLength(1);
    expect(contents.join("\n")).not.toContain("도시간이동");
    expect(contents.join("\n")).not.toContain("쇼핑안내");
    expect(contents.join("\n")).not.toContain("묶음카드");
    expect(contents.join("\n")).not.toContain("카드매니저");
    expect(contents.join("\n")).not.toContain("상세보기");
    expect(contents.join("\n")).not.toContain("이전다음");
    expect(contents.join("\n")).not.toContain("아주 긴 HTML 설명");
    expect(contents.join("\n")).not.toContain("카드 본문만 있는 항목");
    expect(contents).toContain("보라카이 리조트 소개");
    expect(items.find((item) => item.id === "meeting")).toMatchObject({
      content: "인천출발",
      detail: "인천 공항 가이드 미팅 출국 3시간 전 인천공항 미팅 예정",
    });
    expect(items.find((item) => item.type === "MEAL")?.meal?.breakfast).toBe("예약");
    expect(items.every((item) => item.time !== "00")).toBe(true);
    expect(result.itinerary.basics.flight.departure).toBe(
      "에어부산 0719 / 김해 국제공항 → 칼리보 국제공항 / 22:05 → 01:30",
    );
    expect(result.itinerary.basics.flight.arrival).toBe(
      "에어부산 0710 / 칼리보 국제공항 → 김해 국제공항 / 02:30 → 07:30",
    );
    expect(result.itinerary.basics.included).toContain("왕복항공권");
    expect(result.itinerary.basics.excluded).toContain("가이드/기사 경비");
    expect(result.itinerary.basics.optionalTour).toContain("라바스톤 마사지");
    expect(result.itinerary.basics.notes).toContain("선택관광은 상품가격에 불포함");
  });

  it("prefers user-facing product fields and removes internal MCP noise", () => {
    const result = mapMcpProductToItinerary(
      {
        baseProductInfo: {
          saleProdNm: "다낭 4박 5일",
          depDay: "2026-06-02",
          arrDay: "2026-06-06",
          itnrCntyCds: "VN",
          vistCity: "DAD",
          prodAreaCd: "AV",
          adtAmt: 610000,
          htlEnn: "Y",
          chdInclRoomYn: "Y",
          cityBasInfoList: [
            { cityNm: "다낭" },
          ],
          trvlChcExpnList: [
            { trvlExpnDesc: "객실 1인 사용료 : 요금미정, 문의바랍니다." },
          ],
        },
        itineraryInfo: {
          schdInfoList: [
            {
              schdSeq: 1,
              strtDt: "2026-06-02",
              schdMainInfoList: [
                {
                  id: "meeting",
                  schdCatgCd: "099",
                  schdCatgNm: "텍스트입력",
                  memoTitlNm: "인천출발 - 인천 공항 가이드 미팅 출국 3시간 전 인천공항 미팅 예정",
                },
                {
                  id: "visit-region",
                  schdCatgCd: "001",
                  schdCatgNm: "관광",
                  memoTitlNm: "방문지역 일본 추가",
                },
                {
                  id: "country-edit",
                  schdCatgCd: "001",
                  schdCatgNm: "관광",
                  memoTitlNm: "국가 수정 등록완료",
                },
              ],
            },
          ],
        },
      },
      "AVP999260602VNE",
    );

    const contents = result.itinerary.days.flatMap((day) => day.items.map((item) => item.content));

    expect(result.itinerary.overview.cities).toBe("다낭");
    expect(result.itinerary.overview.fare.adultPerPerson).toBe(610000);
    expect(result.itinerary.basics.accommodation.grade).toBe("");
    expect(result.itinerary.basics.accommodation.occupancy).toBe("");
    expect(result.itinerary.basics.optionalTour).toBe("");
    expect(contents.join("\n")).not.toContain("방문지역");
    expect(contents.join("\n")).not.toContain("국가 수정");
    expect(result.itinerary.days[0]?.items.find((item) => item.id === "meeting")).toMatchObject({
      type: "TRANSFER",
      content: "인천출발",
      detail: "인천 공항 가이드 미팅 출국 3시간 전 인천공항 미팅 예정",
    });
  });

  it("uses sightseeing card names before MCP memo titles", () => {
    const result = mapMcpProductToItinerary(
      {
        baseProductInfo: {
          saleProdNm: "카드명 우선순위 테스트",
          depDay: "2026-06-02",
          arrDay: "2026-06-06",
        },
        itineraryInfo: {
          schdInfoList: [
            {
              schdSeq: 1,
              strtDt: "2026-06-02",
              schdMainInfoList: [
                {
                  id: "damnoen-card",
                  schdCatgCd: "001",
                  schdCatgNm: "관광",
                  memoTitlNm: "국가 수정 등록완료",
                  cardNm: "담넌사두억",
                  cardCntntPc: "담넌사두억상세보기 태국 수상시장 체험 이전다음",
                },
              ],
            },
          ],
        },
      },
      "AVP999260602VNE",
    );

    const contents = result.itinerary.days[0]?.items.map((item) => item.content) ?? [];

    expect(contents).toContain("담넌사두억");
    expect(contents.join("\n")).not.toContain("국가 수정");
  });

  it("drops group card containers but imports nested single cards as sightseeing items", () => {
    const result = mapMcpProductToItinerary(
      {
        baseProductInfo: {
          saleProdNm: "그룹 카드 테스트",
          depDay: "2026-06-02",
          arrDay: "2026-06-06",
        },
        itineraryInfo: {
          schdInfoList: [
            {
              schdSeq: 1,
              strtDt: "2026-06-02",
              schdMainInfoList: [
                {
                  id: "group-container",
                  schdCatgCd: "001",
                  schdCatgNm: "관광",
                  cmsCardDvCd: "G",
                  cardNm: "묶음카드명 ttttttt",
                  cmsCardList: [
                    {
                      cmsCardId: "single-1",
                      cmsCardDvCd: "S",
                      cardNm: "사파리 파크",
                      cardCntntMbl: "베트남 꾸이년의 동물학 박물관",
                    },
                    {
                      cmsCardId: "single-2",
                      cmsCardDvCd: "S",
                      cardNm: "왓 아룬",
                      cardCntntMbl: "새벽 사원",
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
      "AVP999260602VNE",
    );

    const items = result.itinerary.days[0]?.items ?? [];
    const contents = items.map((item) => item.content);

    expect(contents).toContain("사파리 파크");
    expect(contents).toContain("왓 아룬");
    expect(contents).not.toContain("묶음카드명 ttttttt");
    expect(items.every((item) => item.type === "SIGHTSEEING")).toBe(true);
  });

  it("extracts single sightseeing cards embedded in group card text", () => {
    const result = mapMcpProductToItinerary(
      {
        baseProductInfo: {
          saleProdNm: "그룹 카드 텍스트 테스트",
          depDay: "2026-06-02",
          arrDay: "2026-06-06",
        },
        itineraryInfo: {
          schdInfoList: [
            {
              schdSeq: 1,
              strtDt: "2026-06-02",
              schdMainInfoList: [
                {
                  id: "group-text-container",
                  schdCatgCd: "001",
                  schdCatgNm: "관광",
                  cmsCardDvCd: "G",
                  cardNm: "묶음카드명 ttttttt",
                  memoCont:
                    "묶음카드명 ttttttt - 2개의 카드매니저 등록되어 있음 - tttttttt 사파리 파크상세보기 베트남 꾸이년의 동물학 박물관 사파리 파크상세보기 ... 왓 아룬 - 왓 아룬상세보기 신비로운 새벽 사원",
                },
              ],
            },
          ],
        },
      },
      "AVP999260602VNE",
    );

    const contents = result.itinerary.days[0]?.items.map((item) => item.content) ?? [];

    expect(contents).toContain("사파리 파크");
    expect(contents).toContain("왓 아룬");
    expect(contents.join("\n")).not.toContain("묶음카드명");
    expect(contents.join("\n")).not.toContain("카드매니저");
  });

  it("keeps MCP meal details and parses sightseeing titles from card text fields", () => {
    const result = mapMcpProductToItinerary(
      {
        baseProductInfo: {
          saleProdNm: "식사 관광 테스트",
          depDay: "2026-06-02",
          arrDay: "2026-06-06",
        },
        itineraryInfo: {
          schdInfoList: [
            {
              schdSeq: 1,
              strtDt: "2026-06-02",
              schdMainInfoList: [
                {
                  id: "breakfast-excluded",
                  schdCatgCd: "004",
                  schdCatgNm: "식사",
                  dtlMealDvNm: "조식",
                  mealTypeNm: "불포함",
                },
                {
                  id: "lunch-flight",
                  schdCatgCd: "004",
                  schdCatgNm: "식사",
                  dtlMealDvNm: "중식",
                  mealTypeNm: "기내식",
                  memoCont: "기내식은 한식으로 제공됩니다.",
                },
                {
                  id: "burapha",
                  schdCatgCd: "001",
                  schdCatgNm: "관광",
                  cardCntntMbl: "부라파 골프 클럽상세보기 BURAPHA GOLF CLUB",
                },
                {
                  id: "damnoen",
                  schdCatgCd: "001",
                  schdCatgNm: "관광",
                  cardCntntPc: "담넌사두억상세보기 태국 수상시장 체험 이전다음",
                },
              ],
            },
            {
              schdSeq: 2,
              strtDt: "2026-06-03",
              schdMainInfoList: [
                {
                  id: "breakfast-resort",
                  schdCatgCd: "004",
                  schdCatgNm: "식사",
                  dtlMealDvNm: "조식",
                  mealTypeNm: "리조트식",
                },
                {
                  id: "lunch-free",
                  schdCatgCd: "004",
                  schdCatgNm: "식사",
                  dtlMealDvNm: "중식",
                  memoCont: "자유식사, 일정 미포함입니다.",
                },
                {
                  id: "dinner-local",
                  schdCatgCd: "004",
                  schdCatgNm: "식사",
                  dtlMealDvNm: "석식",
                  mealTypeNm: "현지식",
                  memoCont: "골프장 이용 고객은 클럽하우스 내에서 식사 준비",
                },
                {
                  id: "resort-free-time",
                  schdCatgCd: "099",
                  schdCatgNm: "텍스트입력",
                  memoTitlNm: "리조트 조식 후 오전 리조트 내 자유시간",
                },
              ],
            },
          ],
        },
      },
      "AVP999260602VNE",
    );

    const firstDayItems = result.itinerary.days[0]?.items ?? [];
    const secondDayItems = result.itinerary.days[1]?.items ?? [];
    const firstDayMeals = firstDayItems.filter((item) => item.type === "MEAL");
    const secondDayMeals = secondDayItems.filter((item) => item.type === "MEAL");

    expect(firstDayMeals.find((item) => item.id === "breakfast-excluded")?.meal?.breakfast).toBe("불포함");
    expect(firstDayMeals.find((item) => item.id === "lunch-flight")?.meal?.lunch).toBe(
      "기내식은 한식으로 제공됩니다., 기내식",
    );
    expect(firstDayItems.map((item) => item.content)).toContain("부라파 골프 클럽");
    expect(firstDayItems.map((item) => item.content)).toContain("담넌사두억");
    expect(secondDayMeals.find((item) => item.id === "breakfast-resort")?.meal?.breakfast).toBe("리조트식");
    expect(secondDayMeals.find((item) => item.id === "lunch-free")?.meal?.lunch).toBe("자유식사, 일정 미포함입니다.");
    expect(secondDayMeals.find((item) => item.id === "dinner-local")?.meal?.dinner).toBe(
      "골프장 이용 고객은 클럽하우스 내에서 식사 준비, 현지식",
    );
    expect(secondDayItems.find((item) => item.id === "resort-free-time")).toMatchObject({
      type: "OTHER",
      content: "리조트 조식 후 오전 리조트 내 자유시간",
    });
  });
});
