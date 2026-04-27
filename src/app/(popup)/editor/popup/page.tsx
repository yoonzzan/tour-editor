// T-101: 팝업 진입 라우트
// T-102: URL 파라미터 파싱 + 유효성 검증
// 접근: window.open('/editor/popup?quoteNo=QC00687628001&role=agent')

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { EditorShell } from "./EditorShell";
import { RoleMismatch } from "./RoleMismatch";
import { Role } from "@/types";

const VALID_ROLES: Role[] = [Role.PARTNER, Role.AGENT, Role.SALES];

interface Props {
  searchParams: Promise<{ quoteNo?: string; role?: string }>;
}

export default async function PopupPage({ searchParams }: Props) {
  const params = await searchParams;
  const quoteNo = params.quoteNo?.trim();
  const roleParam = params.role?.trim();

  // 인증 체크 — 미로그인 시 현재 팝업 URL을 callbackUrl로 보존
  const session = await auth();
  if (!session?.user) {
    const callbackUrl = `/editor/popup?${new URLSearchParams({
      ...(quoteNo ? { quoteNo } : {}),
      ...(roleParam ? { role: roleParam } : {}),
    }).toString()}`;
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  // quoteNo 필수
  if (!quoteNo) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-destructive">
          quoteNo 파라미터가 없습니다. 올바른 URL로 다시 접근하세요.
        </p>
      </div>
    );
  }

  // 역할: URL role은 Hub 진입 컨텍스트 검증용으로만 사용한다.
  // 클라이언트 전달 role을 신뢰해 권한을 상승시키면 안 되므로 세션 role과 다르면 차단한다.
  const sessionRole = session.user.role;
  const urlRole = roleParam?.toUpperCase() as Role | undefined;

  if (urlRole && (!VALID_ROLES.includes(urlRole) || urlRole !== sessionRole)) {
    return <RoleMismatch requestedRole={urlRole} sessionRole={sessionRole} />;
  }

  return <EditorShell quoteNo={quoteNo} role={sessionRole} />;
}
