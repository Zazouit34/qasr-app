"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VenueSetupRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/onboarding");
  }, [router]);
  return (
    <p className="p-8 text-center text-theme-sm text-gray-500 dark:text-gray-400">Redirection…</p>
  );
}
