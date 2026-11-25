import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

describe("App routing", () => {
  it.each(["/", "/eligibility", "/loan-now", "/admin", "/testimonials", "/contact"])(
    "matches route %s instead of falling back to not found",
    (path) => {
      const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
      const matches = router.matchRoutes(path);
      expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
    },
  );

  it("does not match the removed customer dashboard route", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const matches = router.matchRoutes("/dashboard");
    expect(matches.at(-1)?.routeId).toBe(rootRouteId);
  });
});
