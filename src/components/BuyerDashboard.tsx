
"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContracts, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { marketplaceContract, tokenContract, type Order, type Product, type Bid } from "@/lib/contracts";
import { ProductCard } from "./ProductCard";
import { PlaceBidDialog } from "./PlaceBidDialog";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Loader2, ShoppingCart, Gavel, History } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";

export function BuyerDashboard() {
  const { address } = useAccount();
  const { toast } = useToast();
  const [selectedProductId, setSelectedProductId] = useState<bigint | null>(null);
  const [isBidDialogOpen, setBidDialogOpen] = useState(false);
  const [productToBuy, setProductToBuy] = useState<{ productId: bigint, quantity: bigint } | null>(null);

  // --- Contract Interactions ---
  const { data: approveHash, writeContract: approve, isPending: isApproving, reset: resetApprove } = useWriteContract();
  const { data: orderHash, writeContract: placeOrder, isPending: isOrdering, reset: resetOrder } = useWriteContract();

  // --- Transaction Receipts ---
  const { isLoading: isApproveConfirming, isSuccess: isApproved, error: approveReceiptError } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: isOrderConfirming, isSuccess: isOrdered, error: orderReceiptError } = useWaitForTransactionReceipt({ hash: orderHash });


  // --- Data Fetching ---
  const { data: contractReads, refetch: refetchAll, isLoading: isLoadingInitialData } = useReadContracts({
    contracts: [
      { ...marketplaceContract, functionName: 'getAllProducts' },
      { ...marketplaceContract, functionName: 'getUserOrders', args: [address!], query: { enabled: !!address } },
      { ...marketplaceContract, functionName: 'getUserBids', args: [address!], query: { enabled: !!address } },
      { ...marketplaceContract, functionName: 'operationFee' }
    ]
  });

  const [productIds, userOrderIds, userBidIds, operationFee] = contractReads?.map(r => r.result) ?? [];

  const productDetailsContracts = (productIds as bigint[] ?? []).map(id => ({
    ...marketplaceContract,
    functionName: 'getProduct',
    args: [id]
  }));

  const { data: productsData, isLoading: isLoadingProductDetails, refetch: refetchProductDetails } = useReadContracts({
    contracts: productDetailsContracts,
    query: {
      enabled: !!productIds,
    }
  });
  
  const products: Product[] = productsData
    ?.map(p => p.result as Product)
    .filter(Boolean)
    .filter(p => p.id > 4n && p.id !== 5n) ?? [];

  // User Orders
  const orderDetailsContracts = (userOrderIds as bigint[] ?? []).map(id => ({
    ...marketplaceContract, functionName: 'getOrderDetails', args: [id]
  }));

  const { data: ordersData, isLoading: isLoadingOrderDetails, refetch: refetchOrders } = useReadContracts({
    contracts: orderDetailsContracts,
    query: { enabled: !!userOrderIds }
  });

  const orders: Order[] = ordersData?.map(o => o.result as Order).filter(Boolean) ?? [];

  // User Bids
  const bidDetailsContracts = (userBidIds as bigint[] ?? []).map(id => ({
    ...marketplaceContract, functionName: 'getBidDetails', args: [id]
  }));

  const { data: bidsData, isLoading: isLoadingBidDetails, refetch: refetchBids } = useReadContracts({
    contracts: bidDetailsContracts,
    query: { enabled: !!userBidIds }
  });

  const bids: Bid[] = bidsData?.map(b => b.result as Bid).filter(Boolean).filter(b => b.id !== 1n) ?? [];

  // --- Handlers ---
  const handleBuy = (productId: bigint, quantity: bigint) => {
    const product = products.find(p => p.id === productId);
    if (!product || operationFee === undefined) {
      toast({ variant: "destructive", title: "Error", description: "Could not retrieve product details or operation fee." });
      return;
    };
    setProductToBuy({ productId, quantity });

    const totalPrice = product.price * quantity;
    const totalCost = totalPrice + (operationFee as bigint);
    
    toast({ title: "Action Required", description: "Please approve the token transfer in your wallet." });
    approve({
      ...tokenContract,
      functionName: 'approve',
      args: [marketplaceContract.address, totalCost]
    });
  };

  const handleBid = (productId: bigint) => {
    setSelectedProductId(productId);
    setBidDialogOpen(true);
  };
  
  const resetAllStates = () => {
    setProductToBuy(null);
    setSelectedProductId(null);
    resetApprove();
    resetOrder();
  };

  // --- Effects ---
  useEffect(() => {
    if (isApproved && productToBuy) {
        toast({ title: "Approval Confirmed", description: "You can now place your order." });
        placeOrder({
            ...marketplaceContract,
            functionName: 'placeOrder',
            args: [productToBuy.productId, productToBuy.quantity]
        });
    }
  }, [isApproved, productToBuy, placeOrder, toast]);

  useEffect(() => {
    if (isOrdered) {
      toast({ title: "Success!", description: "Transaction confirmed." });
      refetchAll();
      resetAllStates();
    }
    const error = approveReceiptError || orderReceiptError;
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      resetAllStates();
    }
  }, [isOrdered, approveReceiptError, orderReceiptError, toast, refetchAll]);
  
  // Clean up state if component unmounts or user changes tabs
  useEffect(() => {
    return () => {
        resetAllStates();
    }
  }, []);

  const isProcessing = isApproving || isApproveConfirming || isOrdering || isOrderConfirming;

  return (
    <>
      <Tabs defaultValue="marketplace" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="marketplace"><ShoppingCart className="w-4 h-4 mr-2"/>Marketplace</TabsTrigger>
          <TabsTrigger value="orders"><History className="w-4 h-4 mr-2"/>My Orders</TabsTrigger>
          <TabsTrigger value="bids"><Gavel className="w-4 h-4 mr-2"/>My Bids</TabsTrigger>
        </TabsList>
        <TabsContent value="marketplace" className="mt-6">
          {isLoadingInitialData || isLoadingProductDetails ? (
             <div className="flex items-center justify-center gap-2 text-muted-foreground p-8"> <Loader2 className="w-6 h-6 animate-spin" /> Loading products... </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id.toString()} product={product} onBuy={handleBuy} onBid={handleBid} isProcessing={isProcessing && productToBuy?.productId === product.id} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center p-8">No products available in the marketplace right now.</p>
          )}
        </TabsContent>
        <TabsContent value="orders" className="mt-6">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Product ID</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Total Price</TableHead>
                  <TableHead>Fulfilled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingOrderDetails ? (
                  <TableRow><TableCell colSpan={5} className="text-center"><Loader2 className="inline w-4 h-4 animate-spin"/> Loading...</TableCell></TableRow>
                ) : orders.length > 0 ? (
                  orders.map((order) => (
                    <TableRow key={order.id.toString()}>
                      <TableCell>{order.id.toString()}</TableCell>
                      <TableCell>{order.productId.toString()}</TableCell>
                      <TableCell>{order.quantity.toString()}</TableCell>
                      <TableCell>{order.totalPrice.toString()} AGT</TableCell>
                      <TableCell>{order.fulfilled ? <Badge>Yes</Badge> : <Badge variant="secondary">No</Badge>}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5} className="text-center">You have no orders.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        <TabsContent value="bids" className="mt-6">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bid ID</TableHead>
                  <TableHead>Product ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingBidDetails ? (
                  <TableRow><TableCell colSpan={4} className="text-center"><Loader2 className="inline w-4 h-4 animate-spin"/> Loading...</TableCell></TableRow>
                ) : bids.length > 0 ? (
                  bids.map((bid) => (
                    <TableRow key={bid.id.toString()}>
                      <TableCell>{bid.id.toString()}</TableCell>
                      <TableCell>{bid.productId.toString()}</TableCell>
                      <TableCell>{bid.amount.toString()} AGT</TableCell>
                      <TableCell>
                        {bid.completed ? <Badge>Completed</Badge> : bid.accepted ? <Badge variant="default">Accepted</Badge> : <Badge variant="secondary">Pending</Badge>}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={4} className="text-center">You have no bids.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
      {selectedProductId && (
          <PlaceBidDialog
            productId={selectedProductId}
            operationFee={operationFee as bigint | undefined}
            open={isBidDialogOpen}
            onOpenChange={setBidDialogOpen}
            onSuccess={() => {
                setBidDialogOpen(false);
                refetchAll();
            }}
          />
      )}
    </>
  );
}
