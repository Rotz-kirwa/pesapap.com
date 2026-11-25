import { describe, expect, it } from "vitest";

import {
  buildDarajaB2CRefundPayload,
  buildDarajaStkPushPayload,
  inspectDarajaConfig,
  parseDarajaStkCallback,
  verifyCallbackToken,
} from "@/lib/lending/daraja";

describe("Safaricom Daraja integration architecture", () => {
  it("keeps live payments disabled by default when credentials or live flag are absent", () => {
    const status = inspectDarajaConfig({});
    expect(status.mode).toBe("DEMO_ONLY");
    expect(status.livePaymentsEnabled).toBe(false);
    expect(status.missingVariables.length).toBeGreaterThan(0);
  });

  it("requires both STK and operational B2C refund credentials before LIVE_READY", () => {
    const partial = inspectDarajaConfig({
      DARAJA_LIVE_ENABLED: "true",
      DARAJA_CONSUMER_KEY: "k",
      DARAJA_CONSUMER_SECRET: "s",
      DARAJA_SHORTCODE: "174379",
      DARAJA_PASSKEY: "p",
      DARAJA_CALLBACK_URL: "https://example.com/cb",
      DARAJA_CALLBACK_SECRET: "sec",
    });
    expect(partial.stkConfigured).toBe(true);
    expect(partial.b2cRefundConfigured).toBe(false);
    expect(partial.livePaymentsEnabled).toBe(false);
    expect(partial.mode).toBe("DEMO_ONLY");
  });

  it("builds exact KSh 100 STK Push payload with normalized 254 MSISDN and rejects invalid amounts", () => {
    const payload = buildDarajaStkPushPayload({
      shortCode: "174379",
      passkey: "test-passkey",
      callbackUrl: "https://example.com/api/daraja/stk-callback",
      phone: "0712 345 678",
      transactionReference: "PP-DEP-1001",
      timestamp: "20261124120000",
    });

    expect(payload.Amount).toBe(100);
    expect(payload.PhoneNumber).toBe("254712345678");
    expect(payload.PartyA).toBe("254712345678");

    expect(() =>
      buildDarajaStkPushPayload({
        shortCode: "174379",
        passkey: "test-passkey",
        callbackUrl: "https://example.com/api/daraja/stk-callback",
        phone: "0712345678",
        transactionReference: "PP-DEP-1002",
        amountKes: 250,
      }),
    ).toThrow(/exactly KSh 100/i);
  });

  it("parses Daraja STK callbacks and rejects mismatched deposit amounts", () => {
    const ok = parseDarajaStkCallback({
      Body: {
        stkCallback: {
          MerchantRequestID: "MR-1",
          CheckoutRequestID: "ws_CO_1",
          ResultCode: 0,
          ResultDesc: "Success",
          CallbackMetadata: {
            Item: [
              { Name: "Amount", Value: 100 },
              { Name: "MpesaReceiptNumber", Value: "QWE999" },
            ],
          },
        },
      },
    });
    expect(ok.succeeded).toBe(true);
    expect(ok.mpesaReceiptNumber).toBe("QWE999");

    const mismatch = parseDarajaStkCallback({
      Body: {
        stkCallback: {
          MerchantRequestID: "MR-2",
          CheckoutRequestID: "ws_CO_2",
          ResultCode: 0,
          ResultDesc: "Success",
          CallbackMetadata: {
            Item: [
              { Name: "Amount", Value: 50 },
              { Name: "MpesaReceiptNumber", Value: "QWE888" },
            ],
          },
        },
      },
    });
    expect(mismatch.succeeded).toBe(false);
  });

  it("builds exact KSh 100 B2C refund payloads and validates callback tokens", () => {
    const refundPayload = buildDarajaB2CRefundPayload({
      initiatorName: "pesapap_refund",
      securityCredential: "encrypted-cred",
      shortCode: "174379",
      destinationMsisdn: "+254 722 111 222",
      refundReference: "PP-REF-1005",
      queueTimeoutUrl: "https://example.com/api/daraja/b2c-timeout",
      resultUrl: "https://example.com/api/daraja/b2c-result",
    });
    expect(refundPayload.Amount).toBe(100);
    expect(refundPayload.PartyB).toBe("254722111222");

    expect(verifyCallbackToken("abc123", "abc123")).toBe(true);
    expect(verifyCallbackToken("abc123", "abc124")).toBe(false);
    expect(verifyCallbackToken(undefined, "abc123")).toBe(false);
  });
});
