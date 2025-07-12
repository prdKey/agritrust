"use client";

import { Leaf } from "lucide-react";
import { ConnectButton } from "./ConnectButton";

export function Header() {
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold font-headline text-foreground">
              AgriTrust
            </span>
          </div>
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
