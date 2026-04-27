import type { JWT } from "@auth/core/jwt";
import { Role } from "@/types";
import { db } from "@/lib/db";

type AccessRole = Role.PARTNER | Role.AGENT | Role.SALES;

export class QuoteAccessError extends Error {
  constructor(
    public readonly status: 401 | 403 | 404,
    message: string
  ) {
    super(message);
    this.name = "QuoteAccessError";
  }
}

export interface QuoteAccessContext {
  userId: string;
  role: AccessRole;
  quote: {
    id: string;
    quoteCode: string;
    latestVersion: string;
    bid: {
      id: string;
      partnerId: string;
      agentId: string | null;
      salesId: string | null;
    };
  };
}

function parseRole(value: unknown): AccessRole | null {
  if (value === Role.PARTNER || value === Role.AGENT || value === Role.SALES) {
    return value;
  }
  return null;
}

function assertAuthenticated(token: JWT | null): { userId: string; role: AccessRole } {
  if (!token?.sub) {
    throw new QuoteAccessError(401, "인증이 필요합니다.");
  }

  const role = parseRole(token.role);
  if (!role) {
    throw new QuoteAccessError(403, "역할 정보가 유효하지 않습니다.");
  }

  return { userId: token.sub, role };
}

function isAssignedUser(context: QuoteAccessContext): boolean {
  const { userId, role, quote } = context;

  if (role === Role.PARTNER) {
    return quote.bid.partnerId === userId;
  }
  if (role === Role.AGENT) {
    return quote.bid.agentId === userId;
  }
  return quote.bid.salesId === userId;
}

function assertAssignedUser(context: QuoteAccessContext): QuoteAccessContext {
  if (!isAssignedUser(context)) {
    throw new QuoteAccessError(403, "권한이 없습니다.");
  }
  return context;
}

export function toQuoteAccessResponse(error: QuoteAccessError) {
  return { error: error.message };
}

export async function assertQuoteAccessByQuoteNo(
  token: JWT | null,
  quoteCode: string
): Promise<QuoteAccessContext | null> {
  const user = assertAuthenticated(token);
  const quote = await db.quote.findUnique({
    where: { quoteCode },
    select: {
      id: true,
      quoteCode: true,
      latestVersion: true,
      bid: {
        select: {
          id: true,
          partnerId: true,
          agentId: true,
          salesId: true,
        },
      },
    },
  });

  if (!quote) return null;

  return assertAssignedUser({ ...user, quote });
}

export async function assertQuoteAccessByQuoteId(
  token: JWT | null,
  quoteId: string
): Promise<QuoteAccessContext> {
  const user = assertAuthenticated(token);
  const quote = await db.quote.findUnique({
    where: { id: quoteId },
    select: {
      id: true,
      quoteCode: true,
      latestVersion: true,
      bid: {
        select: {
          id: true,
          partnerId: true,
          agentId: true,
          salesId: true,
        },
      },
    },
  });

  if (!quote) {
    throw new QuoteAccessError(404, "견적을 찾을 수 없습니다.");
  }

  return assertAssignedUser({ ...user, quote });
}
