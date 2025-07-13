
"use client";

import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Wallet, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { tokenContract } from "@/lib/contracts";

export function ConnectButton() {
  const { address, isConnected, connector } = useAccount();
  const { connect, connectors, error, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ 
    address,
    token: tokenContract.address,
  });

  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return (
       <Button disabled={true}>
         Loading...
       </Button>
    )
  }

  if (isConnected) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {address?.slice(2, 4).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="flex gap-2" disabled>
             Balance: {balance ? `${balance.value.toString()} ${balance.symbol}`: '0 AGT'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => disconnect()} className="flex gap-2 cursor-pointer text-destructive focus:text-destructive-foreground">
            <LogOut className="h-4 w-4" />
            <span>Disconnect</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={isPending}>
          {isPending ? "Connecting..." : "Connect Wallet"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Connect with</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {connectors
          .filter((c) => c.id === 'io.metamask' || c.id === 'walletConnect') // Show only metamask or walletconnect
          .map((connector) => (
          <DropdownMenuItem
            key={connector.id}
            onClick={() => connect({ connector })}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Wallet className="w-4 h-4" />
            {connector.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
