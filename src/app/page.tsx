"use client";

import { useAccount } from "wagmi";
import { Header } from "@/components/Header";
import { Dashboard } from "@/components/Dashboard";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "@/components/ConnectButton";
import { Leaf, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const { isConnected } = useAccount();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const renderContent = () => {
    if (!hasMounted) {
      return (
        <div className="text-center flex flex-col items-center justify-center h-full gap-6">
          <Loader2 className="w-24 h-24 text-primary animate-spin" />
          <h1 className="text-4xl md:text-5xl font-bold font-headline">Loading...</h1>
        </div>
      )
    }

    if (isConnected) {
      return <Dashboard />;
    }

    return (
      <div className="text-center flex flex-col items-center justify-center h-full gap-6">
        <Leaf className="w-24 h-24 text-primary" />
        <h1 className="text-4xl md:text-5xl font-bold font-headline">Welcome to AgriTrust</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          The decentralized marketplace connecting farmers directly with buyers.
          Connect your wallet to get started.
        </p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col">
        {renderContent()}
      </main>
    </div>
  );
}
