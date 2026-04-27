import { describe, expect, it } from "vitest";
import {
  mergeScheduleContent,
  splitMcpScheduleContent,
  splitStructuredScheduleContent,
} from "@/lib/itinerary/contentDetail";

describe("content/detail helpers", () => {
  it("splits MCP hyphen titles into content and detail", () => {
    expect(
      splitMcpScheduleContent("인천출발 - 인천 공항 가이드 미팅 출국 3시간 전 인천공항 미팅 예정")
    ).toEqual({
      content: "인천출발",
      detail: "인천 공항 가이드 미팅 출국 3시간 전 인천공항 미팅 예정",
    });
  });

  it("splits clear structured colon text but keeps long prefixes intact", () => {
    expect(splitStructuredScheduleContent("가이드 미팅: 공항 입국장 앞")).toEqual({
      content: "가이드 미팅",
      detail: "공항 입국장 앞",
    });
    expect(
      splitStructuredScheduleContent("가이드 미팅과 수하물 확인이 모두 끝난 후: 차량으로 이동")
    ).toEqual({
      content: "가이드 미팅과 수하물 확인이 모두 끝난 후",
      detail: "차량으로 이동",
    });
  });

  it("merges content and detail without losing either side", () => {
    expect(mergeScheduleContent("인천출발", "공항 미팅")).toBe("인천출발 - 공항 미팅");
  });
});
