import mongoose from "mongoose";
import { Order } from "../../../models/Order.model";
import {
  RequestCancellationInput,
  RequestReturnInput,
  AdminRequestActionInput,
  MarkProductReceivedInput,
  RequestRefundDetailsInput,
  SubmitRefundDetailsInput,
  MarkRefundProcessingInput,
  MarkRefundedInput,
  CompleteExchangeInput,
  orderDetailsLink,
  adminOrderLink,
  adminReturnsRefundsLink,
  findOrderByIdOrCodeRaw,
  findCustomerOrderRaw,
  notifyAdmin,
  notifyCustomer,
  emitOrderUpdated,
  restockOrderItems,
  buildRefundAfterCancellation,
  buildRefundAfterProductReceived,
  isReturnWindowAllowed,
  normalizeImages,
  isExchangeResolution,
  mapOrder,
} from "./orderShared";

export const orderRequestService = {
  async requestCancellation(input: RequestCancellationInput) {
    const userId = String(input.userId || "");
    const reason = String(input.reason || "").trim();

    if (!reason) {
      throw new Error("Cancellation reason is required");
    }

    if (reason.length < 3) {
      throw new Error("Cancellation reason must be at least 3 characters");
    }

    const found: any = await findCustomerOrderRaw(userId, input.idOrCode);
    if (!found) {
      throw new Error("Order not found");
    }

    const orderStatus = String(found.orderStatus || "");
    const blockedStatuses = [
      "Shipped",
      "Transit",
      "Delivered",
      "Cancelled",
      "Returned",
      "Refunded",
    ];

    if (blockedStatuses.includes(orderStatus)) {
      throw new Error("This order can no longer be cancelled");
    }

    if (found.cancelRequest?.status === "REQUESTED") {
      throw new Error("Cancellation request already submitted");
    }

    if (found.cancelRequest?.status === "APPROVED") {
      throw new Error("Cancellation request already approved");
    }

    const now = new Date();

    const updated: any = await Order.findByIdAndUpdate(
      found._id,
      {
        $set: {
          cancelRequest: {
            status: "REQUESTED",
            reason,
            requestedAt: now,
            resolvedAt: null,
            adminNote: "",
            resolvedBy: null,
          },
        },
      },
      { new: true }
    )
      .populate("customer", "name email phone")
      .lean();

    if (!updated) {
      throw new Error("Order not found");
    }

    const orderId = String(updated._id);
    const orderCode = String(updated.orderCode || "");

    await notifyAdmin({
      title: "Cancellation Request Received",
      message: `Customer requested cancellation for order ${orderCode}.`,
      link: adminReturnsRefundsLink(),
      meta: {
        orderId,
        orderCode,
        customerId: userId,
        action: "cancel_request_received",
      },
    });

    await notifyCustomer({
      userId,
      title: "Cancellation Request Submitted",
      message: `Your cancellation request for order ${orderCode} has been submitted and is waiting for admin review.`,
      link: orderDetailsLink(orderCode),
      meta: {
        orderId,
        orderCode,
        action: "cancel_request_submitted",
      },
    });

    await emitOrderUpdated(updated, userId);

    return mapOrder(updated);
  },

  async requestReturn(input: RequestReturnInput) {
    const userId = String(input.userId || "");
    const reason = String(input.reason || "").trim();

    if (!reason) {
      throw new Error("Return/exchange reason is required");
    }

    if (reason.length < 3) {
      throw new Error("Return/exchange reason must be at least 3 characters");
    }

    const requestType = String(input.type || "RETURN_REFUND").toUpperCase();
    const allowedTypes = [
      "RETURN_REFUND",
      "EXCHANGE",
      "DAMAGED",
      "WRONG_ITEM",
      "SIZE_COLOR_ISSUE",
      "NOT_SATISFIED",
      "OTHER",
    ];

    if (!allowedTypes.includes(requestType)) {
      throw new Error("Invalid request type");
    }

    const preferredResolution = String(
      input.preferredResolution ||
        (requestType === "EXCHANGE" ? "EXCHANGE" : "REFUND")
    ).toUpperCase();

    if (!["REFUND", "EXCHANGE"].includes(preferredResolution)) {
      throw new Error("Invalid preferred resolution");
    }

    const found: any = await findCustomerOrderRaw(userId, input.idOrCode);
    if (!found) {
      throw new Error("Order not found");
    }

    if (String(found.orderStatus || "") !== "Delivered") {
      throw new Error("Return/exchange request is available only after delivery");
    }

    if (!isReturnWindowAllowed(found)) {
      throw new Error("Return/exchange request period has expired");
    }

    const existingReturnStatus = String(found.returnRequest?.status || "NONE");
    const existingExchangeStatus = String(found.exchange?.status || "NONE");

    if (
      !["NONE", "REJECTED"].includes(existingReturnStatus) ||
      !["NONE", "REJECTED"].includes(existingExchangeStatus)
    ) {
      throw new Error("Return/exchange request already submitted");
    }

    const now = new Date();
    const images = normalizeImages(input.images);

    const setPayload: any = {
      returnRequest: {
        status: "REQUESTED",
        type: requestType,
        preferredResolution,
        reason,
        images,
        requestedAt: now,
        approvedAt: null,
        rejectedAt: null,
        resolvedAt: null,
        pickedUpAt: null,
        receivedAt: null,
        adminNote: "",
        resolvedBy: null,
      },
    };

    if (preferredResolution === "EXCHANGE") {
      setPayload.exchange = {
        status: "REQUESTED",
        reason,
        images,
        replacementItems: [],
        pickupDeliveryManId: null,
        replacementDeliveryManId: null,
        requestedAt: now,
        approvedAt: null,
        rejectedAt: null,
        pickupAssignedAt: null,
        pickedUpAt: null,
        receivedAt: null,
        replacementAssignedAt: null,
        replacementDeliveredAt: null,
        completedAt: null,
        adminNote: "",
        resolvedBy: null,
      };
    }

    const updated: any = await Order.findByIdAndUpdate(
      found._id,
      { $set: setPayload },
      { new: true }
    )
      .populate("customer", "name email phone")
      .lean();

    if (!updated) {
      throw new Error("Order not found");
    }

    const orderId = String(updated._id);
    const orderCode = String(updated.orderCode || "");
    const label =
      preferredResolution === "EXCHANGE" ? "exchange" : "return/refund";

    await notifyAdmin({
      title:
        preferredResolution === "EXCHANGE"
          ? "Exchange Request Received"
          : "Return / Refund Request Received",
      message: `Customer requested ${label} for order ${orderCode}.`,
      link: adminReturnsRefundsLink(),
      meta: {
        orderId,
        orderCode,
        customerId: userId,
        action:
          preferredResolution === "EXCHANGE"
            ? "exchange_request_received"
            : "return_request_received",
        requestType,
        preferredResolution,
      },
    });

    await notifyCustomer({
      userId,
      title:
        preferredResolution === "EXCHANGE"
          ? "Exchange Request Submitted"
          : "Return / Refund Request Submitted",
      message: `Your ${label} request for order ${orderCode} has been submitted and is waiting for admin review.`,
      link: orderDetailsLink(orderCode),
      meta: {
        orderId,
        orderCode,
        action:
          preferredResolution === "EXCHANGE"
            ? "exchange_request_submitted"
            : "return_request_submitted",
        requestType,
        preferredResolution,
      },
    });

    await emitOrderUpdated(updated, userId);

    return mapOrder(updated);
  },

  async approveCancellation(input: AdminRequestActionInput) {
    const adminId = String(input.adminId || "");
    const adminNote = String(input.adminNote || "").trim();

    const found: any = await findOrderByIdOrCodeRaw(input.idOrCode);
    if (!found) {
      throw new Error("Order not found");
    }

    if (found.cancelRequest?.status !== "REQUESTED") {
      throw new Error("No pending cancellation request found");
    }

    if (
      ["Shipped", "Transit", "Delivered", "Returned", "Refunded"].includes(
        String(found.orderStatus || "")
      )
    ) {
      throw new Error("This order can no longer be cancelled");
    }

    const now = new Date();
    const refund = buildRefundAfterCancellation(found);

    await restockOrderItems(found);

    const updated: any = await Order.findByIdAndUpdate(
      found._id,
      {
        $set: {
          orderStatus: "Cancelled",
          cancelledAt: now,
          cancelRequest: {
            status: "APPROVED",
            reason: found.cancelRequest?.reason || "",
            requestedAt: found.cancelRequest?.requestedAt || null,
            resolvedAt: now,
            adminNote,
            resolvedBy: mongoose.Types.ObjectId.isValid(adminId)
              ? new mongoose.Types.ObjectId(adminId)
              : null,
          },
          refund,
        },
      },
      { new: true }
    )
      .populate("customer", "name email phone")
      .lean();

    if (!updated) {
      throw new Error("Order not found");
    }

    const customerId = String(updated.customer?._id || updated.customer || "");
    const orderId = String(updated._id);
    const orderCode = String(updated.orderCode || "");

    await notifyCustomer({
      userId: customerId,
      title: "Cancellation Approved",
      message:
        updated.refund?.status === "PENDING"
          ? `Your cancellation request for order ${orderCode} was approved. Refund is now pending.`
          : `Your cancellation request for order ${orderCode} was approved.`,
      link: orderDetailsLink(orderCode),
      meta: {
        orderId,
        orderCode,
        action: "cancel_request_approved",
        refundStatus: updated.refund?.status || "NONE",
      },
    });

    await notifyAdmin({
      title: "Cancellation Approved",
      message: `Cancellation request for order ${orderCode} has been approved.`,
      link: adminOrderLink(orderId),
      meta: {
        orderId,
        orderCode,
        action: "cancel_request_approved",
        adminId,
      },
    });

    await emitOrderUpdated(updated, customerId);

    return mapOrder(updated);
  },

  async rejectCancellation(input: AdminRequestActionInput) {
    const adminId = String(input.adminId || "");
    const adminNote = String(input.adminNote || "").trim();

    const found: any = await findOrderByIdOrCodeRaw(input.idOrCode);
    if (!found) {
      throw new Error("Order not found");
    }

    if (found.cancelRequest?.status !== "REQUESTED") {
      throw new Error("No pending cancellation request found");
    }

    const now = new Date();

    const updated: any = await Order.findByIdAndUpdate(
      found._id,
      {
        $set: {
          cancelRequest: {
            status: "REJECTED",
            reason: found.cancelRequest?.reason || "",
            requestedAt: found.cancelRequest?.requestedAt || null,
            resolvedAt: now,
            adminNote,
            resolvedBy: mongoose.Types.ObjectId.isValid(adminId)
              ? new mongoose.Types.ObjectId(adminId)
              : null,
          },
        },
      },
      { new: true }
    )
      .populate("customer", "name email phone")
      .lean();

    if (!updated) {
      throw new Error("Order not found");
    }

    const customerId = String(updated.customer?._id || updated.customer || "");
    const orderId = String(updated._id);
    const orderCode = String(updated.orderCode || "");

    await notifyCustomer({
      userId: customerId,
      title: "Cancellation Rejected",
      message: `Your cancellation request for order ${orderCode} was rejected.`,
      link: orderDetailsLink(orderCode),
      meta: {
        orderId,
        orderCode,
        action: "cancel_request_rejected",
        adminNote,
      },
    });

    await notifyAdmin({
      title: "Cancellation Rejected",
      message: `Cancellation request for order ${orderCode} has been rejected.`,
      link: adminOrderLink(orderId),
      meta: {
        orderId,
        orderCode,
        action: "cancel_request_rejected",
        adminId,
      },
    });

    await emitOrderUpdated(updated, customerId);

    return mapOrder(updated);
  },

  async approveReturn(input: AdminRequestActionInput) {
    const adminId = String(input.adminId || "");
    const adminNote = String(input.adminNote || "").trim();

    const found: any = await findOrderByIdOrCodeRaw(input.idOrCode);
    if (!found) {
      throw new Error("Order not found");
    }

    if (found.returnRequest?.status !== "REQUESTED") {
      throw new Error("No pending return/exchange request found");
    }

    const now = new Date();
    const exchangeFlow =
      String(found.returnRequest?.preferredResolution || "").toUpperCase() ===
      "EXCHANGE";

    const update: any = {
      "returnRequest.status": "APPROVED",
      "returnRequest.approvedAt": now,
      "returnRequest.resolvedAt": now,
      "returnRequest.adminNote": adminNote,
      "returnRequest.resolvedBy": mongoose.Types.ObjectId.isValid(adminId)
        ? new mongoose.Types.ObjectId(adminId)
        : null,
    };

    if (exchangeFlow) {
      update["exchange.status"] = "APPROVED";
      update["exchange.approvedAt"] = now;
      update["exchange.adminNote"] = adminNote;
      update["exchange.resolvedBy"] = mongoose.Types.ObjectId.isValid(adminId)
        ? new mongoose.Types.ObjectId(adminId)
        : null;
    }

    const updated: any = await Order.findByIdAndUpdate(
      found._id,
      { $set: update },
      { new: true }
    )
      .populate("customer", "name email phone")
      .lean();

    if (!updated) {
      throw new Error("Order not found");
    }

    const customerId = String(updated.customer?._id || updated.customer || "");
    const orderId = String(updated._id);
    const orderCode = String(updated.orderCode || "");

    await notifyCustomer({
      userId: customerId,
      title: exchangeFlow ? "Exchange Approved" : "Return Approved",
      message: exchangeFlow
        ? `Your exchange request for order ${orderCode} was approved. A pickup rider will be assigned soon.`
        : `Your return request for order ${orderCode} was approved. A pickup rider will be assigned soon.`,
      link: orderDetailsLink(orderCode),
      meta: {
        orderId,
        orderCode,
        action: exchangeFlow
          ? "exchange_request_approved"
          : "return_request_approved",
      },
    });

    await notifyAdmin({
      title: exchangeFlow ? "Exchange Approved" : "Return Approved",
      message: exchangeFlow
        ? `Exchange request for order ${orderCode} has been approved.`
        : `Return request for order ${orderCode} has been approved.`,
      link: adminOrderLink(orderId),
      meta: {
        orderId,
        orderCode,
        action: exchangeFlow
          ? "exchange_request_approved"
          : "return_request_approved",
        adminId,
      },
    });

    await emitOrderUpdated(updated, customerId);

    return mapOrder(updated);
  },

  async rejectReturn(input: AdminRequestActionInput) {
    const adminId = String(input.adminId || "");
    const adminNote = String(input.adminNote || "").trim();

    const found: any = await findOrderByIdOrCodeRaw(input.idOrCode);
    if (!found) {
      throw new Error("Order not found");
    }

    if (found.returnRequest?.status !== "REQUESTED") {
      throw new Error("No pending return/exchange request found");
    }

    const now = new Date();
    const exchangeFlow =
      String(found.returnRequest?.preferredResolution || "").toUpperCase() ===
      "EXCHANGE";

    const update: any = {
      "returnRequest.status": "REJECTED",
      "returnRequest.rejectedAt": now,
      "returnRequest.resolvedAt": now,
      "returnRequest.adminNote": adminNote,
      "returnRequest.resolvedBy": mongoose.Types.ObjectId.isValid(adminId)
        ? new mongoose.Types.ObjectId(adminId)
        : null,
    };

    if (exchangeFlow) {
      update["exchange.status"] = "REJECTED";
      update["exchange.rejectedAt"] = now;
      update["exchange.adminNote"] = adminNote;
      update["exchange.resolvedBy"] = mongoose.Types.ObjectId.isValid(adminId)
        ? new mongoose.Types.ObjectId(adminId)
        : null;
    }

    const updated: any = await Order.findByIdAndUpdate(
      found._id,
      { $set: update },
      { new: true }
    )
      .populate("customer", "name email phone")
      .lean();

    if (!updated) {
      throw new Error("Order not found");
    }

    const customerId = String(updated.customer?._id || updated.customer || "");
    const orderId = String(updated._id);
    const orderCode = String(updated.orderCode || "");

    await notifyCustomer({
      userId: customerId,
      title: exchangeFlow ? "Exchange Rejected" : "Return Rejected",
      message: exchangeFlow
        ? `Your exchange request for order ${orderCode} was rejected.`
        : `Your return request for order ${orderCode} was rejected.`,
      link: orderDetailsLink(orderCode),
      meta: {
        orderId,
        orderCode,
        action: exchangeFlow
          ? "exchange_request_rejected"
          : "return_request_rejected",
        adminNote,
      },
    });

    await notifyAdmin({
      title: exchangeFlow ? "Exchange Rejected" : "Return Rejected",
      message: exchangeFlow
        ? `Exchange request for order ${orderCode} has been rejected.`
        : `Return request for order ${orderCode} has been rejected.`,
      link: adminOrderLink(orderId),
      meta: {
        orderId,
        orderCode,
        action: exchangeFlow
          ? "exchange_request_rejected"
          : "return_request_rejected",
        adminId,
      },
    });

    await emitOrderUpdated(updated, customerId);

    return mapOrder(updated);
  },


  async markProductReceived(input: MarkProductReceivedInput) {
    const adminId = String(input.adminId || "");
    const adminNote = String(input.adminNote || "").trim();

    const found: any = await findOrderByIdOrCodeRaw(input.idOrCode);
    if (!found) {
      throw new Error("Order not found");
    }

    if (!["PICKED_UP", "RECEIVED"].includes(String(found.returnRequest?.status || ""))) {
      throw new Error("Product must be picked up before marking received");
    }

    const now = new Date();
    const exchangeFlow = isExchangeResolution(found);
    const update: any = {
      "returnRequest.status": "RECEIVED",
      "returnRequest.receivedAt": now,
      "returnRequest.adminNote": adminNote,
      "returnRequest.resolvedBy": mongoose.Types.ObjectId.isValid(adminId)
        ? new mongoose.Types.ObjectId(adminId)
        : null,
      returnedAt: now,
    };

    if (exchangeFlow) {
      update["exchange.status"] = "RECEIVED";
      update["exchange.receivedAt"] = now;
      update["exchange.adminNote"] = adminNote;
      update["exchange.resolvedBy"] = mongoose.Types.ObjectId.isValid(adminId)
        ? new mongoose.Types.ObjectId(adminId)
        : null;
    } else {
      update.orderStatus = "Returned";
      update.refund = buildRefundAfterProductReceived(found);
    }

    await restockOrderItems(found);

    const updated: any = await Order.findByIdAndUpdate(
      found._id,
      { $set: update },
      { new: true }
    )
      .populate("customer", "name email phone")
      .lean();

    if (!updated) {
      throw new Error("Order not found");
    }

    const customerId = String(updated.customer?._id || updated.customer || "");
    const orderId = String(updated._id);
    const orderCode = String(updated.orderCode || "");

    await notifyCustomer({
      userId: customerId,
      title: "Returned Product Received",
      message: exchangeFlow
        ? `Your returned product for exchange order ${orderCode} has been received. Replacement delivery will be arranged soon.`
        : `Your returned product for order ${orderCode} has been received. Refund process will continue now.`,
      link: orderDetailsLink(orderCode),
      meta: {
        orderId,
        orderCode,
        action: "returned_product_received",
        exchangeFlow,
        refundStatus: updated.refund?.status || "NONE",
      },
    });

    await notifyAdmin({
      title: "Returned Product Received",
      message: `Returned product for order ${orderCode} has been marked as received.`,
      link: adminOrderLink(orderId),
      meta: {
        orderId,
        orderCode,
        action: "returned_product_received",
        adminId,
        exchangeFlow,
      },
    });

    await emitOrderUpdated(updated, customerId);

    return mapOrder(updated);
  },

  async requestRefundDetails(input: RequestRefundDetailsInput) {
    const adminId = String(input.adminId || "");
    const adminNote = String(input.adminNote || "").trim();

    const found: any = await findOrderByIdOrCodeRaw(input.idOrCode);
    if (!found) {
      throw new Error("Order not found");
    }

    if (found.returnRequest?.status !== "RECEIVED") {
      throw new Error("Returned product must be received before requesting refund details");
    }

    if (!found.refund || found.refund.status === "NONE") {
      throw new Error("No refund is available for this order");
    }

    if (found.refund.status === "REFUNDED") {
      throw new Error("Refund already completed");
    }

    const now = new Date();

    const updated: any = await Order.findByIdAndUpdate(
      found._id,
      {
        $set: {
          "refund.status": "PENDING_ACCOUNT_DETAILS",
          "refund.requestedDetailsAt": now,
          "refund.adminNote": adminNote,
          "refund.processedBy": mongoose.Types.ObjectId.isValid(adminId)
            ? new mongoose.Types.ObjectId(adminId)
            : null,
        },
      },
      { new: true }
    )
      .populate("customer", "name email phone")
      .lean();

    if (!updated) {
      throw new Error("Order not found");
    }

    const customerId = String(updated.customer?._id || updated.customer || "");
    const orderId = String(updated._id);
    const orderCode = String(updated.orderCode || "");

    await notifyCustomer({
      userId: customerId,
      title: "Submit Refund Details",
      message: `Please submit your refund account details for order ${orderCode}.`,
      type: "payment",
      link: orderDetailsLink(orderCode),
      meta: {
        orderId,
        orderCode,
        action: "refund_details_requested",
      },
    });

    await notifyAdmin({
      title: "Refund Details Requested",
      message: `Refund account details requested from customer for order ${orderCode}.`,
      link: adminOrderLink(orderId),
      meta: {
        orderId,
        orderCode,
        adminId,
        action: "refund_details_requested",
      },
    });

    await emitOrderUpdated(updated, customerId);

    return mapOrder(updated);
  },

  async submitRefundDetails(input: SubmitRefundDetailsInput) {
    const userId = String(input.userId || "");
    const method = String(input.method || "").trim();

    if (!method) {
      throw new Error("Refund method is required");
    }

    const normalizedMethod =
      method === "Bank"
        ? "BANK"
        : method === "Khalti"
          ? "KHALTI"
          : method === "eSewa"
            ? "ESEWA"
            : method === "Fonepay"
              ? "FONEPAY"
              : method.toUpperCase();

    if (!["BANK", "KHALTI", "ESEWA", "FONEPAY"].includes(normalizedMethod)) {
      throw new Error("Invalid refund method");
    }

    const found: any = await findCustomerOrderRaw(userId, input.idOrCode);
    if (!found) {
      throw new Error("Order not found");
    }

    if (found.refund?.status !== "PENDING_ACCOUNT_DETAILS") {
      throw new Error("Refund details are not requested for this order");
    }

    const accountName = String(input.accountName || "").trim();
    const accountNumber = String(input.accountNumber || "").trim();
    const bankName = String(input.bankName || "").trim();
    const walletNumber = String(input.walletNumber || "").trim();
    const walletId = String(input.walletId || "").trim();
    const customerNote = String(input.customerNote || "").trim();

    if (normalizedMethod === "BANK") {
      if (!accountName || !accountNumber || !bankName) {
        throw new Error("Bank name, account holder name, and account number are required");
      }
    } else {
      if (!walletNumber && !walletId) {
        throw new Error("Wallet number or wallet ID is required");
      }
    }

    const now = new Date();

    const updated: any = await Order.findByIdAndUpdate(
      found._id,
      {
        $set: {
          "refund.status": "READY_TO_REFUND",
          "refund.method": normalizedMethod,
          "refund.accountName": accountName,
          "refund.accountNumber": accountNumber,
          "refund.bankName": bankName,
          "refund.walletNumber": walletNumber,
          "refund.walletId": walletId,
          "refund.customerNote": customerNote,
          "refund.detailsSubmittedAt": now,
        },
      },
      { new: true }
    )
      .populate("customer", "name email phone")
      .lean();

    if (!updated) {
      throw new Error("Order not found");
    }

    const orderId = String(updated._id);
    const orderCode = String(updated.orderCode || "");

    await notifyAdmin({
      title: "Refund Details Submitted",
      message: `Customer submitted refund details for order ${orderCode}.`,
      link: adminOrderLink(orderId),
      meta: {
        orderId,
        orderCode,
        customerId: userId,
        method: normalizedMethod,
        action: "refund_details_submitted",
      },
    });

    await notifyCustomer({
      userId,
      title: "Refund Details Submitted",
      message: `Your refund details for order ${orderCode} have been submitted.`,
      type: "payment",
      link: orderDetailsLink(orderCode),
      meta: {
        orderId,
        orderCode,
        method: normalizedMethod,
        action: "refund_details_submitted",
      },
    });

    await emitOrderUpdated(updated, userId);

    return mapOrder(updated);
  },

  async markRefundProcessing(input: MarkRefundProcessingInput) {
    const adminId = String(input.adminId || "");
    const adminNote = String(input.adminNote || "").trim();

    const found: any = await findOrderByIdOrCodeRaw(input.idOrCode);
    if (!found) {
      throw new Error("Order not found");
    }

    if (!["PENDING", "READY_TO_REFUND", "PENDING_ACCOUNT_DETAILS"].includes(String(found.refund?.status || ""))) {
      throw new Error("Refund is not ready for processing");
    }

    const now = new Date();

    const updated: any = await Order.findByIdAndUpdate(
      found._id,
      {
        $set: {
          "refund.status": "PROCESSING",
          "refund.processedAt": now,
          "refund.adminNote": adminNote,
          "refund.processedBy": mongoose.Types.ObjectId.isValid(adminId)
            ? new mongoose.Types.ObjectId(adminId)
            : null,
        },
      },
      { new: true }
    )
      .populate("customer", "name email phone")
      .lean();

    if (!updated) {
      throw new Error("Order not found");
    }

    const customerId = String(updated.customer?._id || updated.customer || "");
    const orderId = String(updated._id);
    const orderCode = String(updated.orderCode || "");

    await notifyCustomer({
      userId: customerId,
      title: "Refund Processing",
      message: `Refund for order ${orderCode} is now processing.`,
      type: "payment",
      link: orderDetailsLink(orderCode),
      meta: {
        orderId,
        orderCode,
        action: "refund_processing",
      },
    });

    await emitOrderUpdated(updated, customerId);

    return mapOrder(updated);
  },

  async markRefunded(input: MarkRefundedInput) {
    const adminId = String(input.adminId || "");
    const adminNote = String(input.adminNote || "").trim();
    const transactionRef = String(input.transactionRef || "").trim();

    const found: any = await findOrderByIdOrCodeRaw(input.idOrCode);
    if (!found) {
      throw new Error("Order not found");
    }

    if (!found.refund || found.refund.status === "NONE") {
      throw new Error("No refund is pending for this order");
    }

    if (found.refund.status === "REFUNDED") {
      throw new Error("Refund already completed");
    }

    const now = new Date();

    const update: any = {
      "refund.status": "REFUNDED",
      "refund.processedAt": found.refund?.processedAt || now,
      "refund.refundedAt": now,
      "refund.failedAt": null,
      "refund.adminNote": adminNote,
      "refund.processedBy": mongoose.Types.ObjectId.isValid(adminId)
        ? new mongoose.Types.ObjectId(adminId)
        : null,
      refundedAt: now,
    };

    if (transactionRef) {
      update["refund.transactionRef"] = transactionRef;
    }

    if (
      String(found.orderStatus || "") === "Cancelled" ||
      String(found.orderStatus || "") === "Returned"
    ) {
      update.orderStatus = "Refunded";
    }

    const updated: any = await Order.findByIdAndUpdate(
      found._id,
      { $set: update },
      { new: true }
    )
      .populate("customer", "name email phone")
      .lean();

    if (!updated) {
      throw new Error("Order not found");
    }

    const customerId = String(updated.customer?._id || updated.customer || "");
    const orderId = String(updated._id);
    const orderCode = String(updated.orderCode || "");

    await notifyCustomer({
      userId: customerId,
      title: "Refund Completed",
      message: `Refund for order ${orderCode} has been marked as completed.`,
      type: "payment",
      link: orderDetailsLink(orderCode),
      meta: {
        orderId,
        orderCode,
        action: "refund_completed",
        refundStatus: "REFUNDED",
        transactionRef,
      },
    });

    await notifyAdmin({
      title: "Refund Completed",
      message: `Refund for order ${orderCode} has been marked as completed.`,
      link: adminOrderLink(orderId),
      meta: {
        orderId,
        orderCode,
        action: "refund_completed",
        adminId,
        transactionRef,
      },
    });

    await emitOrderUpdated(updated, customerId);

    return mapOrder(updated);
  },


  async completeExchange(input: CompleteExchangeInput) {
    const adminId = String(input.adminId || "");
    const adminNote = String(input.adminNote || "").trim();

    const found: any = await findOrderByIdOrCodeRaw(input.idOrCode);
    if (!found) {
      throw new Error("Order not found");
    }

    if (!["REPLACEMENT_DELIVERED", "COMPLETED"].includes(String(found.exchange?.status || ""))) {
      throw new Error("Replacement must be delivered before completing exchange");
    }

    const now = new Date();

    const updated: any = await Order.findByIdAndUpdate(
      found._id,
      {
        $set: {
          "exchange.status": "COMPLETED",
          "exchange.completedAt": now,
          "exchange.adminNote": adminNote,
          "exchange.resolvedBy": mongoose.Types.ObjectId.isValid(adminId)
            ? new mongoose.Types.ObjectId(adminId)
            : null,
        },
      },
      { new: true }
    )
      .populate("customer", "name email phone")
      .lean();

    if (!updated) {
      throw new Error("Order not found");
    }

    const customerId = String(updated.customer?._id || updated.customer || "");
    const orderId = String(updated._id);
    const orderCode = String(updated.orderCode || "");

    await notifyCustomer({
      userId: customerId,
      title: "Exchange Completed",
      message: `Your exchange for order ${orderCode} has been completed.`,
      link: orderDetailsLink(orderCode),
      meta: {
        orderId,
        orderCode,
        action: "exchange_completed",
      },
    });

    await notifyAdmin({
      title: "Exchange Completed",
      message: `Exchange for order ${orderCode} has been completed.`,
      link: adminOrderLink(orderId),
      meta: {
        orderId,
        orderCode,
        adminId,
        action: "exchange_completed",
      },
    });

    await emitOrderUpdated(updated, customerId);

    return mapOrder(updated);
  },

};

export default orderRequestService;
