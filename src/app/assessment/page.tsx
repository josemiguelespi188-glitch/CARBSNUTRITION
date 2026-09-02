"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AssessmentRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/mix"); }, [router]);
  return null;
}
