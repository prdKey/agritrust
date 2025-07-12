"use client";

import { useAccount, useReadContracts, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { marketplaceContract, type Product } from "@/lib/contracts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { CreateProductForm } from "./CreateProductForm";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Gavel, Info, Loader2, PackagePlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import React, { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";

export function FarmerDashboard() {
  const { address } = useAccount();
  const { toast } = useToast();
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const { data: productIds, refetch: refetchProducts, isLoading: isLoadingProducts } = useReadContracts({
    contracts: [{ ...marketplaceContract, functionName: 'getAllProducts' }]
  });

  const productDetailsContracts = (productIds?.[0]?.result ?? []).map(id => ({
    ...marketplaceContract,
    functionName: 'getProduct',
    args: [id]
  }));

  const { data: productsData, isLoading: isLoadingProductDetails } = useReadContracts({
    contracts: productDetailsContracts,
    query: {
      enabled: !!productIds?.[0]?.result,
    }
  });

  const farmerProducts = productsData
    ?.map(p => p.result as Product)
    .filter(p => p && p.farmer === address) ?? [];
    
  // Bidding states
  const [bidToAccept, setBidToAccept] = useState<bigint | null>(null);
  const { data: acceptBidHash, writeContract: acceptBid, isPending: isAcceptingBid } = useWriteContract();
  const { isLoading: isConfirmingAccept, isSuccess: isConfirmedAccept } = useWaitForTransactionReceipt({ hash: acceptBidHash });


  const { data: allBids, refetch: refetchBids } = useReadContracts({
    contracts: [{ ...marketplaceContract, functionName: 'getUserBids', args: [address!] }],
    query: { enabled: !!address }
  });

  const bidDetailsContracts = (allBids?.[0]?.result ?? []).map(id => ({
    ...marketplaceContract,
    functionName: 'getBidDetails',
    args: [id]
  }));

  const { data: bidsData } = useReadContracts({
    contracts: bidDetailsContracts,
    query: { enabled: !!allBids?.[0]?.result }
  });

  // This is a simplified view of bids. A real app would need events or better contract queries.
  // We are filtering products to find which bids belong to this farmer.
  const incomingBids = bidsData
    ?.map(b => b.result)
    .filter(bid => bid && farmerProducts.some(p => p.id === bid.productId)) ?? [];

  const handleAcceptBid = (bidId: bigint) => {
    setBidToAccept(bidId);
    acceptBid({
        ...marketplaceContract,
        functionName: 'acceptBid',
        args: [bidId]
    });
  };

  useEffect(() => {
    if (isConfirmed || isConfirmedAccept) {
      toast({ title: "Success!", description: "Transaction confirmed." });
      refetchProducts();
      refetchBids();
      setBidToAccept(null);
    }
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  }, [isConfirmed, isConfirmedAccept, error, toast, refetchProducts, refetchBids]);

  return (
    <div className="grid gap-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <PackagePlus className="w-8 h-8 text-primary" />
            <div>
              <CardTitle>Create New Product</CardTitle>
              <CardDescription>Add a new product to the marketplace for buyers to purchase or bid on.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CreateProductForm onSuccess={() => refetchProducts()} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Products</CardTitle>
          <CardDescription>A list of products you have listed on the marketplace.</CardDescription>
        </CardHeader>
        <CardContent>
          {(isLoadingProducts || isLoadingProductDetails) ? (
             <div className="flex items-center gap-2 text-muted-foreground"> <Loader2 className="w-4 h-4 animate-spin" /> Loading your products... </div>
          ) : farmerProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {farmerProducts.map((product) => (
                <Card key={product.id.toString()} className="overflow-hidden">
                    <CardHeader>
                        <CardTitle className="font-headline">{product.name}</CardTitle>
                        <CardDescription>Product ID: {product.id.toString()}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p><strong>Price:</strong> {formatUnits(product.price, 18)} AGT</p>
                        <p><strong>Unit:</strong> {product.unit}</p>
                        <p><strong>Stock:</strong> {product.stock.toString()}</p>
                    </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">You haven't created any products yet.</p>
          )}
        </CardContent>
      </Card>
      
      <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Gavel className="w-8 h-8 text-primary" />
              <div>
                <CardTitle>Incoming Bids</CardTitle>
                <CardDescription>Review and accept bids from potential buyers.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Developer Note</AlertTitle>
              <AlertDescription>
                Fetching all incoming bids for a farmer is not directly supported by the current smart contract. This section shows bids on your products made by you (for demo purposes) or would require off-chain indexing in a real application.
              </AlertDescription>
            </Alert>
            
            <div className="mt-4">
            {incomingBids.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product ID</TableHead>
                            <TableHead>Bid Amount</TableHead>
                            <TableHead>Bidder</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {incomingBids.map((bid) => (
                            <TableRow key={bid.id.toString()}>
                                <TableCell>{bid.productId.toString()}</TableCell>
                                <TableCell>{formatUnits(bid.amount, 18)} AGT</TableCell>
                                <TableCell>{bid.bidder.slice(0, 6)}...{bid.bidder.slice(-4)}</TableCell>
                                <TableCell>
                                    {bid.accepted ? <Badge variant="secondary">Accepted</Badge> : <Badge>Pending</Badge>}
                                </TableCell>
                                <TableCell>
                                    {!bid.accepted && (
                                        <Button 
                                          size="sm" 
                                          onClick={() => handleAcceptBid(bid.id)}
                                          disabled={isAcceptingBid && bidToAccept === bid.id}>
                                          {(isAcceptingBid || isConfirmingAccept) && bidToAccept === bid.id ? <Loader2 className="w-4 h-4 animate-spin"/> : "Accept"}
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <p className="text-muted-foreground mt-4 text-center">No incoming bids found.</p>
            )}
            </div>
          </CardContent>
      </Card>
    </div>
  );
}
