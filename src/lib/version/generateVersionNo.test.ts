// src/lib/version/generateVersionNo.test.ts — T-501 유닛 테스트
import { describe, it, expect } from "vitest";
import { generateVersionNo, INITIAL_VERSION } from "./generateVersionNo";

describe("generateVersionNo", () => {
  it("v1.0 → v1.1", () => {
    expect(generateVersionNo("v1.0")).toBe("v1.1");
  });

  it("v1.1 → v1.2", () => {
    expect(generateVersionNo("v1.1")).toBe("v1.2");
  });

  it("v1.8 → v1.9", () => {
    expect(generateVersionNo("v1.8")).toBe("v1.9");
  });

  it("경계값: v1.9 → v1.10 (패딩 없음)", () => {
    expect(generateVersionNo("v1.9")).toBe("v1.10");
  });

  it("v1.10 → v1.11", () => {
    expect(generateVersionNo("v1.10")).toBe("v1.11");
  });

  it("v1.99 → v1.100", () => {
    expect(generateVersionNo("v1.99")).toBe("v1.100");
  });

  it("major 2도 지원", () => {
    expect(generateVersionNo("v2.0")).toBe("v2.1");
  });

  it("유효하지 않은 형식 → 에러", () => {
    expect(() => generateVersionNo("1.0")).toThrow("유효하지 않은 버전 형식");
  });

  it("유효하지 않은 형식 — 빈 문자열 → 에러", () => {
    expect(() => generateVersionNo("")).toThrow("유효하지 않은 버전 형식");
  });

  it("유효하지 않은 형식 — v1 → 에러", () => {
    expect(() => generateVersionNo("v1")).toThrow("유효하지 않은 버전 형식");
  });
});

describe("INITIAL_VERSION", () => {
  it("v1.0", () => {
    expect(INITIAL_VERSION).toBe("v1.0");
  });
});
