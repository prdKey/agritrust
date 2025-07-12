
"use client";

import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/contracts";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { Loader2 } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onBuy?: (productId: bigint, quantity: bigint) => void;
  onBid?: (productId: bigint) => void;
  isProcessing?: boolean;
}

export function ProductCard({ product, onBuy, onBid, isProcessing }: ProductCardProps) {
  const { address } = useAccount();
  const isOwner = address === product.farmer;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="aspect-video relative bg-muted rounded-md mb-2">
          <Image
            src={`https://placehold.co/600x400.png`}
            alt={product.name}
            layout="fill"
            objectFit="cover"
            className="rounded-md"
            data-ai-hint="agriculture product"
          />
        </div>
        <CardTitle className="font-headline">{product.name}</CardTitle>
        <CardDescription>
          Farmer: {product.farmer.slice(0, 6)}...{product.farmer.slice(-4)}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex justify-between items-center mb-2">
          <span className="text-muted-foreground">Price</span>
          <span className="font-bold text-lg text-primary">
            {formatUnits(product.price, 18)} AGT
          </span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-muted-foreground">Unit</span>
          <span>{product.unit}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">In Stock</span>
          <span>{product.stock.toString()}</span>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        {onBuy && <Button className="w-full" onClick={() => onBuy(product.id, 1n)} disabled={isOwner || product.stock === 0n || isProcessing}>
          {isProcessing && <Loader2 className="w-4 h-4 animate-spin mr-2"/>}
          {product.stock === 0n ? "Out of Stock" : "Buy Now"}
        </Button>}
        {onBid && <Button variant="secondary" className="w-full" onClick={() => onBid(product.id)} disabled={isOwner || isProcessing}>
          Place Bid
        </Button>}
      </CardFooter>
    </Card>
  );
}
