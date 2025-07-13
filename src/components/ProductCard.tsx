
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
import { useAccount } from "wagmi";
import { Calendar, Loader2 } from "lucide-react";
import { Badge } from "./ui/badge";
import { formatDistanceToNow } from "date-fns";


interface ProductCardProps {
  product: Product;
  onBuy?: (productId: bigint, quantity: bigint) => void;
  onBid?: (productId: bigint) => void;
  isProcessing?: boolean;
}

export function ProductCard({ product, onBuy, onBid, isProcessing }: ProductCardProps) {
  const { address } = useAccount();
  const isOwner = address === product.farmer;
  const isGrowing = product.stock === 0n;

  const biddingEndDate = product.biddingEndDate ? new Date(product.biddingEndDate) : null;
  const isBiddingOpen = biddingEndDate && biddingEndDate > new Date();

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
            {isGrowing && (
                <Badge variant="secondary" className="absolute top-2 left-2">Growing</Badge>
            )}
        </div>
        <CardTitle className="font-headline">{product.name}</CardTitle>
        <CardDescription>
          Farmer: {product.farmer.slice(0, 6)}...{product.farmer.slice(-4)}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex justify-between items-center mb-2">
            <span className="text-muted-foreground">{isGrowing ? "Starting Bid" : "Price"}</span>
            <span className="font-bold text-lg text-primary">
                {product.price.toString()} AGT
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
        {isGrowing && biddingEndDate && (
            <div className="flex justify-between items-center mt-2 text-sm text-amber-600 border-t pt-2">
                <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span className="text-muted-foreground">Bidding ends</span>
                </div>
                <span>{isBiddingOpen ? `${formatDistanceToNow(biddingEndDate, { addSuffix: true })}` : "Closed"}</span>
            </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        {!isGrowing && onBuy && (
            <Button className="w-full" onClick={() => onBuy(product.id, 1n)} disabled={isOwner || product.stock === 0n || isProcessing}>
                {isProcessing && <Loader2 className="w-4 h-4 animate-spin mr-2"/>}
                {product.stock === 0n ? "Out of Stock" : "Buy Now"}
            </Button>
        )}
        {onBid && (
            <Button 
                variant={isGrowing ? "default" : "secondary"} 
                className="w-full" 
                onClick={() => onBid(product.id)} 
                disabled={isOwner || isProcessing || (isGrowing && !isBiddingOpen)}
            >
              {isGrowing ? "Bid on Future" : "Place Bid"}
            </Button>
        )}
      </CardFooter>
    </Card>
  );
}
