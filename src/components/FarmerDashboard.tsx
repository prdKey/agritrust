
"use client";

import { useAccount, useReadContracts, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { marketplaceContract, tokenContract, type Product } from "@/lib/contracts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { CreateProductForm } from "./CreateProductForm";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Gavel, Info, LineChart, Loader2, PackagePlus, Send, Settings, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import React, { useEffect, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";

const transferSchema = z.object({
    recipient: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
    amount: z.coerce.number().positive("Amount must be positive"),
});
type TransferFormValues = z.infer<typeof transferSchema>;


export function FarmerDashboard() {
  const { address } = useAccount();
  const { toast } = useToast();
  
  // --- Contract write hooks ---
  const { writeContract: acceptBid, isPending: isAcceptingBid, data: acceptBidHash, error: acceptBidError, reset: resetAcceptBid } = useWriteContract();
  const { writeContract: setFee, isPending: isSettingFee, data: setFeeHash, error: setFeeError, reset: resetSetFee } = useWriteContract();
  const { writeContract: transferTokens, data: transferHash, isPending: isTransferring, error: transferError, reset: resetTransfer } = useWriteContract();

  // --- Transaction confirmation hooks ---
  const { isLoading: isConfirmingAccept, isSuccess: isConfirmedAccept, error: receiptErrorAccept } = useWaitForTransactionReceipt({ hash: acceptBidHash });
  const { isLoading: isConfirmingSetFee, isSuccess: isConfirmedSetFee, error: receiptErrorSetFee } = useWaitForTransactionReceipt({ hash: setFeeHash });
  const { isLoading: isConfirmingTransfer, isSuccess: isTransferred, error: receiptErrorTransfer } = useWaitForTransactionReceipt({ hash: transferHash });
  
  // --- State ---
  const [bidToAccept, setBidToAccept] = useState<bigint | null>(null);

  // --- Form ---
  const transferForm = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: { recipient: "", amount: 0 },
  });


  // --- Contract read hooks ---
  const { data: contractReads, refetch: refetchAll } = useReadContracts({
    contracts: [
        { ...marketplaceContract, functionName: 'getAllProducts' },
        { ...marketplaceContract, functionName: 'getUserBids', args: [address!], query: { enabled: !!address } },
        { ...marketplaceContract, functionName: 'operationFee' },
        { ...tokenContract, functionName: 'owner' },
    ]
  });

  const [productIds, userBidIds, operationFee, tokenOwner] = contractReads?.map(r => r.result) ?? [];
  const isOwner = address === tokenOwner;

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
  
  const handleTransfer = (data: TransferFormValues) => {
    transferTokens({
        ...tokenContract,
        functionName: 'transfer',
        args: [data.recipient as `0x${string}`, parseUnits(data.amount.toString(), 18)]
    })
  };

  // --- Effects for handling transaction results ---

  useEffect(() => {
    if (isConfirmedAccept) {
        toast({ title: "Success!", description: "Bid accepted successfully." });
        refetchAll();
        setBidToAccept(null);
        resetAcceptBid();
    }
    const error = acceptBidError || receiptErrorAccept;
    if (error) {
        toast({ variant: "destructive", title: "Error Accepting Bid", description: error.message });
        setBidToAccept(null);
        resetAcceptBid();
    }
  }, [isConfirmedAccept, acceptBidError, receiptErrorAccept, toast, refetchAll, resetAcceptBid]);

  useEffect(() => {
    if (isConfirmedSetFee) {
        toast({ title: "Success!", description: "Operation fee updated." });
        refetchAll();
        resetSetFee();
    }
    const error = setFeeError || receiptErrorSetFee;
    if (error) {
        toast({ variant: "destructive", title: "Error Setting Fee", description: error.message });
        resetSetFee();
    }
  }, [isConfirmedSetFee, setFeeError, receiptErrorSetFee, toast, refetchAll, resetSetFee]);

  useEffect(() => {
    if (isTransferred) {
        toast({ title: "Success!", description: "Tokens transferred successfully." });
        refetchAll();
        transferForm.reset();
        resetTransfer();
    }
    const error = transferError || receiptErrorTransfer;
    if (error) {
        toast({ variant: "destructive", title: "Error Transferring Tokens", description: error.message });
        resetTransfer();
    }
  }, [isTransferred, transferError, receiptErrorTransfer, toast, refetchAll, transferForm, resetTransfer]);


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
        
        <TabsContent value="settings" className="mt-6 grid gap-8">
             <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Tag className="w-8 h-8 text-primary" />
                        <div>
                        <CardTitle>Operation Fee</CardTitle>
                        <CardDescription>Manage the fee for marketplace operations. Only the contract owner can change this.</CardDescription>
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
                    {isOwner && (
                        <Button 
                            onClick={handleSetFeeToZero} 
                            disabled={isSettingFee || isConfirmingSetFee}
                        >
                             {(isSettingFee || isConfirmingSetFee) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Set Fee to Zero
                        </Button>
                    )}
                </CardContent>
            </Card>
            {isOwner && (
                <Card>
                    <CardHeader>
                         <div className="flex items-center gap-4">
                            <Send className="w-8 h-8 text-primary" />
                            <div>
                                <CardTitle>Transfer Tokens</CardTitle>
                                <CardDescription>As the token owner, you can transfer AGT tokens to any address.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Form {...transferForm}>
                            <form onSubmit={transferForm.handleSubmit(handleTransfer)} className="space-y-4">
                                <FormField
                                    control={transferForm.control}
                                    name="recipient"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Recipient Address</FormLabel>
                                            <FormControl><Input placeholder="0x..." {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={transferForm.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Amount (AGT)</FormLabel>
                                            <FormControl><Input type="number" placeholder="e.g., 1000" {...field} min="0" step="any"/></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={isTransferring || isConfirmingTransfer}>
                                    {(isTransferring || isConfirmingTransfer) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isConfirmingTransfer ? "Confirming..." : isTransferring ? "Check Wallet..." : "Transfer Tokens"}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            )}
        </TabsContent>
    </Tabs>
  );
}
