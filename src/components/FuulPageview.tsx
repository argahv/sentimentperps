"use client";

import { useEffect } from "react";
import { sendPageview } from "@/lib/fuul";

export function FuulPageview({ page }: { page?: string }) {
  useEffect(() => {
    sendPageview(page);
  }, [page]);

  return null;
}
