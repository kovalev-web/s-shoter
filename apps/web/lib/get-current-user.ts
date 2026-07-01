import { jwtVerify } from "jose";
import { auth } from "@/auth";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET);

export async function getCurrentUserId(req: Request): Promise<string | null> {
  const session = await auth();
  if (session?.user?.id) return session.user.id;

  const header = req.headers.get("authorization");
  if (header?.startsWith("Bearer ")) {
    const token = header.slice("Bearer ".length);
    try {
      const { payload } = await jwtVerify(token, secret);
      return typeof payload.sub === "string" ? payload.sub : null;
    } catch {
      return null;
    }
  }

  return null;
}
