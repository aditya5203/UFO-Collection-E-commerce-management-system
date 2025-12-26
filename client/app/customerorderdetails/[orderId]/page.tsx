"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";

type OrderItem = {
  id: string;
  name: string;
  size: string;
  qty: number;
  price: number;
  image: string;
};

type OrderStatus = "Pending" | "Confirmed" | "Shipped" | "Delivered" | "Cancelled";

type Order = {
  orderId: string; // "#9876543210"
  status: OrderStatus;

  customer: {
    name: string;
    email: string;
    shippingAddress: string;
  };

  items: OrderItem[];

  payment: {
    method: string;
  };

  shipping: {
    method: string;
    estimatedDelivery: string;
  };

  summary: {
    subtotal: number;
    shipping: number;
    taxes: number;
    total: number;
  };
};

export default function CustomerOrderDetailsPage() {
  const router = useRouter();
  const params = useParams<{ orderId: string }>();
  const orderIdFromUrl = params?.orderId ?? "9876543210";

  // ✅ Dummy data (replace with API later)
  const [order] = React.useState<Order>({
    orderId: `#${orderIdFromUrl}`,
    status: "Shipped",
    customer: {
      name: "Aditya Kumar",
      email: "adityaprajapati@gmail.com",
      shippingAddress: "456 Oak Avenue, Anytown,\nCA 91234",
    },
    items: [
      {
        id: "1",
        name: "Men Jacket",
        size: "M",
        qty: 1,
        price: 25,
        image: "/images/products/jacket.png",
      },
      {
        id: "2",
        name: "Blue Jeans",
        size: "32",
        qty: 1,
        price: 75,
        image: "/images/products/jeans.png",
      },
    ],
    payment: {
      method: "Credit Card (**** **** **** 1234)",
    },
    shipping: {
      method: "Standard Shipping",
      estimatedDelivery: "May 15, 2025",
    },
    summary: {
      subtotal: 100,
      shipping: 10,
      taxes: 0,
      total: 110,
    },
  });

  // ✅ Build tracking query from orderId: "#987..." -> "987..."
  const trackingNumber = order.orderId.replace("#", "");

  return (
    <>
      {/* HEADER (same style as Cart page, but NO wishlist/cart icons) */}
      <header className="sticky top-0 z-40 border-b border-[#191b2d] bg-[rgba(5,6,17,0.96)] backdrop-blur-[12px]">
        <div className="mx-auto flex h-[80px] w-full max-w-[1160px] items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="group flex items-center gap-2 rounded-full border border-[#2b2f45] px-3 py-[7px] text-[11px] uppercase tracking-[0.16em] text-white hover:bg-white hover:text-[#050611]"
              aria-label="Back"
              title="Back"
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
            <Link
              href="/homepage"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              HOME
            </Link>
            <Link
              href="/collection"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              COLLECTION
            </Link>
            <Link
              href="/about"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              ABOUT
            </Link>
            <Link
              href="/contact"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              CONTACT
            </Link>
          </nav>

          {/* ✅ No cart/wishlist */}
          <div className="w-[26px]" />
        </div>
      </header>

      {/* PAGE */}
      <main className="min-h-[calc(100vh-80px)] bg-[#070a12] text-white">
        <div className="mx-auto max-w-[1280px] px-6 py-10">
          <h1 className="text-[36px] font-semibold">Order Details</h1>

          <p className="mt-2 text-[13px] text-[#9aa3cc]">
            Order ID: <span className="text-white">{order.orderId}</span> | Status:{" "}
            <span className="text-white">{order.status}</span>
          </p>

          <div className="mt-6 h-px bg-[#2b2f45]" />

          {/* CUSTOMER INFO */}
          <section className="mt-10">
            <h2 className="text-[18px] font-semibold">Customer Information</h2>

            <div className="mt-5 rounded-[12px] border border-[#2b2f45] bg-[#0b0f1a]/60 px-6 py-2">
              <div className="grid grid-cols-12 gap-4 py-4 text-sm">
                <div className="col-span-12 md:col-span-3 text-[#9aa3cc]">
                  Name
                </div>
                <div className="col-span-12 md:col-span-9 text-white">
                  {order.customer.name}
                </div>
                <div className="col-span-12 h-px bg-[#2b2f45]" />

                <div className="col-span-12 md:col-span-3 text-[#9aa3cc]">
                  Email
                </div>
                <div className="col-span-12 md:col-span-9 text-white">
                  {order.customer.email}
                </div>
                <div className="col-span-12 h-px bg-[#2b2f45]" />

                <div className="col-span-12 md:col-span-3 text-[#9aa3cc]">
                  Shipping Address
                </div>
                <div className="col-span-12 md:col-span-9 text-white whitespace-pre-line">
                  {order.customer.shippingAddress}
                </div>
              </div>
            </div>
          </section>

          {/* ITEMS PURCHASED */}
          <section className="mt-12">
            <h2 className="text-[18px] font-semibold">Items Purchased</h2>

            <div className="mt-5 rounded-[10px] border border-[#2b2f45] bg-[#0b0f1a]/60 overflow-hidden">
              <div className="hidden md:grid grid-cols-[1.2fr_0.6fr_0.9fr_0.6fr_0.6fr] px-6 py-4 border-b border-[#2b2f45] text-[#dfe3ff]">
                <div>Product</div>
                <div>Size</div>
                <div className="text-center">Quantity</div>
                <div>Price</div>
                <div>Total</div>
              </div>

              {order.items.map((it) => (
                <div
                  key={it.id}
                  className="border-b border-[#1b2034] px-6 py-6 last:border-0"
                >
                  {/* Desktop Row */}
                  <div className="hidden md:grid grid-cols-[1.2fr_0.6fr_0.9fr_0.6fr_0.6fr] items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative h-[46px] w-[46px] overflow-hidden rounded-full border border-[#2b2f45]">
                        <Image
                          src={it.image}
                          alt={it.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span>{it.name}</span>
                    </div>

                    <span className="text-[#9aa3cc]">Size: {it.size}</span>

                    <div className="text-center text-[#9aa3cc]">{it.qty}</div>

                    <span className="text-[#9aa3cc]">Rs. {it.price}</span>

                    <span className="text-white">Rs. {it.price * it.qty}</span>
                  </div>

                  {/* Mobile Row */}
                  <div className="md:hidden flex gap-4">
                    <div className="relative h-[62px] w-[62px] overflow-hidden rounded-[12px] border border-[#2b2f45]">
                      <Image
                        src={it.image}
                        alt={it.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1">
                      <div className="font-medium">{it.name}</div>
                      <div className="mt-1 text-[#9aa3cc] text-sm">
                        Size: {it.size}
                      </div>
                      <div className="mt-1 text-[#9aa3cc] text-sm">
                        Qty: {it.qty}
                      </div>
                      <div className="mt-1 text-[#9aa3cc] text-sm">
                        Price: Rs. {it.price}
                      </div>
                      <div className="mt-1 text-white text-sm">
                        Total: Rs. {it.price * it.qty}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* PAYMENT INFO */}
          <section className="mt-12">
            <h2 className="text-[18px] font-semibold">Payment Information</h2>

            <div className="mt-5 rounded-[12px] border border-[#2b2f45] bg-[#0b0f1a]/60 px-6 py-4">
              <div className="grid grid-cols-12 gap-4 py-2 text-sm">
                <div className="col-span-12 md:col-span-3 text-[#9aa3cc]">
                  Method
                </div>
                <div className="col-span-12 md:col-span-9 text-white">
                  {order.payment.method}
                </div>
              </div>
            </div>
          </section>

          {/* SHIPPING INFO */}
          <section className="mt-12">
            <h2 className="text-[18px] font-semibold">Shipping Information</h2>

            <div className="mt-5 rounded-[12px] border border-[#2b2f45] bg-[#0b0f1a]/60 px-6 py-2">
              <div className="grid grid-cols-12 gap-4 py-4 text-sm">
                <div className="col-span-12 md:col-span-3 text-[#9aa3cc]">
                  Method
                </div>
                <div className="col-span-12 md:col-span-9 text-white">
                  {order.shipping.method}
                </div>
                <div className="col-span-12 h-px bg-[#2b2f45]" />

                <div className="col-span-12 md:col-span-3 text-[#9aa3cc]">
                  Estimated Delivery
                </div>
                <div className="col-span-12 md:col-span-9 text-white">
                  {order.shipping.estimatedDelivery}
                </div>
                <div className="col-span-12 h-px bg-[#2b2f45]" />

                {/* ✅ TRACK ORDER: go to /order-tracking */}
                <div className="col-span-12 md:col-span-3 text-[#9aa3cc]">
                  Track Order
                </div>
                <div className="col-span-12 md:col-span-9">
                  <Link
                    href={`/order-tracking?tracking=${encodeURIComponent(
                      trackingNumber
                    )}`}
                    className="text-white underline underline-offset-4 hover:text-[#c9b9ff]"
                    aria-label="Click here to track order"
                    title="Click here to track order"
                  >
                    Click here to track
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* SUMMARY */}
          <section className="mt-12 max-w-[460px] ml-auto">
            <h2 className="text-[22px] font-semibold">Summary</h2>

            <div className="mt-6 rounded-[12px] border border-[#2b2f45] bg-[#0b0f1a]/60 p-6">
              <div className="space-y-4 text-[#9aa3cc]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-white">Rs. {order.summary.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-white">Rs. {order.summary.shipping}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes</span>
                  <span className="text-white">Rs. {order.summary.taxes}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total</span>
                  <span className="text-white font-semibold">
                    Rs. {order.summary.total}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-16 text-center text-[#8b90ad] text-sm">
            © 2025 UFO Collection — All Rights Reserved
          </div>
        </div>
      </main>
    </>
  );
}
