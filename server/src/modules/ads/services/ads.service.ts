import Ad from "../../../models/ad.model";
import AdHistory from "../../../models/adHistory.model";
import cloudinary from "../../../config/cloudinary";

type MediaKind = "image" | "video";

function computeAutoStatus(startDate: Date, endDate: Date) {
  const now = new Date();
  if (endDate.getTime() < now.getTime()) return "Expired";
  if (startDate.getTime() > now.getTime()) return "Scheduled";
  return "Active";
}

function toDateOrNull(v: any) {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function addHistory(params: {
  adId: any;
  title: string;
  type: string;
  action: "Created" | "Updated" | "Activated" | "Deactivated" | "Scheduled" | "Expired" | "Deleted";
  changedBy: string;
  note?: string;
}) {
  await AdHistory.create({
    adId: params.adId,
    title: params.title,
    type: params.type,
    action: params.action,
    changedBy: params.changedBy,
    changedAt: new Date(),
    note: params.note || "",
  });
}

async function safeCloudinaryDestroy(publicId?: string | null, kind?: MediaKind) {
  const pid = String(publicId || "").trim();
  if (!pid) return;

  const resource_type = kind === "video" ? "video" : "image";

  try {
    await cloudinary.uploader.destroy(pid, { resource_type });
  } catch {
    // ignore cloudinary delete errors
  }
}

async function safeCloudinaryDestroyMany(publicIds: string[] | undefined, kind?: MediaKind) {
  const list = Array.isArray(publicIds) ? publicIds.map((x) => String(x || "").trim()).filter(Boolean) : [];
  if (!list.length) return;

  // Cloudinary destroy is per publicId, do sequential to be safe
  for (const pid of list) {
    await safeCloudinaryDestroy(pid, kind);
  }
}

function detectKind(payload: any, fileOrFiles: { mimetype?: string } | undefined): MediaKind {
  if (String(payload?.mediaKind || "").trim() === "video") return "video";
  if (fileOrFiles?.mimetype?.startsWith("video/")) return "video";
  return "image";
}

function uploadedToUrlAndId(file: any) {
  return {
    url: String(file?.path || "").trim(),
    publicId: String(file?.filename || "").trim(),
  };
}

export const adService = {
  /* ===================== PUBLIC (HOMEPAGE) ===================== */
  publicList: async (query: any) => {
    const position = String(query.position || "").trim();
    const status = String(query.status || "Active").trim();
    const audience = String(query.audience || "").trim();

    const now = new Date();

    const where: any = {
      startDate: { $lte: now },
      endDate: { $gte: now },
      status: status || "Active",
    };

    if (position) where.position = position;
    if (audience) where.audience = audience;

    const items = await Ad.find(where).sort({ priority: 1, createdAt: -1 }).lean();

    return items.map((x: any) => {
      const mediaUrls = Array.isArray(x.mediaUrls) ? x.mediaUrls.filter(Boolean) : [];
      return {
        id: String(x._id),
        title: x.title,
        mediaKind: x.mediaKind,
        mediaUrl: x.mediaUrl, // fallback
        mediaUrls, // ✅ homepage can use slider
        clickUrl: x.clickUrl || "",
        priority: x.priority ?? 999,
        position: x.position,
        type: x.type,
      };
    });
  },

  /* ===================== ADMIN LIST ===================== */
  adminList: async (query: any) => {
    const q = String(query.q || "").trim();
    const type = String(query.type || "").trim();
    const status = String(query.status || "").trim();
    const audience = String(query.audience || "").trim();

    const where: any = {};
    if (q) where.title = { $regex: q, $options: "i" };
    if (type && type !== "All") where.type = type;
    if (status && status !== "All") where.status = status;
    if (audience && audience !== "All") where.audience = audience;

    const items = await Ad.find(where).sort({ createdAt: -1 }).lean();

    return items.map((x: any) => ({
      id: String(x._id),
      title: x.title,
      type: x.type,
      status: x.status,
      startDate: x.startDate?.toISOString().slice(0, 10),
      endDate: x.endDate?.toISOString().slice(0, 10),
      audience: x.audience,
      mediaKind: x.mediaKind,
      mediaUrl: x.mediaUrl,
      mediaUrls: Array.isArray(x.mediaUrls) ? x.mediaUrls : [],
      clickUrl: x.clickUrl || "",
      position: x.position,
      priority: x.priority ?? 999,
      createdAt: x.createdAt,
      updatedAt: x.updatedAt,
    }));
  },

  /* ===================== ADMIN CREATE ===================== */
  create: async (
    payload: any,
    single: Express.Multer.File | undefined,
    multi: Express.Multer.File[] | undefined,
    changedBy: string
  ) => {
    const startDate = toDateOrNull(payload.startDate);
    const endDate = toDateOrNull(payload.endDate);

    if (!String(payload.title || "").trim()) throw new Error("Title is required");
    if (!String(payload.type || "").trim()) throw new Error("Type is required");
    if (!startDate || !endDate) throw new Error("Start/End date is required");
    if (endDate.getTime() < startDate.getTime()) throw new Error("End date must be >= start date");

    const type = String(payload.type).trim();

    const hasMulti = Array.isArray(multi) && multi.length > 0;
    const hasSingle = Boolean(single);

    if (!hasMulti && !hasSingle) throw new Error("Media file is required (image/video)");

    // Decide media kind
    const mediaKind: MediaKind = detectKind(payload, hasSingle ? single : multi?.[0]);

    // ✅ If Carousel + image => store multiple
    let mediaUrls: string[] = [];
    let mediaPublicIds: string[] = [];

    if (type === "Carousel" && mediaKind === "image") {
      const files = hasMulti ? multi! : hasSingle ? [single!] : [];
      if (!files.length) throw new Error("Carousel requires 1+ images");

      for (const f of files) {
        const { url, publicId } = uploadedToUrlAndId(f as any);
        if (url) mediaUrls.push(url);
        if (publicId) mediaPublicIds.push(publicId);
      }
      if (!mediaUrls.length) throw new Error("Carousel upload failed");
    }

    // Backward compatible single mediaUrl
    let mediaUrl = "";
    let mediaPublicId: string | null = null;

    if (type === "Carousel" && mediaKind === "image") {
      mediaUrl = mediaUrls[0]; // first slide
      mediaPublicId = mediaPublicIds[0] || null;
    } else {
      const use = single || (hasMulti ? multi![0] : undefined);
      const { url, publicId } = uploadedToUrlAndId(use as any);
      mediaUrl = url;
      mediaPublicId = publicId || null;
      if (!mediaUrl) throw new Error("Upload failed");
    }

    const requestedStatus = String(payload.status || "Inactive").trim();
    const autoStatus = computeAutoStatus(startDate, endDate);
    const finalStatus = requestedStatus === "Inactive" ? "Inactive" : autoStatus;

    const ad = await Ad.create({
      title: String(payload.title).trim(),
      type,
      status: finalStatus,

      startDate,
      endDate,

      audience: payload.audience || "All Customers",
      position: payload.position || "Home Top",
      priority: Number(payload.priority || 999),

      clickUrl: String(payload.clickUrl || "").trim(),

      mediaKind,
      mediaUrl,
      mediaPublicId,

      // ✅ new
      mediaUrls,
      mediaPublicIds,

      createdBy: changedBy,
      updatedBy: changedBy,
    });

    await addHistory({
      adId: ad._id,
      title: ad.title,
      type: ad.type,
      action: "Created",
      changedBy,
      note: "Advertisement created",
    });

    return ad;
  },

  /* ===================== ADMIN UPDATE ===================== */
  update: async (
    id: string,
    payload: any,
    single: Express.Multer.File | undefined,
    multi: Express.Multer.File[] | undefined,
    changedBy: string
  ) => {
    const ad = await Ad.findById(id);
    if (!ad) throw new Error("Ad not found");

    const startDate = payload.startDate ? toDateOrNull(payload.startDate) : ad.startDate;
    const endDate = payload.endDate ? toDateOrNull(payload.endDate) : ad.endDate;

    if (!startDate || !endDate) throw new Error("Invalid start/end date");
    if (endDate.getTime() < startDate.getTime()) throw new Error("End date must be >= start date");

    // Update base fields
    if (payload.title !== undefined) ad.title = String(payload.title).trim();
    if (payload.type !== undefined) ad.type = String(payload.type).trim() as any;
    if (payload.audience !== undefined) ad.audience = String(payload.audience).trim() as any;
    if (payload.position !== undefined) ad.position = String(payload.position).trim() as any;
    if (payload.clickUrl !== undefined) ad.clickUrl = String(payload.clickUrl).trim();
    if (payload.priority !== undefined) ad.priority = Number(payload.priority);

    ad.startDate = startDate;
    ad.endDate = endDate;

    const hasMulti = Array.isArray(multi) && multi.length > 0;
    const hasSingle = Boolean(single);

    // ✅ replace media if new upload exists
    if (hasSingle || hasMulti) {
      const nextKind: MediaKind = detectKind(payload, hasSingle ? single : multi?.[0]);
      const nextType = String(ad.type || "").trim();

      // delete old (single + multi)
      await safeCloudinaryDestroy(ad.mediaPublicId as any, ad.mediaKind as any);
      await safeCloudinaryDestroyMany(ad.mediaPublicIds as any, ad.mediaKind as any);

      if (nextType === "Carousel" && nextKind === "image") {
        const files = hasMulti ? multi! : hasSingle ? [single!] : [];
        const urls: string[] = [];
        const pids: string[] = [];

        for (const f of files) {
          const { url, publicId } = uploadedToUrlAndId(f as any);
          if (url) urls.push(url);
          if (publicId) pids.push(publicId);
        }
        if (!urls.length) throw new Error("Carousel upload failed");

        (ad as any).mediaKind = "image";
        (ad as any).mediaUrls = urls;
        (ad as any).mediaPublicIds = pids;

        // keep old field valid
        (ad as any).mediaUrl = urls[0];
        (ad as any).mediaPublicId = pids[0] || null;
      } else {
        const use = single || (hasMulti ? multi![0] : undefined);
        const { url, publicId } = uploadedToUrlAndId(use as any);
        if (!url) throw new Error("Upload failed");

        (ad as any).mediaKind = nextKind;
        (ad as any).mediaUrl = url;
        (ad as any).mediaPublicId = publicId || null;

        // clear carousel arrays
        (ad as any).mediaUrls = [];
        (ad as any).mediaPublicIds = [];
      }
    }

    // Status rule
    if (payload.status !== undefined) {
      const requestedStatus = String(payload.status).trim();
      if (requestedStatus === "Inactive") ad.status = "Inactive" as any;
      else ad.status = computeAutoStatus(startDate, endDate) as any;
    } else {
      if (ad.status !== ("Inactive" as any)) {
        ad.status = computeAutoStatus(startDate, endDate) as any;
      }
    }

    ad.updatedBy = changedBy;
    await ad.save();

    await addHistory({
      adId: ad._id,
      title: ad.title,
      type: ad.type,
      action: "Updated",
      changedBy,
      note: "Advertisement updated",
    });

    return ad;
  },

  /* ===================== ADMIN DELETE ===================== */
  remove: async (id: string, changedBy: string) => {
    const ad = await Ad.findById(id);
    if (!ad) throw new Error("Ad not found");

    await safeCloudinaryDestroy(ad.mediaPublicId as any, ad.mediaKind as any);
    await safeCloudinaryDestroyMany(ad.mediaPublicIds as any, ad.mediaKind as any);

    await addHistory({
      adId: ad._id,
      title: ad.title,
      type: ad.type,
      action: "Deleted",
      changedBy,
      note: "Advertisement deleted",
    });

    await ad.deleteOne();
    return true;
  },

  /* ===================== ADMIN TOGGLE ACTIVE/INACTIVE ===================== */
  toggleActive: async (id: string, makeActive: boolean, changedBy: string) => {
    const ad = await Ad.findById(id);
    if (!ad) throw new Error("Ad not found");

    if (makeActive) {
      ad.status = computeAutoStatus(ad.startDate, ad.endDate) as any;

      await addHistory({
        adId: ad._id,
        title: ad.title,
        type: ad.type,
        action: "Activated",
        changedBy,
        note: "Ad activated",
      });
    } else {
      ad.status = "Inactive" as any;

      await addHistory({
        adId: ad._id,
        title: ad.title,
        type: ad.type,
        action: "Deactivated",
        changedBy,
        note: "Ad deactivated",
      });
    }

    ad.updatedBy = changedBy;
    await ad.save();
    return ad;
  },

  /* ===================== HISTORY ===================== */
  historyList: async (query: any) => {
    const q = String(query.q || "").trim();
    const type = String(query.type || "").trim();
    const action = String(query.action || "").trim();

    const where: any = {};
    if (q) {
      where.$or = [
        { title: { $regex: q, $options: "i" } },
        { changedBy: { $regex: q, $options: "i" } },
        { action: { $regex: q, $options: "i" } },
      ];
    }
    if (type && type !== "All") where.type = type;
    if (action && action !== "All") where.action = action;

    const items = await AdHistory.find(where).sort({ changedAt: -1 }).lean();

    return items.map((x: any) => ({
      id: String(x._id),
      title: x.title,
      type: x.type,
      action: x.action,
      changedBy: x.changedBy,
      changedAt: x.changedAt,
      note: x.note || "",
    }));
  },
};
