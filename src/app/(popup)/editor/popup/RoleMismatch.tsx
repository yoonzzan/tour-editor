"use client";

import { signOut } from "next-auth/react";
import type { Role } from "@/types";

interface Props {
  requestedRole: Role | string;
  sessionRole: Role;
}

export function RoleMismatch({ requestedRole, sessionRole }: Props) {
  return (
    <div className="flex h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-sm">
        <h1 className="mb-3 text-base font-semibold text-destructive">
          권한이 없습니다.
        </h1>
        <p className="mb-4 text-sm text-muted-foreground">
          로그인 사용자 역할과 에디터 진입 역할이 일치하지 않습니다.
        </p>
        <div className="mb-5 rounded-md bg-muted px-3 py-2 text-left text-xs text-muted-foreground">
          <p>현재 로그인 역할: {sessionRole}</p>
          <p>요청한 진입 역할: {requestedRole}</p>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          다른 계정으로 로그인
        </button>
      </div>
    </div>
  );
}
