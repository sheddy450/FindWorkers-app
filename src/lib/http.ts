import { NextResponse } from "next/server";
export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
export function handle(fn: (req: Request, ctx: any) => Promise<Response>) {
  return async (req: Request, ctx: any) => {
    try {
      // Next 15+ passes route params as a Promise (`ctx.params`), not a plain object. Resolving it
      // once here — instead of in every single route file — means every handler below can keep
      // writing `params.id` synchronously, as if this were still the old, simpler API.
      const resolvedCtx = ctx?.params && typeof ctx.params.then === "function" ? { ...ctx, params: await ctx.params } : ctx;
      return await fn(req, resolvedCtx);
    }
    catch (e) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
      console.error(e);
      return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
    }
  };
}
