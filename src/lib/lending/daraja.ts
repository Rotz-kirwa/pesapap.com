import { APP_FEE_KES, normalizeKenyanPhone } from "@/lib/pesapap-config";

/**
 * Safaricom Daraja API integration module (server-only configuration surface).
 *
 * Security & Compliance rules:
 * 1. Credentials are read ONLY from server environment variables — never bundled into client code.
 * 2. Live M-Pesa STK Push collection stays disabled unless DARAJA_LIVE_ENABLED === "true" AND all
 *    required Safaricom credentials + operational B2C refund credentials are configured.
 * 3. M-Pesa PINs are NEVER accepted, logged, or stored anywhere in this codebase.
 */

export interface DarajaConfigStatus {
  environment: "sandbox" | "production";
  stkConfigured: boolean;
  b2cRefundConfigured: boolean;
  livePaymentsEnabled: boolean;
  mode: "DEMO_ONLY" | "LIVE_READY";
  missingVariables: string[];
}

const REQUIRED_STK_ENV_KEYS = [
  "DARAJA_CONSUMER_KEY",
  "DARAJA_CONSUMER_SECRET",
  "DARAJA_SHORTCODE",
  "DARAJA_PASSKEY",
  "DARAJA_CALLBACK_URL",
  "DARAJA_CALLBACK_SECRET",
] as const;

const REQUIRED_B2C_REFUND_ENV_KEYS = [
  "DARAJA_B2C_INITIATOR_NAME",
  "DARAJA_B2C_SECURITY_CREDENTIAL",
  "DARAJA_B2C_RESULT_URL",
  "DARAJA_B2C_TIMEOUT_URL",
] as const;

export function inspectDarajaConfig(env: Record<string, string | undefined>): DarajaConfigStatus {
  const missingStk = REQUIRED_STK_ENV_KEYS.filter((key) => !env[key]?.trim());
  const missingB2c = REQUIRED_B2C_REFUND_ENV_KEYS.filter((key) => !env[key]?.trim());
  const stkConfigured = missingStk.length === 0;
  const b2cRefundConfigured = missingB2c.length === 0;
  const environment = env["DARAJA_ENV"] === "production" ? "production" : "sandbox";
  const liveFlag = env["DARAJA_LIVE_ENABLED"] === "true";
  const livePaymentsEnabled = liveFlag && stkConfigured && b2cRefundConfigured;

  return {
    environment,
    stkConfigured,
    b2cRefundConfigured,
    livePaymentsEnabled,
    mode: livePaymentsEnabled ? "LIVE_READY" : "DEMO_ONLY",
    missingVariables: [...missingStk, ...missingB2c],
  };
}

export function formatDarajaTimestamp(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    String(date.getUTCFullYear()) +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds())
  );
}

export interface DarajaStkPushRequest {
  BusinessShortCode: string;
  Password: string;
  Timestamp: string;
  TransactionType: "CustomerPayBillOnline";
  Amount: number;
  PartyA: string;
  PartyB: string;
  PhoneNumber: string;
  CallBackURL: string;
  AccountReference: string;
  TransactionDesc: string;
}

export function buildDarajaStkPushPayload(params: {
  shortCode: string;
  passkey: string;
  callbackUrl: string;
  phone: string;
  transactionReference: string;
  amountKes?: number;
  timestamp?: string;
}): DarajaStkPushRequest {
  const amount = params.amountKes ?? APP_FEE_KES;
  if (amount !== APP_FEE_KES) {
    throw new Error(`Deposit STK Push amount must be exactly KSh ${APP_FEE_KES}.`);
  }

  const msisdn = normalizeKenyanPhone(params.phone);
  if (!msisdn) {
    throw new Error("Invalid Kenyan M-Pesa phone number.");
  }

  const timestamp = params.timestamp ?? formatDarajaTimestamp();
  const password = encodeBase64(`${params.shortCode}${params.passkey}${timestamp}`);

  return {
    BusinessShortCode: params.shortCode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: APP_FEE_KES,
    PartyA: msisdn,
    PartyB: params.shortCode,
    PhoneNumber: msisdn,
    CallBackURL: params.callbackUrl,
    AccountReference: params.transactionReference.slice(0, 12),
    TransactionDesc: "Pesa Pap Refundable Deposit",
  };
}

export interface DarajaStkCallbackRaw {
  Body?: {
    stkCallback?: {
      MerchantRequestID?: string;
      CheckoutRequestID?: string;
      ResultCode?: number;
      ResultDesc?: string;
      CallbackMetadata?: {
        Item?: Array<{ Name?: string; Value?: string | number }>;
      };
    };
  };
}

export interface ParsedDarajaStkCallback {
  callbackId: string;
  merchantRequestId: string;
  checkoutRequestId: string;
  resultCode: number;
  resultDesc: string;
  succeeded: boolean;
  amountKes?: number;
  mpesaReceiptNumber?: string;
  phoneMsisdn?: string;
}

export function parseDarajaStkCallback(raw: DarajaStkCallbackRaw): ParsedDarajaStkCallback {
  const cb = raw?.Body?.stkCallback;
  if (!cb || typeof cb.CheckoutRequestID !== "string" || typeof cb.ResultCode !== "number") {
    throw new Error("Malformed Safaricom Daraja STK callback payload.");
  }

  const items = cb.CallbackMetadata?.Item ?? [];
  const getMeta = (name: string) => items.find((item) => item.Name === name)?.Value;

  const amountVal = getMeta("Amount");
  const receiptVal = getMeta("MpesaReceiptNumber");
  const phoneVal = getMeta("PhoneNumber");

  const amountKes = typeof amountVal === "number" ? amountVal : Number(amountVal);
  const mpesaReceiptNumber = typeof receiptVal === "string" ? receiptVal.trim() : undefined;
  const phoneMsisdn = phoneVal !== undefined ? String(phoneVal) : undefined;

  const succeeded = cb.ResultCode === 0 && amountKes === APP_FEE_KES && Boolean(mpesaReceiptNumber);

  return {
    callbackId: `${cb.CheckoutRequestID}:${cb.ResultCode}:${mpesaReceiptNumber ?? "none"}`,
    merchantRequestId: cb.MerchantRequestID ?? "",
    checkoutRequestId: cb.CheckoutRequestID,
    resultCode: cb.ResultCode,
    resultDesc: cb.ResultDesc ?? (succeeded ? "Success" : "Payment failed"),
    succeeded,
    ...(Number.isFinite(amountKes) ? { amountKes } : {}),
    ...(mpesaReceiptNumber ? { mpesaReceiptNumber } : {}),
    ...(phoneMsisdn ? { phoneMsisdn } : {}),
  };
}

export interface DarajaB2CRefundRequest {
  InitiatorName: string;
  SecurityCredential: string;
  CommandID: "BusinessPayment";
  Amount: number;
  PartyA: string;
  PartyB: string;
  Remarks: string;
  QueueTimeOutURL: string;
  ResultURL: string;
  Occasion: string;
}

export function buildDarajaB2CRefundPayload(params: {
  initiatorName: string;
  securityCredential: string;
  shortCode: string;
  destinationMsisdn: string;
  refundReference: string;
  queueTimeoutUrl: string;
  resultUrl: string;
  amountKes?: number;
}): DarajaB2CRefundRequest {
  const amount = params.amountKes ?? APP_FEE_KES;
  if (amount !== APP_FEE_KES) {
    throw new Error(`Refund amount must be exactly KSh ${APP_FEE_KES}.`);
  }

  const msisdn = normalizeKenyanPhone(params.destinationMsisdn);
  if (!msisdn) {
    throw new Error("Invalid refund destination M-Pesa phone number.");
  }

  return {
    InitiatorName: params.initiatorName,
    SecurityCredential: params.securityCredential,
    CommandID: "BusinessPayment",
    Amount: APP_FEE_KES,
    PartyA: params.shortCode,
    PartyB: msisdn,
    Remarks: `Pesa Pap deposit refund ${params.refundReference}`,
    QueueTimeOutURL: params.queueTimeoutUrl,
    ResultURL: params.resultUrl,
    Occasion: params.refundReference,
  };
}

export function verifyCallbackToken(provided: string | undefined, expected: string | undefined) {
  if (!provided || !expected || provided.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < provided.length; i += 1) {
    mismatch |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

function encodeBase64(input: string): string {
  if (typeof btoa === "function") {
    return btoa(input);
  }
  return Buffer.from(input, "utf8").toString("base64");
}
