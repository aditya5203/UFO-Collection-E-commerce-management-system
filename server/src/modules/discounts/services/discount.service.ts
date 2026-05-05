// server/src/modules/discounts/services/discount.service.ts

import mongoose from "mongoose";
import { Coupon } from "../../../models/Coupon.model";
import { UserCoupon } from "../../../models/UserCoupon.model";

type CartItem = {
  productId: string;
  qty: number;
};

type CouponType = "PERCENT" | "FLAT" | "FREESHIP";
type CouponScope = "ALL" | "CATEGORY" | "PRODUCT";
type CouponStatus = "ACTIVE" | "PAUSED";

function nowInRange(now: Date, startAt?: Date | null, endAt?: Date | null) {
  if (startAt && now < new Date(startAt)) return false;
  if (endAt && now > new Date(endAt)) return false;
  return true;
}

function toPaisa(rupees: number) {
  return Math.max(0, Math.round(Number(rupees || 0) * 100));
}

function isValidCouponType(type: any): type is CouponType {
  return ["PERCENT", "FLAT", "FREESHIP"].includes(String(type || ""));
}

function isValidCouponScope(scope: any): scope is CouponScope {
  return ["ALL", "CATEGORY", "PRODUCT"].includes(String(scope || ""));
}

function isValidCouponStatus(status: any): status is CouponStatus {
  return ["ACTIVE", "PAUSED"].includes(String(status || ""));
}

function normalizeObjectIdArray(value: any, fieldName: string) {
  if (!Array.isArray(value)) return [];

  const ids = value.map((x) => String(x || "").trim()).filter(Boolean);

  for (const id of ids) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error(`Invalid ${fieldName} id: ${id}`);
    }
  }

  return ids.map((id) => new mongoose.Types.ObjectId(id));
}

function stringifyObjectIdArray(value: any) {
  if (!Array.isArray(value)) return [];

  return value
    .map((x) => String(x || "").trim())
    .filter(Boolean);
}

function validateCouponInput(input: any) {
  const type = input?.type;
  const scope = input?.scope || "ALL";
  const status = input?.status || "ACTIVE";
  const value = Number(input?.value || 0);

  if (!isValidCouponType(type)) {
    throw new Error("Invalid coupon type");
  }

  if (!isValidCouponScope(scope)) {
    throw new Error("Invalid coupon scope");
  }

  if (!isValidCouponStatus(status)) {
    throw new Error("Invalid coupon status");
  }

  if (type === "PERCENT" && (value < 1 || value > 100)) {
    throw new Error("Percent discount must be between 1 and 100");
  }

  if (type === "FLAT" && value <= 0) {
    throw new Error("Flat discount must be greater than 0");
  }

  if (input?.minOrder != null && Number(input.minOrder) < 0) {
    throw new Error("Minimum order cannot be negative");
  }

  if (input?.maxDiscountCap != null && Number(input.maxDiscountCap) < 0) {
    throw new Error("Maximum discount cap cannot be negative");
  }

  if (input?.globalUsageLimit != null && Number(input.globalUsageLimit) < 1) {
    throw new Error("Global usage limit must be at least 1");
  }

  if (input?.maxUsesPerUser != null && Number(input.maxUsesPerUser) < 1) {
    throw new Error("Per user limit must be at least 1");
  }

  if (input?.startAt && input?.endAt) {
    const start = new Date(input.startAt);
    const end = new Date(input.endAt);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new Error("Invalid start or end date");
    }

    if (end < start) {
      throw new Error("End date cannot be before start date");
    }
  }

  const eligibleCategoryIds = Array.isArray(input?.eligibleCategoryIds)
    ? input.eligibleCategoryIds
    : [];

  const eligibleProductIds = Array.isArray(input?.eligibleProductIds)
    ? input.eligibleProductIds
    : [];

  if (scope === "CATEGORY" && eligibleCategoryIds.length === 0) {
    throw new Error("Please select at least one category");
  }

  if (scope === "PRODUCT" && eligibleProductIds.length === 0) {
    throw new Error("Please select at least one product");
  }
}

function normalizeCouponPayload(input: any) {
  const type = input?.type as CouponType;
  const scope = (input?.scope || "ALL") as CouponScope;

  const eligibleCategoryIds =
    scope === "CATEGORY"
      ? normalizeObjectIdArray(input?.eligibleCategoryIds, "category")
      : [];

  const eligibleProductIds =
    scope === "PRODUCT"
      ? normalizeObjectIdArray(input?.eligibleProductIds, "product")
      : [];

  return {
    title: String(input?.title || "Discount").trim(),
    description: String(input?.description || "").trim(),
    type,
    scope,
    value: type === "FREESHIP" ? 0 : Number(input?.value || 0),
    minOrder: input?.minOrder == null ? null : Number(input.minOrder),
    maxDiscountCap:
      type === "PERCENT"
        ? input?.maxDiscountCap == null
          ? null
          : Number(input.maxDiscountCap)
        : null,
    eligibleCategoryIds,
    eligibleProductIds,
    startAt: input?.startAt ? new Date(input.startAt) : null,
    endAt: input?.endAt ? new Date(input.endAt) : null,
    globalUsageLimit:
      input?.globalUsageLimit == null ? null : Number(input.globalUsageLimit),
    maxUsesPerUser:
      input?.maxUsesPerUser == null ? null : Number(input.maxUsesPerUser),
    status: (input?.status || "ACTIVE") as CouponStatus,
  };
}

export const discountService = {
  async getCouponByCode(code: string) {
    const c = String(code || "").trim().toUpperCase();

    if (!c) return null;

    return Coupon.findOne({ code: c }).lean();
  },

  async listAvailable() {
    const now = new Date();

    const rows = await Coupon.find({
      status: "ACTIVE",
      $and: [
        { $or: [{ startAt: null }, { startAt: { $lte: now } }] },
        { $or: [{ endAt: null }, { endAt: { $gte: now } }] },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    const filtered = (rows as any[]).filter((c) => {
      if (c.globalUsageLimit && c.globalUsageLimit > 0) {
        return Number(c.usedCount || 0) < Number(c.globalUsageLimit || 0);
      }

      return true;
    });

    return filtered.map((c: any) => ({
      id: String(c._id),
      code: c.code,
      title: c.title,
      description: c.description || "",
      type: c.type,
      scope: c.scope,
      value: Number(c.value || 0),
      minOrder: c.minOrder ?? null,
      maxDiscountCap: c.maxDiscountCap ?? null,
      startAt: c.startAt || null,
      endAt: c.endAt || null,
      status: c.status,
      usedCount: Number(c.usedCount || 0),
      globalUsageLimit: c.globalUsageLimit ?? null,
      maxUsesPerUser: c.maxUsesPerUser ?? null,
      eligibleCategoryIds: stringifyObjectIdArray(c.eligibleCategoryIds),
      eligibleProductIds: stringifyObjectIdArray(c.eligibleProductIds),
      createdAt: c.createdAt,
    }));
  },

  async collectAllAvailable(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user");
    }

    const now = new Date();

    const coupons = await Coupon.find({
      status: "ACTIVE",
      $and: [
        { $or: [{ startAt: null }, { startAt: { $lte: now } }] },
        { $or: [{ endAt: null }, { endAt: { $gte: now } }] },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    const couponIds = coupons.map((c: any) => String(c._id));

    const existing = await UserCoupon.find({
      userId: new mongoose.Types.ObjectId(userId),
      couponId: {
        $in: couponIds.map((id) => new mongoose.Types.ObjectId(id)),
      },
      status: { $in: ["COLLECTED", "USED"] },
    })
      .select("couponId")
      .lean();

    const existingSet = new Set(existing.map((e: any) => String(e.couponId)));

    const toCreate = coupons
      .filter((c: any) => !existingSet.has(String(c._id)))
      .filter((c: any) => {
        if (c.globalUsageLimit && c.globalUsageLimit > 0) {
          return Number(c.usedCount || 0) < Number(c.globalUsageLimit || 0);
        }

        return true;
      })
      .map((c: any) => ({
        userId: new mongoose.Types.ObjectId(userId),
        couponId: new mongoose.Types.ObjectId(String(c._id)),
        status: "COLLECTED",
        collectedAt: new Date(),
      }));

    if (toCreate.length) {
      await UserCoupon.insertMany(toCreate, { ordered: false });
    }

    return {
      collectedNow: toCreate.length,
      alreadyHad: existingSet.size,
      totalAvailable: coupons.length,
    };
  },

  async collectCoupon(userId: string, code: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user");
    }

    const coupon = await this.getCouponByCode(code);

    if (!coupon) throw new Error("Coupon not found");
    if ((coupon as any).status !== "ACTIVE") {
      throw new Error("Coupon is not active");
    }

    const now = new Date();

    if (!nowInRange(now, (coupon as any).startAt, (coupon as any).endAt)) {
      throw new Error("Coupon expired or not started");
    }

    if ((coupon as any).globalUsageLimit && (coupon as any).globalUsageLimit > 0) {
      if (
        Number((coupon as any).usedCount || 0) >=
        Number((coupon as any).globalUsageLimit || 0)
      ) {
        throw new Error("Coupon usage limit reached");
      }
    }

    try {
      const doc = await UserCoupon.create({
        userId: new mongoose.Types.ObjectId(userId),
        couponId: new mongoose.Types.ObjectId(String((coupon as any)._id)),
        status: "COLLECTED",
        collectedAt: new Date(),
      });

      return {
        id: String(doc._id),
        code: (coupon as any).code,
        title: (coupon as any).title,
        type: (coupon as any).type,
        scope: (coupon as any).scope,
        value: (coupon as any).value,
      };
    } catch (e: any) {
      if (String(e?.code) === "11000") {
        throw new Error("Coupon already collected");
      }

      throw e;
    }
  },

  async listMyCollected(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user");
    }

    const rows = await UserCoupon.find({
      userId: new mongoose.Types.ObjectId(userId),
      status: { $in: ["COLLECTED", "USED"] },
    })
      .populate("couponId")
      .sort({ createdAt: -1 })
      .lean();

    return (rows as any[]).map((r: any) => {
      const c = r.couponId || {};

      return {
        id: String(r._id),
        status: r.status,
        collectedAt: r.collectedAt,
        usedAt: r.usedAt || null,
        orderId: r.orderId ? String(r.orderId) : null,
        coupon: {
          id: c._id ? String(c._id) : "",
          code: c.code || "",
          title: c.title || "",
          description: c.description || "",
          type: c.type,
          scope: c.scope,
          value: Number(c.value || 0),
          minOrder: c.minOrder ?? null,
          maxDiscountCap: c.maxDiscountCap ?? null,
          status: c.status,
          startAt: c.startAt || null,
          endAt: c.endAt || null,
          eligibleCategoryIds: stringifyObjectIdArray(c.eligibleCategoryIds),
          eligibleProductIds: stringifyObjectIdArray(c.eligibleProductIds),
        },
      };
    });
  },

  async computeDiscountPaisa(args: {
    userId: string;
    couponCode: string;
    items: CartItem[];
    productMap: Map<string, any>;
    subtotalPaisa: number;
    shippingPaisa: number;
  }) {
    const {
      userId,
      couponCode,
      items,
      productMap,
      subtotalPaisa,
      shippingPaisa,
    } = args;

    if (!couponCode?.trim()) {
      return { discountPaisa: 0, applied: null as any };
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user");
    }

    const coupon = await this.getCouponByCode(couponCode);

    if (!coupon) throw new Error("Invalid coupon code");
    if ((coupon as any).status !== "ACTIVE") {
      throw new Error("Coupon is not active");
    }

    const now = new Date();

    if (!nowInRange(now, (coupon as any).startAt, (coupon as any).endAt)) {
      throw new Error("Coupon expired or not started");
    }

    const userCoupon = await UserCoupon.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      couponId: new mongoose.Types.ObjectId(String((coupon as any)._id)),
    }).lean();

    if (!userCoupon) throw new Error("You have not collected this coupon");
    if ((userCoupon as any).status === "USED") {
      throw new Error("Coupon already used");
    }

    if ((coupon as any).maxUsesPerUser && (coupon as any).maxUsesPerUser > 0) {
      const usedByUser = await UserCoupon.countDocuments({
        userId: new mongoose.Types.ObjectId(userId),
        couponId: new mongoose.Types.ObjectId(String((coupon as any)._id)),
        status: "USED",
      });

      if (usedByUser >= Number((coupon as any).maxUsesPerUser || 0)) {
        throw new Error("Coupon limit reached for this user");
      }
    }

    if ((coupon as any).globalUsageLimit && (coupon as any).globalUsageLimit > 0) {
      if (
        Number((coupon as any).usedCount || 0) >=
        Number((coupon as any).globalUsageLimit || 0)
      ) {
        throw new Error("Coupon usage limit reached");
      }
    }

    if ((coupon as any).minOrder != null) {
      const minOrderPaisa = toPaisa(Number((coupon as any).minOrder || 0));

      if (subtotalPaisa < minOrderPaisa) {
        throw new Error(`Minimum order is Rs. ${(coupon as any).minOrder}`);
      }
    }

    let eligibleSubtotalPaisa = 0;

    if ((coupon as any).scope === "ALL") {
      eligibleSubtotalPaisa = subtotalPaisa;
    } else if ((coupon as any).scope === "PRODUCT") {
      const eligible = new Set(
        (((coupon as any).eligibleProductIds || []) as any[]).map((x: any) =>
          String(x)
        )
      );

      for (const it of items) {
        const p = productMap.get(String(it.productId));
        if (!p) continue;

        if (eligible.has(String(p._id))) {
          const pricePaisa = Math.round(Number(p.price || 0) * 100);
          eligibleSubtotalPaisa += pricePaisa * Math.max(1, Number(it.qty || 1));
        }
      }
    } else if ((coupon as any).scope === "CATEGORY") {
      const eligible = new Set(
        (((coupon as any).eligibleCategoryIds || []) as any[]).map((x: any) =>
          String(x)
        )
      );

      for (const it of items) {
        const p = productMap.get(String(it.productId));
        if (!p) continue;

        if (eligible.has(String(p.categoryId))) {
          const pricePaisa = Math.round(Number(p.price || 0) * 100);
          eligibleSubtotalPaisa += pricePaisa * Math.max(1, Number(it.qty || 1));
        }
      }
    }

    if ((coupon as any).scope !== "ALL" && eligibleSubtotalPaisa <= 0) {
      throw new Error("Coupon not applicable to selected items");
    }

    let discountPaisa = 0;

    if ((coupon as any).type === "PERCENT") {
      const pct = Math.max(0, Math.min(100, Number((coupon as any).value || 0)));
      discountPaisa = Math.floor((eligibleSubtotalPaisa * pct) / 100);

      if ((coupon as any).maxDiscountCap != null) {
        const capPaisa = toPaisa(Number((coupon as any).maxDiscountCap || 0));
        discountPaisa = Math.min(discountPaisa, capPaisa);
      }
    } else if ((coupon as any).type === "FLAT") {
      const flatPaisa = toPaisa(Number((coupon as any).value || 0));
      discountPaisa = Math.min(flatPaisa, eligibleSubtotalPaisa);
    } else if ((coupon as any).type === "FREESHIP") {
      discountPaisa = Math.max(0, Number(shippingPaisa || 0));
    }

    discountPaisa = Math.max(
      0,
      Math.min(discountPaisa, subtotalPaisa + shippingPaisa)
    );

    return {
      discountPaisa,
      applied: {
        couponId: String((coupon as any)._id),
        code: (coupon as any).code,
        title: (coupon as any).title,
        type: (coupon as any).type,
        scope: (coupon as any).scope,
        value: (coupon as any).value,
      },
      userCouponId: userCoupon ? String((userCoupon as any)._id) : null,
    };
  },

  async markUsed(userCouponId: string, orderId: string) {
    if (!mongoose.Types.ObjectId.isValid(userCouponId)) return;
    if (!mongoose.Types.ObjectId.isValid(orderId)) return;

    const updated = await UserCoupon.findByIdAndUpdate(
      userCouponId,
      {
        status: "USED",
        usedAt: new Date(),
        orderId: new mongoose.Types.ObjectId(orderId),
      },
      { new: true }
    )
      .select("couponId")
      .lean();

    if (updated?.couponId) {
      await Coupon.findByIdAndUpdate(updated.couponId, {
        $inc: { usedCount: 1 },
      });
    }
  },

  async adminList() {
    const rows = await Coupon.find().sort({ createdAt: -1 }).lean();

    return (rows as any[]).map((c: any) => ({
      id: String(c._id),
      code: c.code,
      title: c.title,
      description: c.description || "",
      type: c.type,
      scope: c.scope,
      value: Number(c.value || 0),
      minOrder: c.minOrder ?? null,
      maxDiscountCap: c.maxDiscountCap ?? null,
      status: c.status,
      startAt: c.startAt || null,
      endAt: c.endAt || null,
      usedCount: Number(c.usedCount || 0),
      globalUsageLimit: c.globalUsageLimit ?? null,
      maxUsesPerUser: c.maxUsesPerUser ?? null,
      eligibleCategoryIds: stringifyObjectIdArray(c.eligibleCategoryIds),
      eligibleProductIds: stringifyObjectIdArray(c.eligibleProductIds),
      createdAt: c.createdAt,
    }));
  },

  async adminCreate(input: any) {
    const code = String(input?.code || "").trim().toUpperCase();

    if (!code) throw new Error("code is required");

    if (!/^[A-Z0-9_-]{3,20}$/.test(code)) {
      throw new Error("Code must be 3–20 chars using A-Z, 0-9, _ or -");
    }

    validateCouponInput(input);

    const existing = await Coupon.findOne({ code }).lean();

    if (existing) {
      throw new Error("Coupon code already exists");
    }

    const payload = normalizeCouponPayload(input);

    const doc = await Coupon.create({
      code,
      ...payload,
      usedCount: 0,
    });

    return {
      id: String(doc._id),
      code: doc.code,
    };
  },

  async adminUpdate(id: string, input: any) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid id");
    }

    const current = await Coupon.findById(id).lean();

    if (!current) {
      throw new Error("Coupon not found");
    }

    const merged = {
      ...(current as any),
      ...input,
      type: input?.type ?? (current as any).type,
      scope: input?.scope ?? (current as any).scope,
      status: input?.status ?? (current as any).status,
      value: input?.value ?? (current as any).value,
      minOrder:
        input?.minOrder !== undefined
          ? input.minOrder
          : (current as any).minOrder ?? null,
      maxDiscountCap:
        input?.maxDiscountCap !== undefined
          ? input.maxDiscountCap
          : (current as any).maxDiscountCap ?? null,
      globalUsageLimit:
        input?.globalUsageLimit !== undefined
          ? input.globalUsageLimit
          : (current as any).globalUsageLimit ?? null,
      maxUsesPerUser:
        input?.maxUsesPerUser !== undefined
          ? input.maxUsesPerUser
          : (current as any).maxUsesPerUser ?? null,
      startAt:
        input?.startAt !== undefined
          ? input.startAt
          : (current as any).startAt ?? null,
      endAt:
        input?.endAt !== undefined ? input.endAt : (current as any).endAt ?? null,
      eligibleCategoryIds:
        input?.eligibleCategoryIds !== undefined
          ? input.eligibleCategoryIds
          : stringifyObjectIdArray((current as any).eligibleCategoryIds),
      eligibleProductIds:
        input?.eligibleProductIds !== undefined
          ? input.eligibleProductIds
          : stringifyObjectIdArray((current as any).eligibleProductIds),
    };

    validateCouponInput(merged);

    const payload = normalizeCouponPayload(merged);
    const update: any = {};

    if (input?.title != null) update.title = payload.title;

    if (input?.description != null) {
      update.description = payload.description;
    }

    if (input?.type != null) update.type = payload.type;

    if (input?.scope != null) update.scope = payload.scope;

    if (input?.value !== undefined || payload.type === "FREESHIP") {
      update.value = payload.value;
    }

    if (input?.minOrder !== undefined) {
      update.minOrder = payload.minOrder;
    }

    if (input?.maxDiscountCap !== undefined || payload.type !== "PERCENT") {
      update.maxDiscountCap = payload.maxDiscountCap;
    }

    if (input?.eligibleCategoryIds !== undefined || input?.scope !== undefined) {
      update.eligibleCategoryIds = payload.eligibleCategoryIds;
    }

    if (input?.eligibleProductIds !== undefined || input?.scope !== undefined) {
      update.eligibleProductIds = payload.eligibleProductIds;
    }

    if (input?.startAt !== undefined) {
      update.startAt = payload.startAt;
    }

    if (input?.endAt !== undefined) {
      update.endAt = payload.endAt;
    }

    if (input?.globalUsageLimit !== undefined) {
      update.globalUsageLimit = payload.globalUsageLimit;
    }

    if (input?.maxUsesPerUser !== undefined) {
      update.maxUsesPerUser = payload.maxUsesPerUser;
    }

    if (input?.status != null) {
      update.status = payload.status;
    }

    if (payload.type === "FREESHIP") {
      update.value = 0;
      update.maxDiscountCap = null;
    }

    if (payload.type !== "PERCENT") {
      update.maxDiscountCap = null;
    }

    if (payload.scope === "ALL") {
      update.eligibleCategoryIds = [];
      update.eligibleProductIds = [];
    }

    if (payload.scope === "CATEGORY") {
      update.eligibleCategoryIds = payload.eligibleCategoryIds;
      update.eligibleProductIds = [];
    }

    if (payload.scope === "PRODUCT") {
      update.eligibleCategoryIds = [];
      update.eligibleProductIds = payload.eligibleProductIds;
    }

    const doc = await Coupon.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();

    if (!doc) {
      throw new Error("Coupon not found");
    }

    return {
      id: String((doc as any)._id),
    };
  },

  async adminDelete(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid id");
    }

    const deleted = await Coupon.findByIdAndDelete(id).lean();

    if (!deleted) {
      throw new Error("Coupon not found");
    }

    return { id };
  },

  async adminCollected() {
    const rows = await UserCoupon.find()
      .populate("userId", "name email")
      .populate("couponId")
      .sort({ createdAt: -1 })
      .lean();

    return (rows as any[]).map((r: any) => ({
      id: String(r._id),
      status: r.status,
      collectedAt: r.collectedAt,
      usedAt: r.usedAt || null,
      orderId: r.orderId ? String(r.orderId) : null,
      user: r.userId
        ? {
            id: String(r.userId._id),
            name: r.userId.name || "",
            email: r.userId.email || "",
          }
        : {
            id: "",
            name: "",
            email: "",
          },
      coupon: r.couponId
        ? {
            id: String(r.couponId._id),
            code: r.couponId.code,
            title: r.couponId.title,
            type: r.couponId.type,
          }
        : {
            id: "",
            code: "",
            title: "",
            type: "",
          },
    }));
  },
};

export default discountService;