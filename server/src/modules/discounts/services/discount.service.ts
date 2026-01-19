import mongoose from "mongoose";
import { Coupon } from "../../../models/Coupon.model";
import { UserCoupon } from "../../../models/UserCoupon.model";

type CartItem = { productId: string; qty: number };

function nowInRange(now: Date, startAt?: Date | null, endAt?: Date | null) {
  if (startAt && now < new Date(startAt)) return false;
  if (endAt && now > new Date(endAt)) return false;
  return true;
}

function toPaisa(rupees: number) {
  return Math.max(0, Math.round(Number(rupees || 0) * 100));
}

export const discountService = {
  async getCouponByCode(code: string) {
    const c = String(code || "").trim().toUpperCase();
    if (!c) return null;
    return Coupon.findOne({ code: c }).lean();
  },

  // ✅ PUBLIC: list active coupons for homepage/discounts page
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
      createdAt: c.createdAt,
    }));
  },

  // ✅ CUSTOMER: collect all available coupons
  async collectAllAvailable(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error("Invalid user");

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
      couponId: { $in: couponIds.map((id) => new mongoose.Types.ObjectId(id)) },
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
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error("Invalid user");

    const coupon = await this.getCouponByCode(code);
    if (!coupon) throw new Error("Coupon not found");
    if (coupon.status !== "ACTIVE") throw new Error("Coupon is not active");

    const now = new Date();
    if (!nowInRange(now, coupon.startAt, coupon.endAt))
      throw new Error("Coupon expired or not started");

    try {
      const doc = await UserCoupon.create({
        userId: new mongoose.Types.ObjectId(userId),
        couponId: new mongoose.Types.ObjectId(String((coupon as any)._id)),
        status: "COLLECTED",
        collectedAt: new Date(),
      });

      return {
        id: String(doc._id),
        code: coupon.code,
        title: coupon.title,
        type: coupon.type,
        scope: coupon.scope,
        value: coupon.value,
      };
    } catch (e: any) {
      if (String(e?.code) === "11000") {
        throw new Error("Coupon already collected");
      }
      throw e;
    }
  },

  async listMyCollected(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error("Invalid user");

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
          type: c.type,
          scope: c.scope,
          value: Number(c.value || 0),
          minOrder: c.minOrder ?? null,
          maxDiscountCap: c.maxDiscountCap ?? null,
          status: c.status,
          startAt: c.startAt || null,
          endAt: c.endAt || null,
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
    const { userId, couponCode, items, productMap, subtotalPaisa, shippingPaisa } = args;

    if (!couponCode?.trim()) {
      return { discountPaisa: 0, applied: null as any };
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error("Invalid user");

    const coupon = await this.getCouponByCode(couponCode);
    if (!coupon) throw new Error("Invalid coupon code");
    if (coupon.status !== "ACTIVE") throw new Error("Coupon is not active");

    const now = new Date();
    if (!nowInRange(now, coupon.startAt, coupon.endAt))
      throw new Error("Coupon expired or not started");

    const userCoupon = await UserCoupon.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      couponId: new mongoose.Types.ObjectId(String((coupon as any)._id)),
    }).lean();

    if (!userCoupon) throw new Error("You have not collected this coupon");
    if ((userCoupon as any).status === "USED") throw new Error("Coupon already used");

    if (coupon.maxUsesPerUser && coupon.maxUsesPerUser > 0) {
      const usedByUser = await UserCoupon.countDocuments({
        userId: new mongoose.Types.ObjectId(userId),
        couponId: new mongoose.Types.ObjectId(String((coupon as any)._id)),
        status: "USED",
      });
      if (usedByUser >= coupon.maxUsesPerUser)
        throw new Error("Coupon limit reached for this user");
    }

    if (coupon.globalUsageLimit && coupon.globalUsageLimit > 0) {
      if (Number((coupon as any).usedCount || 0) >= coupon.globalUsageLimit) {
        throw new Error("Coupon usage limit reached");
      }
    }

    if (coupon.minOrder != null) {
      const minOrderPaisa = toPaisa(Number(coupon.minOrder || 0));
      if (subtotalPaisa < minOrderPaisa) {
        throw new Error(`Minimum order is Rs. ${coupon.minOrder}`);
      }
    }

    let eligibleSubtotalPaisa = 0;

    if (coupon.scope === "ALL") {
      eligibleSubtotalPaisa = subtotalPaisa;
    } else if (coupon.scope === "PRODUCT") {
      const eligible = new Set(((coupon as any).eligibleProductIds || []).map((x: any) => String(x)));
      for (const it of items) {
        const p = productMap.get(String(it.productId));
        if (!p) continue;
        if (eligible.has(String(p._id))) {
          const pricePaisa = Math.round(Number(p.price || 0) * 100);
          eligibleSubtotalPaisa += pricePaisa * Math.max(1, Number(it.qty || 1));
        }
      }
    } else if (coupon.scope === "CATEGORY") {
      const eligible = new Set(((coupon as any).eligibleCategoryIds || []).map((x: any) => String(x)));
      for (const it of items) {
        const p = productMap.get(String(it.productId));
        if (!p) continue;
        if (eligible.has(String(p.categoryId))) {
          const pricePaisa = Math.round(Number(p.price || 0) * 100);
          eligibleSubtotalPaisa += pricePaisa * Math.max(1, Number(it.qty || 1));
        }
      }
    }

    if (eligibleSubtotalPaisa <= 0 && coupon.type !== "FREESHIP") {
      throw new Error("Coupon not applicable to selected items");
    }

    let discountPaisa = 0;

    if (coupon.type === "PERCENT") {
      const pct = Math.max(0, Math.min(100, Number(coupon.value || 0)));
      discountPaisa = Math.floor((eligibleSubtotalPaisa * pct) / 100);

      if (coupon.maxDiscountCap != null) {
        const capPaisa = toPaisa(Number(coupon.maxDiscountCap || 0));
        discountPaisa = Math.min(discountPaisa, capPaisa);
      }
    } else if (coupon.type === "FLAT") {
      const flatPaisa = toPaisa(Number(coupon.value || 0));
      discountPaisa = Math.min(flatPaisa, eligibleSubtotalPaisa);
    } else if (coupon.type === "FREESHIP") {
      discountPaisa = Math.min(shippingPaisa, shippingPaisa);
    }

    discountPaisa = Math.max(0, Math.min(discountPaisa, subtotalPaisa + shippingPaisa));

    return {
      discountPaisa,
      applied: {
        couponId: String((coupon as any)._id),
        code: coupon.code,
        title: coupon.title,
        type: coupon.type,
        scope: coupon.scope,
        value: coupon.value,
      },
      userCouponId: userCoupon ? String((userCoupon as any)._id) : null,
    };
  },

  async markUsed(userCouponId: string, orderId: string) {
    if (!mongoose.Types.ObjectId.isValid(userCouponId)) return;

    await UserCoupon.findByIdAndUpdate(userCouponId, {
      status: "USED",
      usedAt: new Date(),
      orderId: new mongoose.Types.ObjectId(orderId),
    });
  },

  // ---------- Admin ----------
  async adminList() {
    const rows = await Coupon.find().sort({ createdAt: -1 }).lean();
    return (rows as any[]).map((c: any) => ({
      id: String(c._id),
      code: c.code,
      title: c.title,
      type: c.type,
      scope: c.scope,
      value: c.value,
      minOrder: c.minOrder ?? null,
      maxDiscountCap: c.maxDiscountCap ?? null,
      status: c.status,
      startAt: c.startAt || null,
      endAt: c.endAt || null,
      usedCount: Number(c.usedCount || 0),
      globalUsageLimit: c.globalUsageLimit ?? null,
      maxUsesPerUser: c.maxUsesPerUser ?? null,
      createdAt: c.createdAt,
    }));
  },

  async adminCreate(input: any) {
    const code = String(input?.code || "").trim().toUpperCase();
    if (!code) throw new Error("code is required");

    const doc = await Coupon.create({
      code,
      title: String(input?.title || "Discount").trim(),
      description: String(input?.description || "").trim(),
      type: input?.type,
      scope: input?.scope || "ALL",
      value: Number(input?.value || 0),
      minOrder: input?.minOrder ?? null,
      maxDiscountCap: input?.maxDiscountCap ?? null,
      eligibleCategoryIds: Array.isArray(input?.eligibleCategoryIds) ? input.eligibleCategoryIds : [],
      eligibleProductIds: Array.isArray(input?.eligibleProductIds) ? input.eligibleProductIds : [],
      startAt: input?.startAt ? new Date(input.startAt) : null,
      endAt: input?.endAt ? new Date(input.endAt) : null,
      globalUsageLimit: input?.globalUsageLimit ?? null,
      maxUsesPerUser: input?.maxUsesPerUser ?? null,
      status: input?.status || "ACTIVE",
      usedCount: 0,
    });

    return { id: String(doc._id), code: doc.code };
  },

  async adminUpdate(id: string, input: any) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid id");

    const update: any = {};
    if (input?.title != null) update.title = String(input.title).trim();
    if (input?.description != null) update.description = String(input.description).trim();
    if (input?.type != null) update.type = input.type;
    if (input?.scope != null) update.scope = input.scope;
    if (input?.value != null) update.value = Number(input.value || 0);
    if (input?.minOrder !== undefined) update.minOrder = input.minOrder;
    if (input?.maxDiscountCap !== undefined) update.maxDiscountCap = input.maxDiscountCap;
    if (input?.eligibleCategoryIds !== undefined) update.eligibleCategoryIds = input.eligibleCategoryIds || [];
    if (input?.eligibleProductIds !== undefined) update.eligibleProductIds = input.eligibleProductIds || [];
    if (input?.startAt !== undefined) update.startAt = input.startAt ? new Date(input.startAt) : null;
    if (input?.endAt !== undefined) update.endAt = input.endAt ? new Date(input.endAt) : null;
    if (input?.globalUsageLimit !== undefined) update.globalUsageLimit = input.globalUsageLimit;
    if (input?.maxUsesPerUser !== undefined) update.maxUsesPerUser = input.maxUsesPerUser;
    if (input?.status != null) update.status = input.status;

    const doc = await Coupon.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!doc) throw new Error("Coupon not found");
    return { id: String((doc as any)._id) };
  },

  async adminDelete(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid id");
    await Coupon.findByIdAndDelete(id);
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
        ? { id: String(r.userId._id), name: r.userId.name || "", email: r.userId.email || "" }
        : { id: "", name: "", email: "" },
      coupon: r.couponId
        ? { id: String(r.couponId._id), code: r.couponId.code, title: r.couponId.title, type: r.couponId.type }
        : { id: "", code: "", title: "", type: "" },
    }));
  },
};

export default discountService;
