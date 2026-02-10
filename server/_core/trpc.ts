import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  // Accept either OAuth user or platform user
  if (!ctx.user && !ctx.platformUser) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      platformUser: ctx.platformUser,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    // Check platform user admin roles
    if (ctx.platformUser) {
      const adminRoles = ["root_admin", "director", "vice_president", "manager"];
      if (adminRoles.includes(ctx.platformUser.platformRole)) {
        return next({ ctx });
      }
    }

    // Check OAuth user admin role
    if (ctx.user && ctx.user.role === 'admin') {
      return next({ ctx });
    }

    // Neither is admin
    if (!ctx.user && !ctx.platformUser) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }

    throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
  }),
);
