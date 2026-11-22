import { describe, expect, it } from "vitest";

import { APP_FEE_KES } from "@/lib/pesapap-config";

describe("Pesa Pap fee configuration", () => {
  it("keeps the application processing fee at KSh 100", () => {
    expect(APP_FEE_KES).toBe(100);
  });
});