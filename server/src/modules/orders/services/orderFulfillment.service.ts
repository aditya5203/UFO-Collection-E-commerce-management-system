import mongoose from "mongoose";
import { Order } from "../../../models/Order.model";
import {
  AssignPickupInput,
  MarkPickupStatusInput,
  AssignReplacementDeliveryInput,
  orderDetailsLink,
  deliveryOrderLink,
  adminOrderLink,
  findOrderByIdOrCodeRaw,
  notifyAdmin,
  notifyCustomer,
  notifyDelivery,
  emitOrderUpdated,
  getActiveDeliveryRider,
  buildAssignment,
  isExchangeResolution,
  mapOrder,
} from "./orderShared";

export const orderFulfillmentService = {
  async assignReturnPickup(input: AssignPickupInput) {
    const adminId = String(input.adminId || "");
    const deliveryManId = String(input.deliveryManId || "");
    const note = String(input.note || "").trim();

    const found: any = await findOrderByIdOrCodeRaw(input.idOrCode);
    if (!found) {
      throw new Error("Order not found");
    }

    if (found.returnRequest?.status !== "APPROVED") {
      throw new Error("Return request must be approved before assigning pickup");
    }

    if (isExchangeResolution(found)) {
      throw new Error("This is an exchange request. Use exchange pickup assignment.");
    }

    const rider = await getActiveDeliveryRider(deliveryManId);
    const now = new Date();
    const assignment = buildAssignment(rider, "RETURN_PICKUP", note);

    const updated: any = await Order.findByIdAndUpdate(
      found._id,
      {
        $set: {
          returnPickupAssignment: assignment,
          "returnRequest.status": "PICKUP_ASSIGNED",
          "returnRequest.resolvedBy": mongoose.Types.ObjectId.isValid(adminId)
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

    const orderId = String(updated._id);
    const orderCode = String(updated.orderCode || "");
    const customerId = String(updated.customer?._id || updated.customer || "");

    await notifyDelivery({
      userId: String(rider._id),
      title: "Return Pickup Assigned",
      message: `Return pickup for order ${orderCode} has been assigned to you.`,
      link: deliveryOrderLink(orderId),
      meta: {
        orderId,
        orderCode,
        taskType: "RETURN_PICKUP",
        action: "return_pickup_assigned",
      },
    });

    await notifyCustomer({
      userId: customerId,
      title: "Return Pickup Assigned",
      message: `A delivery rider has been assigned to collect your return product for order ${orderCode}.`,
      link: orderDetailsLink(orderCode),
      meta: {
        orderId,
        orderCode,
        taskType: "RETURN_PICKUP",
        action: "return_pickup_assigned",
      },
    });

    await notifyAdmin({
      title: "Return Pickup Assigned",
      message: `Return pickup rider has been assigned for order ${orderCode}.`,
      link: adminOrderLink(orderId),
      meta: {
        orderId,
        orderCode,
        adminId,
        deliveryManId,
        assignedAt: now,
        action: "return_pickup_assigned",
      },
    });

    await emitOrderUpdated(updated, customerId);

    return mapOrder(updated);
  },

  async assignExchangePickup(input: AssignPickupInput) {
  const adminId = String(input.adminId || "");
  const deliveryManId = String(input.deliveryManId || "");
  const note = String(input.note || "").trim();

  const found: any = await findOrderByIdOrCodeRaw(input.idOrCode);
  if (!found) {
    throw new Error("Order not found");
  }

  const returnStatus = String(
    found?.returnRequest?.status || "NONE"
  ).toUpperCase();

  const exchangeStatus = String(
    found?.exchange?.status || "NONE"
  ).toUpperCase();

  const preferredResolution = String(
    found?.returnRequest?.preferredResolution || ""
  ).toUpperCase();

  const requestType = String(
    found?.returnRequest?.type || ""
  ).toUpperCase();

  const exchangeFlow =
    preferredResolution === "EXCHANGE" ||
    requestType === "EXCHANGE" ||
    exchangeStatus !== "NONE";

  if (!exchangeFlow) {
    throw new Error("This is not an exchange request");
  }

  if (exchangeStatus !== "APPROVED" && returnStatus !== "APPROVED") {
    throw new Error(
      "Exchange request must be approved before assigning pickup"
    );
  }

  const rider = await getActiveDeliveryRider(deliveryManId);
  const now = new Date();
  const assignment = buildAssignment(rider, "EXCHANGE_PICKUP", note);

  const updated: any = await Order.findByIdAndUpdate(
    found._id,
    {
      $set: {
  exchangePickupAssignment: assignment,

  "returnRequest.status": "PICKUP_ASSIGNED",
  "returnRequest.adminNote":
    note || found.returnRequest?.adminNote || "",

  "exchange.status": "PICKUP_ASSIGNED",
  "exchange.reason": found.exchange?.reason || found.returnRequest?.reason || "",
  "exchange.requestedAt":
    found.exchange?.requestedAt || found.returnRequest?.requestedAt || now,
  "exchange.approvedAt":
    found.exchange?.approvedAt || found.returnRequest?.approvedAt || now,
  "exchange.pickupDeliveryManId": rider._id,
  "exchange.pickupAssignedAt": now,
  "exchange.adminNote": note || found.exchange?.adminNote || "",
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

  const orderId = String(updated._id);
  const orderCode = String(updated.orderCode || "");
  const customerId = String(updated.customer?._id || updated.customer || "");

  await notifyDelivery({
    userId: String(rider._id),
    title: "Exchange Pickup Assigned",
    message: `Exchange pickup for order ${orderCode} has been assigned to you.`,
    link: deliveryOrderLink(orderId),
    meta: {
      orderId,
      orderCode,
      taskType: "EXCHANGE_PICKUP",
      action: "exchange_pickup_assigned",
    },
  });

  await notifyCustomer({
    userId: customerId,
    title: "Exchange Pickup Assigned",
    message: `A delivery rider has been assigned to collect your exchange product for order ${orderCode}.`,
    link: orderDetailsLink(orderCode),
    meta: {
      orderId,
      orderCode,
      taskType: "EXCHANGE_PICKUP",
      action: "exchange_pickup_assigned",
    },
  });

  await notifyAdmin({
    title: "Exchange Pickup Assigned",
    message: `Exchange pickup rider has been assigned for order ${orderCode}.`,
    link: adminOrderLink(orderId),
    meta: {
      orderId,
      orderCode,
      adminId,
      deliveryManId,
      assignedAt: now,
      action: "exchange_pickup_assigned",
    },
  });

  await emitOrderUpdated(updated, customerId);

  return mapOrder(updated);
},

  async updateReturnOrExchangePickupByDelivery(input: MarkPickupStatusInput) {
    const deliveryManId = String(input.deliveryManId || "");
    const status = input.status;
    const note = String(input.note || "").trim();
    const photo = String(input.photo || "").trim();

    if (!mongoose.Types.ObjectId.isValid(deliveryManId)) {
      throw new Error("Invalid delivery user");
    }

    if (!["Picked Up", "Returned to Store", "Failed Delivery"].includes(status)) {
      throw new Error("Invalid return/exchange pickup status");
    }

    const found: any = await findOrderByIdOrCodeRaw(input.idOrCode);
    if (!found) {
      throw new Error("Order not found");
    }

    const taskType =
      input.taskType ||
      (found.exchangePickupAssignment?.deliveryManId &&
      String(found.exchangePickupAssignment.deliveryManId) === deliveryManId
        ? "EXCHANGE_PICKUP"
        : "RETURN_PICKUP");

    const assignmentKey =
      taskType === "EXCHANGE_PICKUP"
        ? "exchangePickupAssignment"
        : "returnPickupAssignment";

    const assignment = found[assignmentKey];

    if (!assignment?.deliveryManId) {
      throw new Error("Pickup task is not assigned");
    }

    if (String(assignment.deliveryManId) !== deliveryManId) {
      throw new Error("This pickup task is not assigned to you");
    }

    const now = new Date();
    const nextAssignment = { ...assignment, status };

    if (note) nextAssignment.note = note;
    if (photo) nextAssignment.pickupPhoto = photo;

    if (status === "Picked Up" && !nextAssignment.pickedUpAt) {
      nextAssignment.pickedUpAt = now;
    }

    if (status === "Returned to Store" && !nextAssignment.returnedToStoreAt) {
      nextAssignment.returnedToStoreAt = now;
      if (!nextAssignment.pickedUpAt) nextAssignment.pickedUpAt = now;
    }

    if (status === "Failed Delivery" && !nextAssignment.failedAt) {
      nextAssignment.failedAt = now;
    }

    const update: any = {
      [assignmentKey]: nextAssignment,
    };

    if (taskType === "EXCHANGE_PICKUP") {
      if (status === "Picked Up") {
        update["returnRequest.status"] = "PICKED_UP";
        update["returnRequest.pickedUpAt"] = now;
        update["exchange.status"] = "PICKED_UP";
        update["exchange.pickedUpAt"] = now;
      }

      if (status === "Returned to Store") {
        update["returnRequest.status"] = "RECEIVED";
        update["returnRequest.receivedAt"] = now;
        update["exchange.status"] = "RECEIVED";
        update["exchange.receivedAt"] = now;
      }
    } else {
      if (status === "Picked Up") {
        update["returnRequest.status"] = "PICKED_UP";
        update["returnRequest.pickedUpAt"] = now;
      }

      if (status === "Returned to Store") {
        update["returnRequest.status"] = "RECEIVED";
        update["returnRequest.receivedAt"] = now;
      }
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
    const readableTask =
      taskType === "EXCHANGE_PICKUP" ? "exchange pickup" : "return pickup";

    await notifyAdmin({
      title: "Pickup Status Updated",
      message: `Rider updated ${readableTask} for order ${orderCode} to ${status}.`,
      link: adminOrderLink(orderId),
      meta: {
        orderId,
        orderCode,
        deliveryManId,
        taskType,
        status,
        action: "pickup_status_updated",
      },
    });

    await notifyCustomer({
      userId: customerId,
      title: "Pickup Status Updated",
      message: `Your ${readableTask} for order ${orderCode} is now ${status}.`,
      link: orderDetailsLink(orderCode),
      meta: {
        orderId,
        orderCode,
        taskType,
        status,
        action: "pickup_status_updated",
      },
    });

    await emitOrderUpdated(updated, customerId);

    return mapOrder(updated);
  },


  async assignReplacementDelivery(input: AssignReplacementDeliveryInput) {
    const adminId = String(input.adminId || "");
    const deliveryManId = String(input.deliveryManId || "");
    const note = String(input.note || "").trim();

    const found: any = await findOrderByIdOrCodeRaw(input.idOrCode);
    if (!found) {
      throw new Error("Order not found");
    }

    if (found.exchange?.status !== "RECEIVED") {
      throw new Error("Returned exchange product must be received before assigning replacement delivery");
    }

    if (
  found.replacementDeliveryAssignment?.deliveryManId ||
  found.exchange?.replacementAssignedAt
) {
  throw new Error("Replacement delivery is already assigned");
}

    const rider = await getActiveDeliveryRider(deliveryManId);
    const now = new Date();
    const assignment = buildAssignment(rider, "REPLACEMENT_DELIVERY", note);

    const updated: any = await Order.findByIdAndUpdate(
      found._id,
      {
        $set: {
          replacementDeliveryAssignment: assignment,
          "exchange.status": "REPLACEMENT_ASSIGNED",
          "exchange.replacementDeliveryManId": rider._id,
          "exchange.replacementAssignedAt": now,
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

    const orderId = String(updated._id);
    const orderCode = String(updated.orderCode || "");
    const customerId = String(updated.customer?._id || updated.customer || "");

    await notifyDelivery({
      userId: String(rider._id),
      title: "Replacement Delivery Assigned",
      message: `Replacement delivery for exchange order ${orderCode} has been assigned to you.`,
      link: deliveryOrderLink(orderId),
      meta: {
        orderId,
        orderCode,
        taskType: "REPLACEMENT_DELIVERY",
        action: "replacement_delivery_assigned",
      },
    });

    await notifyCustomer({
      userId: customerId,
      title: "Replacement Delivery Assigned",
      message: `Replacement delivery has been assigned for your exchange order ${orderCode}.`,
      link: orderDetailsLink(orderCode),
      meta: {
        orderId,
        orderCode,
        taskType: "REPLACEMENT_DELIVERY",
        action: "replacement_delivery_assigned",
      },
    });

    await notifyAdmin({
      title: "Replacement Delivery Assigned",
      message: `Replacement delivery rider has been assigned for order ${orderCode}.`,
      link: adminOrderLink(orderId),
      meta: {
        orderId,
        orderCode,
        adminId,
        deliveryManId,
        assignedAt: now,
        action: "replacement_delivery_assigned",
      },
    });

    await emitOrderUpdated(updated, customerId);

    return mapOrder(updated);
  },

  async updateReplacementDeliveryByDelivery(input: MarkPickupStatusInput) {
    const deliveryManId = String(input.deliveryManId || "");
    const status = input.status;
    const note = String(input.note || "").trim();
    const photo = String(input.photo || "").trim();

    if (!mongoose.Types.ObjectId.isValid(deliveryManId)) {
      throw new Error("Invalid delivery user");
    }

    if (!["Picked Up", "Out for Delivery", "Delivered", "Failed Delivery"].includes(status)) {
      throw new Error("Invalid replacement delivery status");
    }

    const found: any = await findOrderByIdOrCodeRaw(input.idOrCode);
    if (!found) {
      throw new Error("Order not found");
    }

    const assignment = found.replacementDeliveryAssignment;

    if (!assignment?.deliveryManId) {
      throw new Error("Replacement delivery task is not assigned");
    }

    if (String(assignment.deliveryManId) !== deliveryManId) {
      throw new Error("This replacement delivery task is not assigned to you");
    }

    const now = new Date();
    const nextAssignment = { ...assignment, status };

    if (note) nextAssignment.note = note;
    if (photo) nextAssignment.deliveryPhoto = photo;

    if (status === "Picked Up" && !nextAssignment.pickedUpAt) {
      nextAssignment.pickedUpAt = now;
    }

    if (status === "Out for Delivery" && !nextAssignment.outForDeliveryAt) {
      nextAssignment.outForDeliveryAt = now;
      if (!nextAssignment.pickedUpAt) nextAssignment.pickedUpAt = now;
    }

    if (status === "Delivered" && !nextAssignment.deliveredAt) {
      nextAssignment.deliveredAt = now;
      if (!nextAssignment.pickedUpAt) nextAssignment.pickedUpAt = now;
      if (!nextAssignment.outForDeliveryAt) nextAssignment.outForDeliveryAt = now;
    }

    if (status === "Failed Delivery" && !nextAssignment.failedAt) {
      nextAssignment.failedAt = now;
    }

    const update: any = {
      replacementDeliveryAssignment: nextAssignment,
    };

    if (status === "Delivered") {
      update["exchange.status"] = "REPLACEMENT_DELIVERED";
      update["exchange.replacementDeliveredAt"] = now;
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

    await notifyAdmin({
      title: "Replacement Delivery Updated",
      message: `Replacement delivery for order ${orderCode} is now ${status}.`,
      link: adminOrderLink(orderId),
      meta: {
        orderId,
        orderCode,
        deliveryManId,
        status,
        taskType: "REPLACEMENT_DELIVERY",
        action: "replacement_delivery_status_updated",
      },
    });

    await notifyCustomer({
      userId: customerId,
      title: "Replacement Delivery Updated",
      message: `Replacement delivery for your exchange order ${orderCode} is now ${status}.`,
      link: orderDetailsLink(orderCode),
      meta: {
        orderId,
        orderCode,
        status,
        taskType: "REPLACEMENT_DELIVERY",
        action: "replacement_delivery_status_updated",
      },
    });

    await emitOrderUpdated(updated, customerId);

    return mapOrder(updated);
  },

};

export default orderFulfillmentService;
