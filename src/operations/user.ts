import { z } from "zod";
import { defineOp, type Operation } from "./types.ts";

export const userOps: Operation[] = [
  defineOp({
    id: "user.get",
    group: "user",
    command: "get",
    summary: "Get the authenticated user (whoami)",
    args: z.object({}),
    run(ctx) {
      return ctx.client.getUser();
    },
  }),
];
