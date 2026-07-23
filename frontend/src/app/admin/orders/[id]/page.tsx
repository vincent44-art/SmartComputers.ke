"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { use, useState } from "react";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiSend,
  FiXCircle,
  FiEdit3,
  FiDollarSign,
} from "react-icons/fi";

import { Skeleton } from "@/components/ui/Skeleton";
import { apiErrorMessage } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  approveAdminOrder,
  fetchAdminOrder,
  rejectAdminOrder,
  reviewAdminOrder,
  updateAdminOrder,
} from "@/lib/services";

const STATUS_BADGE: Record<string, string> = {
  pending_review: "bg-warning/10 text-warning",
  awaiting_payment: "bg-primary/10 text-primary",
  payment_received: "bg-success/10 text-success",
  processing: "bg-accent/10 text-accent",
  ready_for_dispatch: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  shipped: "bg-success/10 text-success",
  delivered: "bg-success/10 text-success",
  cancelled: "bg-danger/10 text-danger",
  rejected: "bg-danger/10 text-danger",
};

const PAYMENT_STATUS_BADGE: Record<string, string> = {
  unpaid: "bg-warning/10 text-warning",
  paid: "bg-success/10 text-success",
  refunded: "bg-danger/10 text-danger",
};

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const orderId = parseInt(id, 10);
  const qc = useQueryClient();

  const [isReviewing, setIsReviewing] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [reviewForm, setReviewForm] = useState({
    deliveryFee: 0,
    discount: 0,
    tax: 0,
    internalNotes: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ["admin-order", orderId],
    queryFn: () => fetchAdminOrder(orderId),
    enabled: !isNaN(orderId),
  });

  const reviewMutation = useMutation({
    mutationFn: (payload: { deliveryFee?: number; discount?: number; tax?: number; internalNotes?: string }) =>
      reviewAdminOrder(orderId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-order", orderId] });
      setIsReviewing(false);
      setSuccess("Order review saved successfully");
      setError("");
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const approveMutation = useMutation({
    mutationFn: () => approveAdminOrder(orderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-order", orderId] });
      setSuccess("Order approved successfully! Email sent to customer.");
      setError("");
      setTimeout(() => setSuccess(""), 5000);
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => rejectAdminOrder(orderId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-order", orderId] });
      setIsRejecting(false);
      setRejectReason("");
      setSuccess("Order rejected. Notification sent to customer.");
      setError("");
      setTimeout(() => setSuccess(""), 5000);
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const markPaidMutation = useMutation({
    mutationFn: () =>
      updateAdminOrder(orderId, { paymentStatus: "paid", status: "payment_received" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-order", orderId] });
      setIsMarkingPaid(false);
      setSuccess("Payment confirmed. Order moved to processing.");
      setError("");
      setTimeout(() => setSuccess(""), 5000);
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-bold text-secondary dark:text-white">
          Order not found
        </h2>
        <Link href="/admin/orders" className="btn-primary mt-4 inline-block">
          Back to orders
        </Link>
      </div>
    );
  }

  const isPendingReview = order.status === "pending_review";
  const isAwaitingPayment = order.status === "awaiting_payment";

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/orders"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <FiArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-secondary dark:text-white">
              Order {order.orderNumber}
            </h1>
            <p className="text-sm text-slate-500">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
        <span
          className={`badge text-sm capitalize px-4 py-1.5 ${
            STATUS_BADGE[order.status] ||
            "bg-slate-100 text-slate-600 dark:bg-slate-800"
          }`}
        >
          {order.status.replace(/_/g, " ")}
        </span>
      </div>

      {/* Success/Error messages */}
      {success && (
        <div className="mt-4 rounded-xl bg-success/10 border border-success/20 p-4 text-sm text-success">
          {success}
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-xl bg-danger/10 border border-danger/20 p-4 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Main column - Items & Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-secondary dark:text-white">
              Items
            </h2>
            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    {item.thumbnail && (
                      <img
                        src={item.thumbnail}
                        alt={item.productName}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium text-secondary dark:text-white">
                        {item.productName}
                      </p>
                      <p className="text-xs text-slate-400">
                        SKU: {item.sku || "—"} × {item.quantity}
                      </p>
                      {item.currentStock !== undefined && (
                        <p
                          className={`text-xs ${
                            item.stockSufficient
                              ? "text-success"
                              : "text-danger"
                          }`}
                        >
                          Stock: {item.currentStock}{" "}
                          {item.stockSufficient
                            ? "✅"
                            : "⚠️ Insufficient"}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="font-medium">
                    {formatCurrency(item.lineTotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Review Form (only for pending_review) */}
          {isPendingReview && (
            <div className="card p-6 border-2 border-primary/20">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-secondary dark:text-white">
                  Review Order
                </h2>
                {!isReviewing && (
                  <button
                    onClick={() => {
                      setIsReviewing(true);
                      setReviewForm({
                        deliveryFee: order.deliveryFee || 0,
                        discount: order.discount || 0,
                        tax: order.tax || 0,
                        internalNotes: order.internalNotes || "",
                      });
                    }}
                    className="btn-outline text-sm"
                  >
                    <FiEdit3 className="h-4 w-4" /> Edit
                  </button>
                )}
              </div>
              {isReviewing ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">
                      Delivery Fee (KES)
                    </label>
                    <input
                      type="number"
                      className="input"
                      placeholder="0"
                      value={reviewForm.deliveryFee}
                      onChange={(e) =>
                        setReviewForm({
                          ...reviewForm,
                          deliveryFee: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">
                      Discount (KES)
                    </label>
                    <input
                      type="number"
                      className="input"
                      placeholder="0"
                      value={reviewForm.discount}
                      onChange={(e) =>
                        setReviewForm({
                          ...reviewForm,
                          discount: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">
                      Tax / VAT (KES)
                    </label>
                    <input
                      type="number"
                      className="input"
                      placeholder="0"
                      value={reviewForm.tax}
                      onChange={(e) =>
                        setReviewForm({
                          ...reviewForm,
                          tax: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-slate-500">
                      Internal Notes
                    </label>
                    <textarea
                      className="input"
                      rows={2}
                      value={reviewForm.internalNotes}
                      onChange={(e) =>
                        setReviewForm({
                          ...reviewForm,
                          internalNotes: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="sm:col-span-2 flex gap-3">
                    <button
                      onClick={() => reviewMutation.mutate(reviewForm)}
                      disabled={reviewMutation.isPending}
                      className="btn-primary"
                    >
                      {reviewMutation.isPending
                        ? "Saving..."
                        : "Save Review"}
                    </button>
                    <button
                      onClick={() => setIsReviewing(false)}
                      className="btn-ghost"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Delivery Fee</p>
                    <p className="font-semibold text-secondary dark:text-white">
                      {formatCurrency(order.deliveryFee)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Discount</p>
                    <p className="font-semibold text-success">
                      -{formatCurrency(order.discount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Tax/VAT</p>
                    <p className="font-semibold text-secondary dark:text-white">
                      {formatCurrency(order.tax)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {/* Approve Button */}
            {isPendingReview && (
              <button
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
                className="btn-primary"
              >
                <FiCheckCircle className="h-4 w-4" />
                {approveMutation.isPending
                  ? "Approving..."
                  : "Approve Order"}
              </button>
            )}

            {/* Mark as Paid */}
            {isAwaitingPayment && (
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      "Confirm that payment has been received for this order?"
                    )
                  ) {
                    markPaidMutation.mutate();
                  }
                }}
                disabled={markPaidMutation.isPending}
                className="btn-primary"
              >
                <FiDollarSign className="h-4 w-4" />
                {markPaidMutation.isPending
                  ? "Confirming..."
                  : "Mark as Paid"}
              </button>
            )}

            {/* Reject Button */}
            {isPendingReview && (
              <button
                onClick={() => setIsRejecting(true)}
                className="btn-danger"
              >
                <FiXCircle className="h-4 w-4" />
                Reject Order
              </button>
            )}
          </div>

          {/* Reject Reason Form */}
          {isRejecting && (
            <div className="card p-6 border-2 border-danger/20">
              <h3 className="font-bold text-danger">Reject Order</h3>
              <p className="mt-1 text-sm text-slate-500">
                Provide a reason for rejection. This will be shared with the
                customer.
              </p>
              <textarea
                className="input mt-3"
                rows={3}
                placeholder="Reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <div className="mt-3 flex gap-3">
                <button
                  onClick={() => rejectMutation.mutate(rejectReason)}
                  disabled={rejectMutation.isPending}
                  className="btn-danger"
                >
                  {rejectMutation.isPending
                    ? "Rejecting..."
                    : "Confirm Rejection"}
                </button>
                <button
                  onClick={() => {
                    setIsRejecting(false);
                    setRejectReason("");
                  }}
                  className="btn-ghost"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Resend Email */}
          <button
            onClick={async () => {
              try {
                const { resendOrderEmail } = await import(
                  "@/lib/services"
                );
                await resendOrderEmail(orderId);
                setSuccess("Email resent successfully!");
                setError("");
                setTimeout(() => setSuccess(""), 3000);
              } catch (err) {
                setError(apiErrorMessage(err));
              }
            }}
            className="btn-outline"
          >
            <FiSend className="h-4 w-4" />
            Resend Email Notification
          </button>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-secondary dark:text-white">
              Customer
            </h2>
            <div className="mt-3 space-y-2 text-sm">
              <div>
                <span className="text-slate-400">Name:</span>
                <p className="font-medium text-secondary dark:text-white">
                  {order.customerName || "—"}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Email:</span>
                <p className="font-medium">{order.email}</p>
              </div>
              <div>
                <span className="text-slate-400">Phone:</span>
                <p className="font-medium">{order.phone || "—"}</p>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="card p-6">
              <h2 className="text-lg font-bold text-secondary dark:text-white">
                Shipping Address
              </h2>
              <div className="mt-3 space-y-1 text-sm">
                <p className="font-medium text-secondary dark:text-white">
                  {order.shippingAddress.recipient ||
                    order.customerName}
                </p>
                <p className="text-slate-500">
                  {order.shippingAddress.line1}
                </p>
                {order.shippingAddress.line2 && (
                  <p className="text-slate-500">
                    {order.shippingAddress.line2}
                  </p>
                )}
                <p className="text-slate-500">
                  {order.shippingAddress.city}
                  {order.shippingAddress.county &&
                    `, ${order.shippingAddress.county}`}
                </p>
                <p className="text-slate-500">
                  {order.shippingAddress.country}
                </p>
                {order.isOutsideNairobi !== undefined && (
                  <span
                    className={`mt-2 inline-block badge ${
                      order.isOutsideNairobi
                        ? "bg-warning/10 text-warning"
                        : "bg-success/10 text-success"
                    }`}
                  >
                    {order.isOutsideNairobi
                      ? "Outside Nairobi"
                      : "Within Nairobi"}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Order Totals */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-secondary dark:text-white">
              Totals
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">Subtotal</dt>
                <dd className="font-medium">
                  {formatCurrency(order.subtotal)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Delivery Fee</dt>
                <dd className="font-medium">
                  {formatCurrency(order.deliveryFee)}
                </dd>
              </div>
              <div className="flex justify-between text-success">
                <dt>Discount</dt>
                <dd>-{formatCurrency(order.discount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">VAT</dt>
                <dd>{formatCurrency(order.tax)}</dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base dark:border-slate-800">
                <dt className="font-bold text-secondary dark:text-white">
                  Total
                </dt>
                <dd className="font-bold text-primary">
                  {formatCurrency(order.total)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Payment Info */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-secondary dark:text-white">
              Payment
            </h2>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Method</span>
                <span className="capitalize font-medium">
                  {order.paymentMethod || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status</span>
                <span
                  className={`badge capitalize ${
                    PAYMENT_STATUS_BADGE[order.paymentStatus] ||
                    "bg-slate-100 text-slate-600"
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </div>
              {order.approvedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Approved</span>
                  <span className="font-medium">
                    {formatDate(order.approvedAt)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Internal Notes */}
          {order.internalNotes && (
            <div className="card p-6">
              <h2 className="text-lg font-bold text-secondary dark:text-white">
                Internal Notes
              </h2>
              <p className="mt-2 text-sm text-slate-500 whitespace-pre-wrap">
                {order.internalNotes}
              </p>
            </div>
          )}

          {/* Customer Notes */}
          {order.notes && (
            <div className="card p-6">
              <h2 className="text-lg font-bold text-secondary dark:text-white">
                Customer Notes
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {order.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

