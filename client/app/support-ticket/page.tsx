"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

type TicketType =
  | "Damaged Item"
  | "Late Delivery"
  | "Wrong Item"
  | "Payment Issue"
  | "Other";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const API = `${API_BASE}/api`;

export default function SupportTicketPage() {
  const router = useRouter();

  const [type, setType] = React.useState<TicketType | "">("");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");

  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);
  const [err, setErr] = React.useState<string>("");
  const [ok, setOk] = React.useState<string>("");

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("auth_user");
      if (!raw) return;
      const u = JSON.parse(raw);
      if (u?.name && !name) setName(u.name);
      if (u?.email && !email) setEmail(u.email);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onPickFile = (f?: File | null) => {
    setErr("");
    setOk("");
    if (!f) {
      setFile(null);
      return;
    }
    if (!f.type.startsWith("image/")) {
      setErr("Please upload an image file (jpg, png, webp).");
      return;
    }
    const maxMb = 5;
    if (f.size > maxMb * 1024 * 1024) {
      setErr(`Image is too large. Max ${maxMb}MB allowed.`);
      return;
    }
    setFile(f);
  };

  const submit = async () => {
    setErr("");
    setOk("");

    if (!type) return setErr("Please select a ticket type.");
    if (!name.trim()) return setErr("Please enter your name.");
    if (!email.trim()) return setErr("Please enter your email.");
    if (!subject.trim()) return setErr("Please enter a subject.");
    if (!message.trim()) return setErr("Please enter your message.");

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("issueType", type); // ✅ correct backend field
      fd.append("name", name.trim());
      fd.append("email", email.trim());
      fd.append("subject", subject.trim());
      fd.append("message", message.trim());
      if (file) fd.append("image", file);

      const res = await fetch(`${API}/tickets`, {
        method: "POST",
        body: fd,
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to submit ticket.");

      setOk(`Ticket submitted: ${data?.item?.ticketCode || ""}`);
      setType("");
      setSubject("");
      setMessage("");
      setFile(null);
    } catch (e: any) {
      setErr(e?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#191b2d] bg-[rgba(5,6,17,0.96)] backdrop-blur-[12px]">
        <div className="mx-auto flex h-[80px] w-full max-w-[1160px] items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="group flex items-center gap-2 rounded-full border border-[#2b2f45] px-3 py-[7px] text-[11px] uppercase tracking-[0.16em] text-white hover:bg-white hover:text-[#050611]"
            >
              <Image
                src="/images/backarrow.png"
                width={18}
                height={18}
                alt="Back icon"
                className="brightness-0 invert group-hover:invert-0"
              />
              <span className="hidden sm:inline">Back</span>
            </button>

            <Link href="/homepage" className="flex items-center gap-2">
              <div className="h-[48px] w-[48px] overflow-hidden rounded-full border-2 border-white">
                <Image
                  src="/images/logo.png"
                  alt="UFO Collection logo"
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="text-[26px] font-bold uppercase tracking-[0.18em] text-white">
                UFO Collection
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex gap-10">
            <Link href="/homepage" className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]">
              HOME
            </Link>
            <Link href="/collection" className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]">
              COLLECTION
            </Link>
            <Link href="/about" className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]">
              ABOUT
            </Link>
            <Link href="/contact" className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]">
              CONTACT
            </Link>
          </nav>

          <Link href="/cart" aria-label="Cart" title="Cart">
            <Image
              src="/images/wishlist.png"
              width={26}
              height={26}
              alt="Cart icon"
              className="brightness-0 invert"
            />
          </Link>
        </div>
      </header>

      <main className="min-h-[calc(100vh-80px)] bg-[#070a12] text-white">
        <div className="mx-auto max-w-[1100px] px-6 py-12">
          <h1 className="text-[38px] font-semibold">Raise a Product Support Ticket</h1>
          <div className="mt-6 h-px bg-[#2b2f45]" />

          <div className="mt-10 grid gap-10 md:grid-cols-[520px_1fr]">
            <section className="rounded-[14px] border border-[#2b2f45] bg-[#0b0f1a]/60 p-6">
              {err ? (
                <div className="mb-4 rounded-[10px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {err}
                </div>
              ) : null}
              {ok ? (
                <div className="mb-4 rounded-[10px] border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-200">
                  {ok}
                </div>
              ) : null}

              <label className="block text-sm text-[#b8bfdc]">Select</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="mt-2 w-full rounded-[12px] border border-[#2b2f45] bg-[#0f1626] px-4 py-3 text-white outline-none focus:border-[#1f7cff]"
              >
                <option value="" className="bg-[#0f1626]">Choose ticket type</option>
                <option value="Damaged Item" className="bg-[#0f1626]">Damaged Item</option>
                <option value="Late Delivery" className="bg-[#0f1626]">Late Delivery</option>
                <option value="Wrong Item" className="bg-[#0f1626]">Wrong Item</option>
                <option value="Payment Issue" className="bg-[#0f1626]">Payment Issue</option>
                <option value="Other" className="bg-[#0f1626]">Other</option>
              </select>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className="mt-5 w-full rounded-[12px] border border-[#2b2f45] bg-[#0f1626] px-4 py-3 text-white placeholder:text-[#7c86b1] outline-none focus:border-[#1f7cff]"
              />

              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                type="email"
                className="mt-4 w-full rounded-[12px] border border-[#2b2f45] bg-[#0f1626] px-4 py-3 text-white placeholder:text-[#7c86b1] outline-none focus:border-[#1f7cff]"
              />

              <label className="mt-5 block text-sm text-[#b8bfdc]">Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="mt-2 w-full rounded-[12px] border border-[#2b2f45] bg-[#0f1626] px-4 py-3 text-white placeholder:text-[#7c86b1] outline-none focus:border-[#1f7cff]"
              />

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your issue..."
                rows={6}
                className="mt-4 w-full resize-none rounded-[12px] border border-[#2b2f45] bg-[#0f1626] px-4 py-3 text-white placeholder:text-[#7c86b1] outline-none focus:border-[#1f7cff]"
              />

              <div className="mt-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#b8bfdc]">Upload Image (optional)</span>
                  {file ? (
                    <button
                      type="button"
                      onClick={() => onPickFile(null)}
                      className="text-xs text-[#9aa3cc] underline hover:text-white"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>

                <label className="mt-2 flex cursor-pointer items-center justify-center rounded-[12px] border border-dashed border-[#2b2f45] bg-[#0f1626] px-4 py-6 text-center hover:border-[#1f7cff]">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onPickFile(e.target.files?.[0] || null)}
                  />
                  <div className="text-sm text-[#9aa3cc]">
                    <div className="font-medium text-white">Click to upload</div>
                    <div className="mt-1">JPG, PNG, WEBP (max 5MB)</div>
                  </div>
                </label>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={submit}
                  className="rounded-[10px] bg-[#1f7cff] px-6 py-3 text-sm font-semibold disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit Ticket"}
                </button>
              </div>
            </section>

            <aside className="rounded-[14px] border border-[#2b2f45] bg-[#0b0f1a]/40 p-6">
              <div className="text-sm uppercase tracking-[0.18em] text-[#8b90ad]">Attachment Preview</div>

              <div className="mt-4 rounded-[14px] border border-[#2b2f45] bg-[#0f1626] p-4">
                {previewUrl ? (
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[12px] border border-[#2b2f45]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl} alt="Uploaded preview" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="flex min-h-[220px] items-center justify-center text-[#9aa3cc]">
                    No image uploaded.
                  </div>
                )}
              </div>

              <div className="mt-6 text-sm text-[#9aa3cc] leading-6">
                Tip: Upload a clear photo of the product label / defect so the admin can solve your issue faster.
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
