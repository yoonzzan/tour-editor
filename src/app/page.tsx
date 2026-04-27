import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Role } from "@/types";

function toEditorRoleParam(role: Role | undefined): string {
  return (role ?? Role.AGENT).toLowerCase();
}

export default async function Home() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const role = session.user?.role as Role | undefined;
  const editorUrl = `/editor/popup?quoteNo=QCE2ETEST001&role=${toEditorRoleParam(role)}`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-sm text-center">
        <h1 className="mb-4 text-xl font-semibold text-foreground">
          견적·일정 에디터
        </h1>
        <p className="mb-2 text-sm text-muted-foreground">
          {session.user?.name} ({session.user?.email}) 로그인됨
        </p>
        <p className="text-sm text-muted-foreground">
          에디터는 하나투어 시스템의 견적서 상세 화면에서
          팝업으로 실행됩니다.
        </p>
        <a
          href={editorUrl}
          className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          개발용 테스트 견적 열기
        </a>
        <p className="mt-3 text-xs text-muted-foreground">
          테스트 견적: QCE2ETEST001
        </p>
      </div>
    </main>
  );
}
