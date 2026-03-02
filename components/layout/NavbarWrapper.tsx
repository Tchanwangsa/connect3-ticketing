"use client";

import { useNotFound } from "@/components/providers/NotFoundProvider";
import { Navbar } from "./Navbar";

export function NavbarWrapper() {
  const { isNotFound } = useNotFound();

  if (isNotFound) {
    return null;
  }

  return <Navbar />;
}
