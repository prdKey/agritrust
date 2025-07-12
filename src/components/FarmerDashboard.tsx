"use client";

import { useAccount, useReadContracts, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { marketplaceContract, type Product } from "@/lib/contracts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { CreateProductForm } from "./CreateProductForm";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Gavel, Info, LineChart, Loader2, PackagePlus, Settings, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import React, { useEffect, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { AnalyticsDashboard } from "./AnalyticsDashboard";

export function FarmerDashboard() {
  const { address } = useAccount();
  const { toast } = useToast();
  
  // --- Contract write hooks ---
  const { writeContract: acceptBid, isPending: isAcceptingBid, data: acceptBidHash, error: acceptBidError, reset: resetAcceptBid } = useWriteContract();
  const { writeContract: setFee, isPending: isSettingFee, data: setFeeHash, error: setFeeError, reset: resetSetFee } = useWriteContract();

  // --- Transaction confirmation hooks ---
  const { isLoading: isConfirmingAccept, isSuccess: isConfirmedAccept } = useWaitForTransactionReceipt({ hash: acceptBidHash });
  const { isLoading: isConfirmingSetFee, isSuccess: isConfirmedSetFee } = useWaitForTransactionReceipt({ hash: setFeeHash });
  
  // --- State ---
  const [bidToAccept, setBidToAccept] = useState<bigint | null>(null);

  // --- Contract read hooks ---
  const { data: contractReads, refetch: refetchAll } = useReadContracts({
    contracts: [
        { ...marketplaceContract, functionName: 'getAllProducts' },
        { ...marketplaceContract, functionName: 'getUserBids', args: [address!], query: { enabled: !!address } },
        { ...marketplaceContract, functionName: 'operationFee' }
    ]
  });

  const [productIds, userBidIds, operationFee] = contractReads?.map(r => r.result) ?? [];

  const productDetailsContracts = (productIds as bigint[] ?? []).map(id => ({
    ...marketplaceContract,
    functionName: 'getProduct',
    args: [id]
  }));

  const { data: productsData, isLoading: isLoadingProductDetails } = useReadContracts({
    contracts: productDetailsContracts,
    query: { enabled: !!productIds }
  });

  const farmerProducts = productsData
    ?.map(p => p.result as Product)
    .filter(p => p && p.farmer === address) ?? [];
    
  const bidDetailsContracts = (userBidIds as bigint[] ?? []).map(id => ({
    ...marketplaceContract,
    functionName: 'getBidDetails',
    args: [id]
  }));

  const { data: bidsData } = useReadContracts({
    contracts: bidDetailsContracts,
    query: { enabled: !!userBidIds }
  });

  const incomingBids = bidsData
    ?.map(b => b.result)
    .filter(bid => bid && farmerProducts.some(p => p.id === bid.productId)) ?? [];

  // --- Handlers ---
  const handleAcceptBid = (bidId: bigint) => {
    setBidToAccept(bidId);
    acceptBid({
        ...marketplaceContract,
        functionName: 'acceptBid',
        args: [bidId]
    });
  };

  const handleSetFeeToZero = () => {
    setFee({
        ...marketplaceContract,
        functionName: 'setOperationFee',
        args: [0n]
    });
  };

  const resetAllStates = () => {
    setBidToAccept(null);
    resetAcceptBid();
    resetSetFee();
  }

  useEffect(() => {
    if (isConfirmedAccept || isConfirmedSetFee) {
      toast({ title: "Success!", description: "Transaction confirmed." });
      refetchAll();
      resetAllStates();
    }
    const anyError = acceptBidError || setFeeError;
    if (anyError) {
      toast({ variant: "destructive", title: "Error", description: anyError.message });
      resetAllStates();
    }
  }, [isConfirmedAccept, isConfirmedSetFee, acceptBidError, setFeeError, toast, refetchAll]);

  const isLoadingProducts = contractReads === undefined || isLoadingProductDetails;

  return (
    <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="products"><PackagePlus className="w-4 h-4 mr-2"/>Products</TabsTrigger>
            <TabsTrigger value="bids"><Gavel className="w-4 h-4 mr-2"/>Incoming Bids</TabsTrigger>
            <TabsTrigger value="analytics"><LineChart className="w-4 h-4 mr-2"/>Analytics</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-2"/>Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="grid gap-8 mt-6">
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
                    <CreateProductForm onSuccess={() => refetchAll()} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>My Products</CardTitle>
                    <CardDescription>A list of products you have listed on the marketplace.</CardDescription>
                </CardHeader>
                <CardContent>
                {isLoadingProducts ? (
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
        </TabsContent>
        
        <TabsContent value="bids" className="mt-6">
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
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
            <AnalyticsDashboard products={farmerProducts} />
        </TabsContent>
        
        <TabsContent value="settings" className="mt-6">
             <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Tag className="w-8 h-8 text-primary" />
                        <div>
                        <CardTitle>Operation Fee</CardTitle>
                        <CardDescription>Manage the fee for marketplace operations.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="grid gap-4">
                   <div className="flex items-center justify-between p-4 border rounded-lg">
                        <p className="font-medium">Current Fee</p>
                        <p className="text-lg font-bold font-mono">
                            {operationFee !== undefined ? `${formatUnits(operationFee as bigint, 18)} AGT` : <Loader2 className="w-4 h-4 animate-spin" />}
                        </p>
                   </div>
                   <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Note</AlertTitle>
                        <AlertDescription>
                            This fee is applied to certain transactions on the marketplace. Only the contract owner can change this fee.
                        </AlertDescription>
                    </Alert>
                    <Button 
                        onClick={handleSetFeeToZero} 
                        disabled={isSettingFee || isConfirmingSetFee}
                    >
                         {(isSettingFee || isConfirmingSetFee) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Set Fee to Zero
                    </Button>
                </CardContent>
            </Card>
        </TabsContent>
    </Tabs>
  );
}
