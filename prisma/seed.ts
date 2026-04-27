// prisma/seed.ts — 개발용 테스트 계정 3개 생성
// 비밀번호: password123 (SHA-256 해시)

import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

const db = new PrismaClient();

function hashPassword(plain: string): string {
  return createHash("sha256").update(plain).digest("hex");
}

const HASHED_PW = hashPassword("password123");

async function main() {
  const users = [
    { email: "partner@test.com", name: "협력사 테스트", role: "PARTNER" as const },
    { email: "agent@test.com",   name: "견적담당 테스트", role: "AGENT" as const },
    { email: "sales@test.com",   name: "영업담당 테스트", role: "SALES" as const },
  ];

  for (const u of users) {
    await db.user.upsert({
      where: { email: u.email },
      update: {},
      create: { email: u.email, name: u.name, role: u.role, password: HASHED_PW },
    });
  }
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
