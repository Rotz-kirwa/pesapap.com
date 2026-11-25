import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import { DemoNotice, StatusPill } from "@/components/pesapap/site";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDemoLendingStore } from "@/lib/lending/demo-store";
import { LendingDomainError } from "@/lib/lending/service";
import { LOAN_STATUS_LABELS, type ReconciliationResult } from "@/lib/lending/types";
import { formatKes, maskKenyanPhone } from "@/lib/pesapap-config";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Operations (Demo Sandbox) | Pesa Pap" },
      {
        name: "description",
        content:
          "Administrator queue for underwriting review, KSh 100 deposit tracking, automatic and manual refunds, reconciliation, and audit logs.",
      },
      { property: "og:title", content: "Admin Operations (Demo Sandbox) | Pesa Pap" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const store = useDemoLendingStore();
  const snapshot = store.getAdminDashboard();
  const [feedback, setFeedback] = useState<{ tone: "info" | "error"; text: string } | null>(null);
  const [reconciliationMap, setReconciliationMap] = useState<Record<string, ReconciliationResult>>(
    {},
  );

  function runAction(fn: () => string) {
    setFeedback(null);
    try {
      const message = fn();
      setFeedback({ tone: "info", text: message });
    } catch (caught) {
      if (caught instanceof LendingDomainError) {
        setFeedback({ tone: "error", text: caught.message });
      } else {
        setFeedback({ tone: "error", text: "Operation failed." });
      }
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-brand-line bg-brand-ink text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-wide text-brand-green">
                <ShieldCheck aria-hidden="true" className="size-3.5" /> Administrator Operations ·
                Demo Sandbox
              </p>
              <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">
                Underwriting, Deposits, Refunds &amp; Audit Ledger
              </h1>
            </div>
            <StatusPill label="DEMO RBAC SANDBOX" tone="warning" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <DemoNotice>
          DEMO SANDBOX ONLY: In production, this workspace must sit behind server-verified
          administrator authentication and RBAC middleware. Callback simulation controls exist
          strictly to test verified Daraja callback idempotency and automatic KSh 100 refund flows.
        </DemoNotice>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Applications", value: snapshot.metrics.totalApplications },
            { label: "Under Review Queue", value: snapshot.metrics.inReviewQueue },
            {
              label: "Verified KSh 100 Deposits",
              value: `${snapshot.metrics.paidDepositsCount} paid / ${snapshot.metrics.pendingDepositsCount} pending`,
            },
            {
              label: "Deposit Refunds",
              value: `${snapshot.metrics.completedRefundsCount} done / ${snapshot.metrics.pendingOrProcessingRefundsCount} active / ${snapshot.metrics.failedRefundsCount} failed`,
            },
          ].map((metric) => (
            <div
              key={metric.label}
              className="rounded-lg border border-brand-line bg-background p-4 shadow-sm"
            >
              <p className="text-xs text-muted-foreground">{metric.label}</p>
              <p className="mt-1 font-display text-lg font-bold text-brand-forest">
                {metric.value}
              </p>
            </div>
          ))}
        </div>

        {feedback && (
          <div
            role="status"
            className={`mt-4 flex items-center gap-2 rounded-md border px-4 py-3 text-sm ${
              feedback.tone === "error"
                ? "border-destructive/40 bg-destructive/5 text-destructive"
                : "border-brand-green/50 bg-brand-mint text-brand-forest"
            }`}
          >
            {feedback.tone === "error" ? (
              <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
            ) : (
              <CheckCircle2 aria-hidden="true" className="size-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        <Tabs defaultValue="queue" className="mt-6">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:inline-flex sm:h-9 sm:w-auto">
            <TabsTrigger value="queue">Applications ({snapshot.applications.length})</TabsTrigger>
            <TabsTrigger value="preliminary">
              Preliminary requests ({snapshot.preliminaryRequests.length})
            </TabsTrigger>
            <TabsTrigger value="deposits">Deposits ({snapshot.deposits.length})</TabsTrigger>
            <TabsTrigger value="refunds">Refunds ({snapshot.refunds.length})</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs ({snapshot.auditLogs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="queue" className="mt-5 space-y-4">
            {snapshot.applications.length === 0 ? (
              <EmptyAdminState text="No loan applications submitted yet. Submit an application on /loan-now to exercise the full review and automatic refund workflow." />
            ) : (
              snapshot.applications.map(
                ({ application, assessment, deposit, refund, disbursement }) => (
                  <article
                    key={application.id}
                    className="rounded-lg border border-brand-line bg-background p-4 shadow-sm sm:p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-bold text-brand-forest">
                            {application.id}
                          </span>
                          <StatusPill label={LOAN_STATUS_LABELS[application.status]} tone="info" />
                          <StatusPill
                            label={`Deposit: ${deposit?.status ?? "NOT_INITIATED"}`}
                            tone={deposit?.status === "PAID" ? "success" : "warning"}
                          />
                          {refund && (
                            <StatusPill
                              label={`Refund: ${refund.status}`}
                              tone={refund.status === "COMPLETED" ? "success" : "info"}
                            />
                          )}
                        </div>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {application.applicantName} · {maskKenyanPhone(application.phoneMsisdn)} ·{" "}
                          {formatKes(application.requestedAmountKes)} ({application.durationDays}d)
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Income {formatKes(application.monthlyIncomeKes)} · Obligations{" "}
                          {formatKes(application.existingMonthlyObligationsKes)} · DTI{" "}
                          {Math.round(assessment.repaymentToIncomeRatio * 100)}% (
                          {assessment.affordabilityBand})
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {application.status !== "APPROVED" && application.status !== "REJECTED" && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              disabled={deposit?.status !== "PAID"}
                              onClick={() =>
                                runAction(() => {
                                  const res = store.adminReviewApplication({
                                    applicationId: application.id,
                                    decision: "APPROVED",
                                    notes: "Verified income and affordability checks passed.",
                                  });
                                  return `Approved ${application.id}. Automatic KSh 100 refund ${res.refund?.refundReference ?? ""} initiated (awaiting confirmation).`;
                                })
                              }
                            >
                              <ClipboardCheck className="size-3.5" /> Approve (+ Auto Refund)
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={deposit?.status !== "PAID"}
                              onClick={() =>
                                runAction(() => {
                                  const res = store.adminReviewApplication({
                                    applicationId: application.id,
                                    decision: "REJECTED",
                                    notes: "Declined per underwriting affordability review.",
                                  });
                                  return `Rejected ${application.id}. Automatic KSh 100 refund ${res.refund?.refundReference ?? ""} initiated (awaiting confirmation).`;
                                })
                              }
                            >
                              Reject (+ Auto Refund)
                            </Button>
                            <Button
                              size="sm"
                              variant="outlineBrand"
                              disabled={deposit?.status !== "PAID"}
                              onClick={() =>
                                runAction(() => {
                                  store.adminReviewApplication({
                                    applicationId: application.id,
                                    decision: "ADDITIONAL_INFO_REQUIRED",
                                    notes: "Please supply recent 3-month bank/M-Pesa statements.",
                                  });
                                  return `Marked ${application.id} as Additional Information Required.`;
                                })
                              }
                            >
                              Request Info
                            </Button>
                          </>
                        )}

                        {refund?.status === "PROCESSING" && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() =>
                              runAction(() => {
                                const updated = store.simulateDemoRefundCallback({
                                  refundReference: refund.refundReference,
                                  succeeded: true,
                                });
                                return `Demo KSh 100 refund ${updated.refundReference} confirmed COMPLETED (${updated.mpesaRefundReceiptNumber}). Customer application record updated.`;
                              })
                            }
                          >
                            <RefreshCw className="size-3.5" /> Confirm KSh 100 Demo Refund
                          </Button>
                        )}

                        {application.status === "APPROVED" && !disbursement && (
                          <Button
                            size="sm"
                            variant="accent"
                            onClick={() =>
                              runAction(() => {
                                const rec = store.adminRecordVerifiedDisbursement({
                                  applicationId: application.id,
                                  providerReference: `DEMO-DISB-${application.id.slice(-4)}`,
                                  verified: true,
                                });
                                return `Recorded verified demo disbursement ${rec.id} (${rec.providerReference}).`;
                              })
                            }
                          >
                            Record Verified Disbursement (Demo)
                          </Button>
                        )}
                      </div>
                    </div>
                  </article>
                ),
              )
            )}
          </TabsContent>

          <TabsContent value="preliminary" className="mt-5 space-y-4">
            {snapshot.preliminaryRequests.length === 0 ? (
              <EmptyAdminState text="No preliminary requests submitted yet." />
            ) : (
              snapshot.preliminaryRequests.map((request) => (
                <article
                  key={request.id}
                  className="rounded-lg border border-brand-line bg-background p-4 shadow-sm sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-bold text-brand-forest">
                          {request.id}
                        </span>
                        <StatusPill label="Awaiting full application" tone="info" />
                      </div>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {request.applicantName} · {maskKenyanPhone(request.phoneMsisdn)} ·{" "}
                        {request.loanCategory} · {formatKes(request.minimumAmountKes)}–
                        {formatKes(request.maximumAmountKes)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        National ID ending {request.nationalIdLast4} ·{" "}
                        {new Date(request.createdAt).toLocaleDateString("en-KE")}
                      </p>
                    </div>
                  </div>
                </article>
              ))
            )}
          </TabsContent>

          <TabsContent value="deposits" className="mt-5 space-y-4">
            {snapshot.deposits.length === 0 ? (
              <EmptyAdminState text="No KSh 100 deposits recorded yet." />
            ) : (
              snapshot.deposits.map((deposit) => {
                const recon = reconciliationMap[deposit.id];
                return (
                  <article
                    key={deposit.id}
                    className="rounded-lg border border-brand-line bg-background p-4 shadow-sm sm:p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-bold text-brand-forest">
                            {deposit.transactionReference}
                          </span>
                          <StatusPill
                            label={deposit.status}
                            tone={
                              deposit.status === "PAID"
                                ? "success"
                                : deposit.status === "FAILED"
                                  ? "danger"
                                  : "warning"
                            }
                          />
                        </div>
                        <p className="text-foreground">
                          Application <span className="font-mono">{deposit.applicationId}</span> ·{" "}
                          {formatKes(deposit.amountKes)} · {maskKenyanPhone(deposit.phoneMsisdn)}
                        </p>
                        <p className="text-muted-foreground">
                          CheckoutID: <span className="font-mono">{deposit.checkoutRequestId}</span>
                          {deposit.mpesaReceiptNumber && (
                            <>
                              {" "}
                              · Receipt:{" "}
                              <span className="font-mono font-bold text-brand-forest">
                                {deposit.mpesaReceiptNumber}
                              </span>
                            </>
                          )}
                        </p>
                        {deposit.failureReason && (
                          <p className="text-destructive">Failure: {deposit.failureReason}</p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {deposit.status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() =>
                                runAction(() => {
                                  const res = store.simulateDemoDepositCallback({
                                    checkoutRequestId: deposit.checkoutRequestId,
                                    succeeded: true,
                                  });
                                  return res.duplicateIgnored
                                    ? "Duplicate callback safely ignored."
                                    : `Demo Daraja callback verified PAID (${res.deposit.mpesaReceiptNumber}); ${res.application.id} moved to UNDER REVIEW.`;
                                })
                              }
                            >
                              Simulate Verified Callback (Demo)
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                runAction(() => {
                                  store.simulateDemoDepositCallback({
                                    checkoutRequestId: deposit.checkoutRequestId,
                                    succeeded: false,
                                    failureReason: "Simulated insufficient balance / cancelled",
                                  });
                                  return `Deposit ${deposit.transactionReference} marked FAILED via demo callback.`;
                                })
                              }
                            >
                              Simulate Failed Callback
                            </Button>
                          </>
                        )}
                        {deposit.status === "PAID" && (
                          <>
                            <Button
                              size="sm"
                              variant="outlineBrand"
                              onClick={() =>
                                runAction(() => {
                                  const ref = store.adminInitiateManualRefund({
                                    depositId: deposit.id,
                                    reason: "Authorized manual administrator refund",
                                  });
                                  return `Manual refund ${ref.refundReference} initiated (status: ${ref.status}).`;
                                })
                              }
                            >
                              Manual Refund
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                runAction(() => {
                                  const result = store.adminReconcileDeposit(deposit.id);
                                  setReconciliationMap((curr) => ({
                                    ...curr,
                                    [deposit.id]: result,
                                  }));
                                  return result.isConsistent
                                    ? `Reconciliation passed for ${deposit.id}.`
                                    : `Reconciliation found ${result.issues.length} issue(s) for ${deposit.id}.`;
                                })
                              }
                            >
                              Reconcile
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {recon && (
                      <div
                        className={`mt-3 rounded-md p-3 text-xs ${
                          recon.isConsistent
                            ? "bg-brand-mint text-brand-forest"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        <strong>
                          Reconciliation ({recon.isConsistent ? "Consistent" : "Discrepancy"}):
                        </strong>{" "}
                        {recon.isConsistent
                          ? "Deposit and refund ledger entries are consistent."
                          : recon.issues.join(" ")}
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="refunds" className="mt-5 space-y-4">
            {snapshot.refunds.length === 0 ? (
              <EmptyAdminState text="No refunds initiated yet. Refunds initiate automatically when a PAID application is approved or rejected." />
            ) : (
              snapshot.refunds.map((refund) => (
                <article
                  key={refund.id}
                  className="rounded-lg border border-brand-line bg-background p-4 shadow-sm sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-bold text-brand-forest">
                          {refund.refundReference}
                        </span>
                        <StatusPill
                          label={refund.status}
                          tone={
                            refund.status === "COMPLETED"
                              ? "success"
                              : refund.status === "FAILED"
                                ? "danger"
                                : "info"
                          }
                        />
                        <span className="text-muted-foreground">({refund.triggerReason})</span>
                      </div>
                      <p className="text-foreground">
                        {formatKes(refund.amountKes)} → {maskKenyanPhone(refund.destinationMsisdn)}{" "}
                        · Application <span className="font-mono">{refund.applicationId}</span> ·
                        Retries: {refund.retryCount}
                      </p>
                      {refund.mpesaRefundReceiptNumber && (
                        <p className="font-mono font-bold text-brand-forest">
                          Confirmed Receipt: {refund.mpesaRefundReceiptNumber}
                        </p>
                      )}
                      {refund.failureReason && (
                        <p className="flex items-center gap-1 text-destructive">
                          <ShieldAlert className="size-3.5" /> {refund.failureReason}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {refund.status === "PROCESSING" && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() =>
                              runAction(() => {
                                const updated = store.simulateDemoRefundCallback({
                                  refundReference: refund.refundReference,
                                  succeeded: true,
                                });
                                return `Refund ${updated.refundReference} confirmed COMPLETED (${updated.mpesaRefundReceiptNumber}).`;
                              })
                            }
                          >
                            Confirm Refund Callback (Demo)
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              runAction(() => {
                                store.simulateDemoRefundCallback({
                                  refundReference: refund.refundReference,
                                  succeeded: false,
                                  failureReason: "Simulated B2C provider timeout",
                                });
                                return `Refund ${refund.refundReference} marked FAILED for retry.`;
                              })
                            }
                          >
                            Simulate Refund Failure
                          </Button>
                        </>
                      )}
                      {refund.status === "FAILED" && (
                        <Button
                          size="sm"
                          variant="accent"
                          onClick={() =>
                            runAction(() => {
                              const retried = store.adminRetryFailedRefund({
                                refundId: refund.id,
                                reason: "Authorized administrator retry after failure",
                              });
                              return `Refund ${retried.refundReference} re-queued (retry #${retried.retryCount}).`;
                            })
                          }
                        >
                          <RefreshCw className="size-3.5" /> Retry Failed Refund
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              ))
            )}
          </TabsContent>

          <TabsContent value="audit" className="mt-5">
            {snapshot.auditLogs.length === 0 ? (
              <EmptyAdminState text="No audit events recorded yet." />
            ) : (
              <div className="overflow-x-auto rounded-lg border border-brand-line bg-background">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-brand-line bg-brand-soft text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Timestamp</th>
                      <th className="px-4 py-2.5 font-semibold">Actor</th>
                      <th className="px-4 py-2.5 font-semibold">Action</th>
                      <th className="px-4 py-2.5 font-semibold">Entity</th>
                      <th className="px-4 py-2.5 font-semibold">Summary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-line">
                    {snapshot.auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="whitespace-nowrap px-4 py-2.5 font-mono text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString("en-KE")}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5">
                          <span className="font-semibold">{log.actorRole}</span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 font-mono text-brand-forest">
                          {log.action}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 font-mono">{log.entityId}</td>
                        <td className="px-4 py-2.5 text-foreground">{log.summary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}

function EmptyAdminState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-brand-line bg-brand-soft p-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
