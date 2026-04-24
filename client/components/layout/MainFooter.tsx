import Link from "next/link";

export default function MainFooter() {
  return (
    <footer className="bg-[#0a0a0f] py-10 pb-5">
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-8 border-b border-[#1b1e2b] px-4 pb-8 sm:px-5 md:grid-cols-2 lg:grid-cols-[1.4fr_0.9fr_0.9fr_1fr] lg:px-6">
        <div>
          <div className="text-[18px] font-semibold uppercase tracking-[0.12em] text-white">
            UFO Collection
          </div>

          <p className="mt-3 max-w-[420px] text-[13px] leading-7 text-[#a7aec4]">
            UFO Collection brings modern, minimal, and premium fashion to your
            everyday wardrobe with a shopping experience designed for Nepal.
          </p>
        </div>

        <div>
          <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#a7aec4]">
            Company
          </div>

          <ul className="grid gap-2 text-[13px] text-[#d6dbeb]">
            <li>
              <Link href="/homepage" className="transition hover:text-white">
                Home
              </Link>
            </li>
            <li>
              <Link href="/about" className="transition hover:text-white">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/collection" className="transition hover:text-white">
                Collection
              </Link>
            </li>
            <li>
              <Link href="/contact" className="transition hover:text-white">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#a7aec4]">
            Support
          </div>

          <ul className="grid gap-2 text-[13px] text-[#d6dbeb]">
            <li>Delivery Information</li>
            <li>Return Policy</li>
            <li>Privacy Policy</li>
            <li>Help Center</li>
          </ul>
        </div>

        <div>
          <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#a7aec4]">
            Get In Touch
          </div>

          <ul className="grid gap-2 text-[13px] text-[#d6dbeb]">
            <li>+977 9804880758</li>
            <li>ufocollection075@gmail.com</li>
            <li>
              Bhanu Chowk – 04, JanakpurDham, Madhesh Pradesh, Dhanusha, Nepal
            </li>
          </ul>
        </div>
      </div>

      <div className="px-4 pt-5 text-center text-[11px] text-[#6f768e] sm:px-5 lg:px-6">
        Copyright 2025 © UFO Collection — All Rights Reserved.
      </div>
    </footer>
  );
}