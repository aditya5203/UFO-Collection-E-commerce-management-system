"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export default function DeliveryRootPage() {
  const router = useRouter();

  React.useEffect(() => {
    router.replace("/delivery/dashboard");
  }, [router]);

  return (
    <div className="grid min-h-screen place-items-center bg-[#03101f] text-[13px] text-[#9ca3af]">
      Redirecting...
    </div>
  );
}