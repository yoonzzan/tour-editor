import { afterEach, describe, expect, it, vi } from "vitest";
import { currentYearInKorea } from "@/lib/date/korea";
import {
  ANALYSIS_SYSTEM_PROMPT,
  PARSER_SYSTEM_PROMPT,
  buildAnalysisUserPrompt,
  buildParseUserPrompt,
} from "@/lib/itinerary/aiPrompts";

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("AI prompt builders", () => {
  it("keeps analysis prompt structure and core extraction rules", () => {
    const prompt = buildAnalysisUserPrompt("테스트 일정", "1일차 인천공항 출발");

    expect(ANALYSIS_SYSTEM_PROMPT).toContain("JSON 생성이 아니라");
    expect(ANALYSIS_SYSTEM_PROMPT).toContain("HOTEL/호텔명 행");
    expect(prompt).toContain("[AI 분석 결과]");
    expect(prompt).toContain("[일차별 일정]");
    expect(prompt).toContain("[원문]");
    expect(prompt).toContain("1일차 | TRANSFER | 인천공항 출발 |  | 10:00 | ");
    expect(prompt).toContain("title: 테스트 일정");
  });

  it("keeps parse prompt scoped to analysis text and core JSON rules", () => {
    const prompt = buildParseUserPrompt("테스트 일정", "1일차 | TRANSFER | 인천공항 출발 |  | 10:00 |");

    expect(PARSER_SYSTEM_PROMPT).toContain("반드시 JSON 객체만 출력");
    expect(PARSER_SYSTEM_PROMPT).toContain("견적번호/기준코드/출발일/인원/차량/호텔/포함/불포함/비고/지상비");
    expect(prompt).toContain("[AI 분석 결과]");
    expect(prompt).not.toContain("[원문]");
    expect(prompt).toContain("10-1) 분석 요약에 day별 HOTEL/호텔명 행이 있으면 해당 day의 ACCOMMODATION item으로 반드시 생성한다.");
    expect(prompt).toContain("11) 지역(region)과 교통편(transport)은 일정 항목에서 항상 비워둔다.");
  });
});

describe("parseItineraryByAi fallback", () => {
  it("parses quotation metadata separately from simple itinerary days", async () => {
    process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "test-secret";
    process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./test.db";
    process.env.OPENAI_API_KEY = "";

    const { parseItineraryByAi } = await import("@/lib/itinerary/aiParser");
    const rawText = `견적번호 : QA00686173001
기준코드 : AVU221260809VJA

1. 출발일 : 2026.08..09
2. 인원 : 6+0
3. 차량 : 16인승
4. 호텔 : 나트랑 메리어트 리조트 앤 스파 혼트레섬, 3베드룸 풀빌라 가든뷰 3박
5. 포함 :  기가경비
6. 불포함 : 개인 여행경비
7. 비고 : 노쇼핑/ 노옵션
8. 지상비 : 78만원

*빈펄 나트랑베이 3베드룸 풀빌라 풀뷰 3박 24만원 업/인당
*한국인가이드 기준입니다.

[간단일정]
1일차 : 나트랑도착, 혼총곶, 리조트투숙 / 쌀국수, 리조트식
2일차 : 빈원더스 일일 자유일정(가이드+차량 불포함) / 불포함, 리조트식
3일차 : 빈원더스 일일 자유일정(가이드+차량 불포함) / 불포함, 리조트식
4일차 : 오전자유일정, 롱손사, 포나가, 담시장, 아이리조트머드온천, 공항이동 / 한식, 현지식
5일차 : 도착`;

    const result = await parseItineraryByAi({ rawText, title: "직접입력 일정" });
    expect(result.days).toHaveLength(5);
    expect(result.overview.travelPeriod).toEqual({
      start: "2026-08-09",
      end: "2026-08-13",
    });
    expect(result.overview.passengers.adult).toBe(6);
    expect(result.overview.passengers.child).toBe(0);
    expect(result.basics.flight.localVehicle).toBe("16인승");
    expect(result.basics.accommodation.hotel).toContain("나트랑 메리어트");
    expect(result.basics.included).toBe("기가경비");
    expect(result.basics.excluded).toBe("개인 여행경비");
    expect(result.basics.shoppingCenters).toBe(0);
    expect(result.basics.optionalTour).toBe("노옵션");
    expect(result.overview.fare.adultPerPerson).toBe(780000);

    const allContents = result.days.flatMap((day) =>
      day.items.map((item) => item.content)
    );
    expect(allContents).not.toContain("견적번호 : QA00686173001");
    expect(allContents).not.toContain("1. 출발일 : 2026.08..09");
    expect(result.days[0]?.items.map((item) => item.content)).toContain("혼총곶");
    expect(result.days[0]?.items.some((item) => item.type === "ACCOMMODATION")).toBe(true);
  });

  it("does not fallback to 1899 dates when schedule has no explicit base date", async () => {
    process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "test-secret";
    process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./test.db";
    process.env.OPENAI_API_KEY = "";

    const { parseItineraryByAi } = await import("@/lib/itinerary/aiParser");
    const rawText = `
1일차 | 호텔 체크인
3일차 | 공항 이동
`;

    const result = await parseItineraryByAi({ rawText, title: "직접입력 일정" });

    expect(result.days.map((day) => day.dayNo)).toEqual([1, 3]);
    expect(result.days.every((day) => day.date !== "1899-12-31")).toBe(true);
    expect(result.overview.travelPeriod.start).not.toBe("1899-12-31");
  });

  it("parses copied product summaries into overview and basics metadata", async () => {
    process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "test-secret";
    process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./test.db";
    process.env.OPENAI_API_KEY = "";

    const { parseItineraryByAi } = await import("@/lib/itinerary/aiParser");
    const rawText = `상품명: 다낭 테스트 5일
도시 VN, DAD, AV
기간 2026-06-02 ~ 2026-06-06
여행요금: 859,900원
항공 출발: OZ752 인천 10:00 → 다낭 13:00
항공 귀국: OZ753 다낭 14:00 → 인천 20:00
숙박호텔: 다낭 메리어트 리조트 & 스파
포함사항: 왕복항공권 / 숙박비
불포함사항: 개인 여행경비
선택관광: 담락스파
쇼핑센터 방문 수: 1

1일차 2026-06-02
- 이동 | 인천출발 - 인천 공항 가이드 미팅 출국 3시간 전 인천공항 미팅 예정
- 숙박 | 다낭 메리어트 리조트 & 스파 숙박
2일차 2026-06-03
- 관광 | 방문지역 일본 추가`;

    const result = await parseItineraryByAi({ rawText, title: "직접입력 일정" });

    expect(result.header.groupName).toBe("다낭 테스트 5일");
    expect(result.overview.cities).toBe("VN, DAD, AV");
    expect(result.overview.travelPeriod).toEqual({
      start: "2026-06-02",
      end: "2026-06-06",
    });
    expect(result.overview.fare.adultPerPerson).toBe(859900);
    expect(result.basics.flight.departure).toBe("OZ752 인천 10:00 → 다낭 13:00");
    expect(result.basics.flight.arrival).toBe("OZ753 다낭 14:00 → 인천 20:00");
    expect(result.basics.accommodation.hotel).toBe("다낭 메리어트 리조트 & 스파");
    expect(result.basics.included).toBe("왕복항공권 / 숙박비");
    expect(result.basics.excluded).toBe("개인 여행경비");
    expect(result.basics.optionalTour).toBe("담락스파");
    expect(result.basics.shoppingCenters).toBe(1);

    const firstItem = result.days[0]?.items[0];
    expect(firstItem?.content).toBe("인천출발");
    expect(firstItem?.detail).toBe("인천 공항 가이드 미팅 출국 3시간 전 인천공항 미팅 예정");
  });

  it("ignores table headers and fee blocks in pasted tabular itineraries", async () => {
    process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "test-secret";
    process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./test.db";
    process.env.OPENAI_API_KEY = "";

    const { parseItineraryByAi } = await import("@/lib/itinerary/aiParser");
    const rawText = `[견적서] CTS 3박4일
DATE	CITY	TRSFT	TIME	ITINERARY	ITINERARY	ITINERARY	ITINERARY	MEALS
제1일	인천		12:35	인천 국제 공항 3층 집결 및 가이드 미팅
2/28	BX	12:35	신치토세 공항 도착
	신치토세	전용버스	15:30	신치토세 공항 도착
				호텔 체크인 후 석식 및 휴식(온천욕♨)
제2일	조잔케이	전용버스		호텔 조식 후
	후라노		후라노 이동.				L: 현지식
제3일	소운쿄	전용버스		호텔 조식 후
	오타루		오타루 이동.
제4일	삿포로	전용버스		호텔 조식 후
TOUR FEE (1인 지상비)
	02월 28일	¥101,000 	¥132,000
참고 사항
*현지 호텔은 미수배 상태이므로 예약 시점에서 수배 진행 예정 입니다.
불포함사항
*해외여행자보험 불포함입니다.
기타사항
*환율은 변동 환율 기준입니다.`;

    const result = await parseItineraryByAi({ rawText, title: "직접입력 일정" });

    expect(result.days.map((day) => day.dayNo)).toEqual([1, 2, 3, 4]);
    const dayContents = result.days.flatMap((day) => day.items.map((item) => item.content));
    expect(dayContents.every((text) => !text.includes("DATE"))).toBe(true);
    expect(dayContents.every((text) => !text.includes("TOUR FEE"))).toBe(true);
    expect(dayContents.every((text) => !text.includes("참고 사항"))).toBe(true);
    expect(dayContents.every((text) => !text.includes("기타사항"))).toBe(true);
    expect(dayContents.every((text) => !text.includes("불포함사항"))).toBe(true);
    expect(dayContents).toContain("인천 국제 공항 3층 집결 및 가이드 미팅");
    expect(dayContents.some((text) => text.includes("신치토세 공항 도착"))).toBe(true);
    expect(result.overview.travelPeriod.start).toBe("2026-02-28");
  });

  it("keeps pasted full itinerary table from copy into meaningful rows only", async () => {
    process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "test-secret";
    process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./test.db";
    process.env.OPENAI_API_KEY = "";

    const { parseItineraryByAi } = await import("@/lib/itinerary/aiParser");
    const rawText = `[견적서] CTS 3박4일\nDATE\tCITY\tTRSFT\tTIME\tITINERARY\tMEALS\n제1일\t인천\t\t\t12:35\t인천 국제 공항 3층 집결 및 가이드 미팅\t\n2/28\tBX\t12:35\t신치토세 공항 도착\n\t신치토세\t전용버스\t15:30\t신치토세 공항 도착\n\t\t\t\t호텔 체크인 후 석식 및 휴식(온천욕♨)\n제2일\t조잔케이\t전용버스\t\t호텔 조식 후\t\n\t후라노\t\t후라노 이동.\t\n\t\t\tL: 현지식\n제3일\t소운쿄\t전용버스\t\t호텔 조식 후\t\n\t오타루\t\t오타루 이동.\n제4일\t삿포로\t전용버스\t\t호텔 조식 후\t\nTOUR FEE (1인 지상비)\n\t02월 28일\t¥101,000\t\t¥132,000\n참고 사항\n*현지 호텔은 미수배 상태이므로 예약 시점에서 수배 진행 예정 입니다.\n불포함사항\n*해외여행자보험 불포함입니다.\n기타사항\n*환율은 변동 환율 기준입니다.`;

    const result = await parseItineraryByAi({ rawText, title: "직접입력 일정" });
    expect(result.days).toHaveLength(4);
    const allContent = result.days.flatMap((day) => day.items.map((item) => item.content));
    const allDetail = result.days.flatMap((day) => day.items.map((item) => item.detail ?? ""));

    expect(allContent.some((text) => text.includes("DATE"))).toBe(false);
    expect(allContent.some((text) => text.includes("TOUR FEE"))).toBe(false);
    expect(allContent.some((text) => text.includes("참고 사항"))).toBe(false);
    expect(allContent.every((text) => !text.includes("1899"))).toBe(true);
    expect(allDetail.every((text) => !text.includes("1899"))).toBe(true);
    expect(allContent).toContain("인천 국제 공항 3층 집결 및 가이드 미팅");
    expect(allContent).toContain("신치토세 공항 도착");
    expect(allContent).toContain("호텔 체크인 후 석식 및 휴식(온천욕♨)");
    expect(result.days.map((day) => day.dayNo)).toEqual([1, 2, 3, 4]);
  });

  it("parses the provided pasted schedule without generating header/detail noise", async () => {
    process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "test-secret";
    process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./test.db";
    process.env.OPENAI_API_KEY = "";

    const { parseItineraryByAi } = await import("@/lib/itinerary/aiParser");
    const rawText = `[견적서] CTS 3박4일
DATE	CITY	TRSFT	TIME	ITINERARY				MEALS
제1일	인천			인천 국제 공항 3층 집결 및 가이드 미팅				
2/28		BX	12:35	인천 국제 공항 출발				
	신치토세	전용버스	15:30	신치토세 공항 도착				L: 불포함
	조잔케이			조잔케이 이동.				
				호텔 체크인 후 석식 및 휴식(온천욕♨)				D: 호텔식
				HOTEL : 조잔케이 뷰 호텔 (2인1실/ 화실 또는 양실 기준)				(뷔페식)
				https://www.jozankeiview.com/				
제2일	조잔케이	전용버스		호텔 조식 후				B:호텔식
	후라노			후라노 이동.				
				*작은요정마을을 연상시키는 닝구르테라스 관광				L: 현지식
비에이			비에이 이동.				(오무카레정식)
				*신비로운 푸른연못 아오이 이케 관광				
				*폭포의 물줄기가 흰수염 같다하여 붙여진 흰수염 폭포 관광				
				*패치워크의 길 관광(차창)				
	소운쿄			소운쿄 이동.				
				호텔 체크인 후 석식 및 휴식(온천욕♨)				
				HOTEL : 소운쿄 다이세츠 호텔 (2인1실/ 화실 또는 양실 기준)				D: 호텔식
				https://www.hotel-taisetsu.com/				(뷔페식)
제3일	소운쿄	전용버스		호텔 조식 후				B:호텔식
	오타루			오타루 이동.				
				*오르골 전시관인 오타루 오르골당 관광				
				*유리 제품을 진열 및 판매하는 기타이치가라스관(北一ガラス館) 관광				
				*오타루의 대표적인 랜드마크인 오타루 운하(小樽運河) 관광				L: 현지식
	삿포로			삿포로 이동. 				(규카츠 정식)
				*시로이 코이비토 파크 관광 (무료존)				
				*북해도 시민들의 휴식처이자 여러 축제의 장 오도리공원관광				
				석식 후 호텔이동.				
				호텔 체크인 후 휴식				D: 현지식
				HOTEL : 삿포로 프린스 호텔 (2인1실/ 양실기준)				(대게 무제한)
				https://www.princehotels.co.jp/sapporo/				
제4일	삿포로	전용버스		호텔 조식 후 				B:호텔식
				*구도청사와 더불어 삿포를 대표하는 관광 명소인 삿로포 시계탑(차장 관광) 관광				
				*면세점 1회 방문				
	치토세			치토세 공항 이동.(약 1시간 소요)				L: 현지식
				신치토세 공항 도착 후 출국 수속				(스프카레)
		BX	16:30	신치토세 국제 공항 출발				
	인천		20:10	인천 국제 공항 도착				
"TOUR FEE
(1인 지상비)"					8명 + 1 드라이빙 가이드		8명 + 1 현지가이드	
		02월 28일			¥101,000 		¥132,000 	
참고 사항		*현지 호텔은 미수배 상태이므로 예약 시점에서 수배 진행 예정 입니다.						
포함사항		*현지 드라이빙 가이드 조건입니다.						
		*전일정 숙박 2인 1실 사용기준 입니다.						
		*가이드 &기사 팁 포함(성인, 아동 동일 ￥4,000)입니다.						
		*전용버스 4일, 중식(현지식 3회), 석식(현지식 2회+호텔식 1회), 명시된 관광지 입장료는 포함입니다.						
불포함사항		*해외여행자보험 불포함입니다.						
		*항공료 및 텍스&유류 할증료 기타 개인 경비 불포함 조건입니다.						
기타사항		*호텔 싱글 이용시 1인 3박당 ￥23,000 추가 요금 발생됩니다. (1룸 이상 발생시 문의 부탁드립니다.)						
		*면세점 1회 방문 기준입니다.						
		*환율은 변동 환율 기준입니다.						
		*현지사정에 의해 상기일정 및 호텔 순서 및 일정은 변경될 수 있습니다. 				

`;

    const result = await parseItineraryByAi({ rawText, title: "직접입력 일정" });
    const allContent = result.days.flatMap((day) => day.items.map((item) => item.content));
    const allDetail = result.days.flatMap((day) => day.items.flatMap((item) => item.detail ? [item.detail] : []));

    expect(result.days).toHaveLength(4);
    expect(result.days.map((day) => day.dayNo)).toEqual([1, 2, 3, 4]);
    expect(allContent.every((text) => !text.includes("DATE"))).toBe(true);
    expect(allContent.every((text) => !text.includes("항목"))).toBe(true);
    expect(allContent.every((text) => !text.includes("TOUR FEE"))).toBe(true);
    expect(allContent.every((text) => !text.includes("1899"))).toBe(true);
    expect(allDetail.every((text) => !text.includes("1899"))).toBe(true);
    expect(allContent.some((text) => text.includes("인천 국제 공항 3층 집결 및 가이드 미팅"))).toBe(true);
    expect(allContent.some((text) => text.includes("호텔 체크인 후 석식 및 휴식"))).toBe(true);
    expect(allContent.some((text) => text.includes("신치토세 공항 도착"))).toBe(true);
    expect(result.overview.travelPeriod.start).toBe("2026-02-28");
  });

  it("keeps schedule body dates from expanding travel period in pasted itinerary blocks", async () => {
    process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "test-secret";
    process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./test.db";
    process.env.OPENAI_API_KEY = "";

    const { parseItineraryByAi } = await import("@/lib/itinerary/aiParser");
    const rawText = `
1일차
2025. 02. 28.
항목구분 | 싱가포르 | 항공 | 10:30 | 신치토세 공항 도착
2일차
2025. 03. 01.
항목구분 | 싱가포르 | 항공 | 10:30 | 후라노 이동
3일차
2025. 03. 02.
항목구분 | 싱가포르 | 항공 | 10:30 | 오타루 이동
4일차
2025. 03. 03.
항목구분 | 싱가포르 | 항공 | 10:30 | 삿포로 이동
5일차
2025. 03. 04.
항목구분 | 싱가포르 | 항공 | 10:30 | 신치토세 공항 출발
2025. 03. 20.
2025. 03. 21.
2025. 03. 22.
2025. 04. 10.
`;

    const result = await parseItineraryByAi({ rawText, title: "직접입력 일정" });

    expect(result.days.map((day) => day.dayNo)).toEqual([1, 2, 3, 4, 5]);
    expect(result.overview.travelPeriod).toEqual({
      start: "2025-02-28",
      end: "2025-03-04",
    });
  });

  it("uses table headers when available and ignores standalone body dates for period window", async () => {
    process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "test-secret";
    process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./test.db";
    process.env.OPENAI_API_KEY = "";

    const { parseItineraryByAi } = await import("@/lib/itinerary/aiParser");
    const rawText = `[견적서] CTS 3박4일
DATE|CITY|TRSFT|TIME|ITINERARY|MEALS
제1일|싱가포르|전용버스||인천 국제 공항 3층 집결 및 가이드 미팅|
2/28||BX|12:35|신치토세 공항 도착|
|신치토세|전용버스|15:30|신치토세 공항 도착|L: 현지식
|후라노|전용버스|16:20|후라노 이동.|
제2일|조잔케이|전용버스||호텔 조식 후|B:호텔식
03/01||전용버스|09:00|오타루 이동.|
03/10||전용버스|09:30|오도리 공원 이동.|
`;

    const result = await parseItineraryByAi({ rawText, title: "직접입력 일정" });

    expect(result.days.map((day) => day.dayNo)).toEqual([1, 2]);
    const currentYear = String(currentYearInKorea());
    expect(result.overview.travelPeriod).toEqual({
      start: `${currentYear}-02-28`,
      end: `${currentYear}-03-01`,
    });
    const allContents = result.days.flatMap((day) => day.items.map((item) => item.content));
    expect(allContents.some((text) => text.includes("신치토세 공항 도착"))).toBe(true);
    expect(allContents).toContain("오타루 이동.");
  });

  it("parses attachment-style spreadsheet text without leaking metadata and object noise", async () => {
    process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "test-secret";
    process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./test.db";
    process.env.OPENAI_API_KEY = "";

    const { parseItineraryByAi } = await import("@/lib/itinerary/aiParser");
    const { spreadsheetRowsToText } = await import("@/lib/itinerary/spreadsheetText");
    const rawText = spreadsheetRowsToText([
      ["[견적서] CTS 3박4일", undefined, undefined, undefined, "[견적서] CTS 3박4일"],
      ["ATTN :", undefined, undefined, undefined, undefined, undefined],
      ["FROM", undefined, undefined, undefined, "2025-01-31", undefined],
      ["DATE", "CITY", "TRSFT", "TIME", "ITINERARY", "MEALS"],
      ["제1일", "인천", undefined, undefined, "인천 국제 공항 3층 집결 및 가이드 미팅", undefined],
      ["2/28", undefined, "BX", "12:35", "인천 국제 공항 출발", undefined],
      [undefined, "신치토세", "전용버스", "15:30", "신치토세 공항 도착", "L: 불포함"],
      [undefined, "조잔케이", undefined, undefined, "조잔케이 이동.", undefined],
      [undefined, undefined, undefined, undefined, "HOTEL", "조잔케이 뷰 호텔 (2인1실/ 화실 또는 양실 기준)"],
      [undefined, undefined, undefined, undefined, { text: "https", hyperlink: "https://www.jozankeiview.com/" }, undefined],
      ["제2일", "조잔케이", "전용버스", undefined, "호텔 조식 후", "B:호텔식"],
      [undefined, "후라노", undefined, undefined, "후라노 이동.", undefined],
      [undefined, undefined, undefined, undefined, { error: "#VALUE!" }, undefined],
      [undefined, "비에이", undefined, undefined, "비에이 이동.", "(오무카레정식)"],
      [undefined, "소운쿄", undefined, undefined, "소운쿄 이동.", undefined],
      [undefined, undefined, undefined, undefined, "HOTEL", "소운쿄 다이세츠 호텔 (2인1실/ 화실 또는 양실 기준) | D: 호텔식"],
      [undefined, undefined, undefined, undefined, { text: "https", hyperlink: "https://www.hotel-taisetsu.com/" }, "(뷔페식)"],
      ["제3일", "소운쿄", "전용버스", undefined, "호텔 조식 후", "B:호텔식"],
      [undefined, "오타루", undefined, undefined, "오타루 이동.", undefined],
      [undefined, undefined, undefined, undefined, { error: "#VALUE!" }, undefined],
      [undefined, "삿포로", undefined, undefined, "삿포로 이동.", "(규카츠 정식)"],
      [undefined, undefined, undefined, undefined, "호텔 체크인 후 휴식", "D: 현지식"],
      [undefined, undefined, undefined, undefined, "HOTEL", "삿포로 프린스 호텔 (2인1실/ 양실기준)"],
      [undefined, undefined, undefined, undefined, { text: "https", hyperlink: "https://www.princehotels.co.jp/sapporo/" }, undefined],
      ["제4일", "삿포로", "전용버스", undefined, "호텔 조식 후", "B:호텔식"],
      [undefined, "치토세", undefined, undefined, "치토세 공항 이동.(약 1시간 소요)", "L: 현지식"],
      [undefined, undefined, undefined, undefined, "신치토세 공항 도착 후 출국 수속", "(스프카레)"],
      [undefined, undefined, "BX", "16:30", "신치토세 국제 공항 출발", undefined],
      [undefined, "인천", undefined, "20:10", "인천 국제 공항 도착", undefined],
      ["TOUR FEE (1인 지상비)", undefined, undefined, undefined, "8명 + 1 드라이빙 가이드", undefined],
      [undefined, undefined, "02월 28일", undefined, "¥101,000", undefined],
      ["참고 사항", undefined, "*현지 호텔은 미수배 상태입니다.", undefined, undefined, undefined],
      ["포함사항", undefined, "*현지 드라이빙 가이드 조건입니다.", undefined, undefined, undefined],
      [undefined, undefined, "*가이드 &기사 팁 포함(성인, 아동 동일 ￥4,000)입니다.", undefined, undefined, undefined],
      [undefined, undefined, "*전용버스 4일, 중식(현지식 3회), 석식(현지식 2회+호텔식 1회), 명시된 관광지 입장료는 포함입니다.", undefined, undefined, undefined],
      ["불포함사항", undefined, "*해외여행자보험 불포함입니다.", undefined, undefined, undefined],
      [undefined, undefined, "*항공료 및 텍스&유류 할증료 기타 개인 경비 불포함 조건입니다.", undefined, undefined, undefined],
      ["기타사항", undefined, "*면세점 1회 방문 기준입니다.", undefined, undefined, undefined],
      [undefined, undefined, "*환율은 변동 환율 기준입니다.", undefined, undefined, undefined],
    ]);

    const result = await parseItineraryByAi({ rawText, title: "CTS 3박4일" });
    const allContents = result.days.flatMap((day) => day.items.map((item) => item.content));
    const allDetails = result.days.flatMap((day) => day.items.flatMap((item) => item.detail ? [item.detail] : []));
    const joined = [...allContents, ...allDetails].join("\n");

    expect(result.days.map((day) => day.dayNo)).toEqual([1, 2, 3, 4]);
    expect(result.overview.travelPeriod.end).toBe(result.days[3]?.date);
    expect(allContents).toContain("인천 국제 공항 3층 집결 및 가이드 미팅");
    expect(allContents).toContain("인천 국제 공항 출발");
    expect(allContents.some((text) => text.includes("신치토세 공항 도착"))).toBe(true);
    expect(allContents).toContain("후라노 이동.");
    expect(allContents).toContain("인천 국제 공항 도착");
    expect(allContents).toContain("조잔케이 뷰 호텔 (2인1실/ 화실 또는 양실 기준)");
    expect(allContents).not.toContain("HOTEL");
    expect(joined).not.toContain("ATTN");
    expect(joined).not.toContain("FROM");
    expect(joined).not.toContain("[견적서]");
    expect(joined).not.toContain("[object Object]");
    expect(joined).not.toContain("https");
    expect(joined).not.toContain("TOUR FEE");
    expect(joined).not.toContain("참고 사항");
    expect(joined).not.toContain("8명 + 1");
    expect(joined).not.toContain("101000");
    expect(joined).not.toContain("현지 호텔은 미수배");
    expect(joined).not.toContain("해외여행자보험");
    expect(joined).not.toContain("환율은 변동");
  });
});

describe("parseItineraryByAi AI pipeline", () => {
  it("runs structural analysis before strict JSON generation and recalculates day dates on the server", async () => {
    process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "test-secret";
    process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./test.db";
    process.env.OPENAI_API_KEY = "test-key";
    vi.resetModules();

    const calls: string[] = [];
    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as {
        messages?: Array<{ role: string; content: string }>;
        response_format?: { type: string };
      };
      const lastMessage = body.messages?.[body.messages.length - 1]?.content ?? "";
      calls.push(lastMessage);

      if (!body.response_format) {
        return Response.json({
          choices: [
            {
              message: {
                content: `[AI 분석 결과]
상품명: 다낭 테스트 3일
출발일: 2026-06-02
기간: 2026-06-02 ~ 2026-06-04
요금: 성인 610000

[일차별 일정]
1일차 | TRANSFER | 인천공항 출발 |  | 10:00 |
2일차 | SIGHTSEEING | 아오이 이케 |  |  |
3일차 | TRANSFER | 인천공항 도착 |  | 20:00 |`,
              },
            },
          ],
        });
      }

      return Response.json({
        choices: [
          {
            message: {
              content: JSON.stringify({
                header: { groupName: null, writtenAt: null },
                overview: {
                  travelPeriod: { start: "2026-06-02", end: "2026-06-04" },
                  fare: { adultPerPerson: "610,000" },
                },
                basics: {
                  shoppingCenters: null,
                },
                days: [
                  {
                    dayNo: 1,
                    date: "1899-12-31",
                    items: [{ type: "TRANSFER", content: "인천공항 출발", time: "10:00" }],
                  },
                  {
                    dayNo: 2,
                    date: "1899-12-31",
                    items: [{ type: "SIGHTSEEING", content: "아오이 이케", detail: null }],
                  },
                  {
                    dayNo: 3,
                    date: "1899-12-31",
                    items: [{ type: "TRANSFER", content: "인천공항 도착", time: "20:00" }],
                  },
                ],
              }),
            },
          },
        ],
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { parseItineraryByAi } = await import("@/lib/itinerary/aiParser");
    const result = await parseItineraryByAi({
      rawText: "기간 2026-06-02 ~ 2026-06-04\n1일차 인천공항 출발\n2일차 아오이 이케 관광\n3일차 인천공항 도착",
      title: "다낭 테스트 3일",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(calls[0]).toContain("[원문]");
    expect(calls[1]).toContain("[AI 분석 결과]");
    expect(calls[1]).not.toContain("[원문]");
    expect(result.days.map((day) => day.date)).toEqual([
      "2026-06-02",
      "2026-06-03",
      "2026-06-04",
    ]);
    expect(result.overview.fare.adultPerPerson).toBe(610000);
    expect(result.basics.shoppingCenters).toBe(0);
    expect(result.days[1]?.items[0]?.content).toBe("아오이 이케");
  });

  it("supplements day-level hotels from fallback rows when AI omits later accommodation items", async () => {
    process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "test-secret";
    process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./test.db";
    process.env.OPENAI_API_KEY = "test-key";
    vi.resetModules();

    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as {
        response_format?: { type: string };
      };

      if (!body.response_format) {
        return Response.json({
          choices: [
            {
              message: {
                content: `[AI 분석 결과]
상품명: CTS 3박4일
출발일: 2026-02-28

[일차별 일정]
1일차 | TRANSFER | 인천 국제 공항 출발 |  | 12:35 |
1일차 | ACCOMMODATION | 조잔케이 뷰 호텔 |  |  |
2일차 | SIGHTSEEING | 후라노 이동 |  |  |
3일차 | SIGHTSEEING | 오타루 이동 |  |  |`,
              },
            },
          ],
        });
      }

      return Response.json({
        choices: [
          {
            message: {
              content: JSON.stringify({
                overview: { travelPeriod: { start: "2026-02-28", end: "2026-03-03" } },
                days: [
                  {
                    dayNo: 1,
                    items: [
                      { type: "TRANSFER", content: "인천 국제 공항 출발", time: "12:35" },
                      { type: "ACCOMMODATION", content: "조잔케이 뷰 호텔", hotel: "조잔케이 뷰 호텔" },
                    ],
                  },
                  { dayNo: 2, items: [{ type: "SIGHTSEEING", content: "후라노 이동" }] },
                  { dayNo: 3, items: [{ type: "SIGHTSEEING", content: "오타루 이동" }] },
                ],
              }),
            },
          },
        ],
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const rawText = `DATE|CITY|TRSFT|TIME|ITINERARY|MEALS
제1일|인천|BX|12:35|인천 국제 공항 출발|
||||HOTEL|조잔케이 뷰 호텔 (2인1실)
제2일|후라노|전용버스||후라노 이동|
||||HOTEL|소운쿄 다이세츠 호텔 (2인1실)
제3일|오타루|전용버스||오타루 이동|
||||HOTEL|삿포로 프린스 호텔 (2인1실)`;

    const { parseItineraryWithDiagnostics } = await import("@/lib/itinerary/aiParser");
    const result = await parseItineraryWithDiagnostics({ rawText, title: "CTS 3박4일" });
    const hotelByDay = new Map(
      result.itinerary.days.map((day) => [
        day.dayNo,
        day.items.filter((item) => item.type === "ACCOMMODATION").map((item) => item.hotel ?? item.content),
      ]),
    );

    expect(result.diagnostics.source).toBe("ai");
    expect(hotelByDay.get(1)?.join("\n")).toContain("조잔케이 뷰 호텔");
    expect(hotelByDay.get(2)?.join("\n")).toContain("소운쿄 다이세츠 호텔");
    expect(hotelByDay.get(3)?.join("\n")).toContain("삿포로 프린스 호텔");
  });
});
