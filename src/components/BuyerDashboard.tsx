"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContracts, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { marketplaceContract, tokenContract, type Order, type Product, type Bid } from "@/lib/contracts";
import { ProductCard } from "./ProductCard";
import { PlaceBidDialog } from "./PlaceBidDialog";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { formatUnits, parseUnits } from "viem";
import { Loader2, ShoppingCart, Gavel, History } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";

export function BuyerDashboard() {
  const { address } = useAccount();
  const { toast } = useToast();
  const [selectedProductId, setSelectedProductId] = useState<bigint | null>(null);
  const [isBidDialogOpen, setBidDialogOpen] = useState(false);

  // --- Contract Interactions ---
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // --- Data Fetching ---
  const { data: productIds, refetch: refetchProducts, isLoading: isLoadingProducts } = useReadContracts({
    contracts: [{ ...marketplaceContract, functionName: 'getAllProducts' }]
  });

  const productDetailsContracts = (productIds?.[0]?.result ?? []).map(id => ({
    ...marketplaceContract,
    functionName: 'getProduct',
    args: [id]
  }));

  const { data: productsData, isLoading: isLoadingProductDetails, refetch: refetchProductDetails } = useReadContracts({
    contracts: productDetailsContracts,
    query: {
      enabled: !!productIds?.[0]?.result,
    }
  });
  
  const products: Product[] = productsData?.map(p => p.result as Product).filter(Boolean) ?? [];

  // User Orders
  const { data: userOrderIds, refetch: refetchOrders, isLoading: isLoadingOrders } = useReadContracts({
    contracts: [{ ...marketplaceContract, functionName: 'getUserOrders', args: [address!] }],
    query: { enabled: !!address }
  });

  const orderDetailsContracts = (userOrderIds?.[0].result ?? []).map(id => ({
    ...marketplaceContract, functionName: 'getOrderDetails', args: [id]
  }));

  const { data: ordersData, isLoading: isLoadingOrderDetails } = useReadContracts({
    contracts: orderDetailsContracts,
    query: { enabled: !!userOrderIds?.[0].result }
  });

  const orders: Order[] = ordersData?.map(o => o.result as Order).filter(Boolean) ?? [];

  // User Bids
  const { data: userBidIds, refetch: refetchBids, isLoading: isLoadingBids } = useReadContracts({
    contracts: [{ ...marketplaceContract, functionName: 'getUserBids', args: [address!] }],
    query: { enabled: !!address }
  });

  const bidDetailsContracts = (userBidIds?.[0].result ?? []).map(id => ({
    ...marketplaceContract, functionName: 'getBidDetails', args: [id]
  }));

  const { data: bidsData, isLoading: isLoadingBidDetails } = useReadContracts({
    contracts: bidDetailsContracts,
    query: { enabled: !!userBidIds?.[0].result }
  });

  const bids: Bid[] = bidsData?.map(b => b.result as Bid).filter(Boolean) ?? [];

  // --- Handlers ---
  const handleBuy = async (productId: bigint, quantity: bigint) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const totalPrice = product.price * quantity;
    
    // Simple flow: approve and then place order. A more robust solution would check allowance first.
    toast({ title: "Action Required", description: "Please approve the token transfer in your wallet." });
    writeContract({
      ...tokenContract,
      functionName: 'approve',
      args: [marketplaceContract.address, totalPrice]
    }, {
      onSuccess: (approveHash) => {
        toast({ title: "Approval Sent", description: "Waiting for confirmation..." });
        // In a real app, you'd wait for this hash to confirm before the next step.
        // For simplicity, we'll just prompt the user for the next action.
        setTimeout(() => {
          toast({ title: "Action Required", description: "Please confirm the order in your wallet." });
          writeContract({
            ...marketplaceContract,
            functionName: 'placeOrder',
            args: [productId, quantity]
          });
        }, 5000); // Naive wait
      }
    });
  };

  const handleBid = (productId: bigint) => {
    setSelectedProductId(productId);
    setBidDialogOpen(true);
  };

  useEffect(() => {
    if (isConfirmed) {
      toast({ title: "Success!", description: "Transaction confirmed." });
      refetchProducts();
      refetchProductDetails();
      refetchOrders();
      refetchBids();
    }
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  }, [isConfirmed, error, toast, refetchProducts, refetchProductDetails, refetchOrders, refetchBids]);

  return (
    <>
      <Tabs defaultValue="marketplace" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="marketplace"><ShoppingCart className="w-4 h-4 mr-2"/>Marketplace</TabsTrigger>
          <TabsTrigger value="orders"><History className="w-4 h-4 mr-2"/>My Orders</TabsTrigger>
          <TabsTrigger value="bids"><Gavel className="w-4 h-4 mr-2"/>My Bids</TabsTrigger>
        </TabsList>
        <TabsContent value="marketplace" className="mt-6">
          {(isLoadingProducts || isLoadingProductDetails) ? (
             <div className="flex items-center justify-center gap-2 text-muted-foreground p-8"> <Loader2 className="w-6 h-6 animate-spin" /> Loading products... </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id.toString()} product={product} onBuy={handleBuy} onBid={handleBid} />
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
                {isLoadingOrders || isLoadingOrderDetails ? (
                  <TableRow><TableCell colSpan={5} className="text-center"><Loader2 className="inline w-4 h-4 animate-spin"/> Loading...</TableCell></TableRow>
                ) : orders.length > 0 ? (
                  orders.map((order) => (
                    <TableRow key={order.id.toString()}>
                      <TableCell>{order.id.toString()}</TableCell>
                      <TableCell>{order.productId.toString()}</TableCell>
                      <TableCell>{order.quantity.toString()}</TableCell>
                      <TableCell>{formatUnits(order.totalPrice, 18)} AGT</TableCell>
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
                {isLoadingBids || isLoadingBidDetails ? (
                  <TableRow><TableCell colSpan={4} className="text-center"><Loader2 className="inline w-4 h-4 animate-spin"/> Loading...</TableCell></TableRow>
                ) : bids.length > 0 ? (
                  bids.map((bid) => (
                    <TableRow key={bid.id.toString()}>
                      <TableCell>{bid.id.toString()}</TableCell>
                      <TableCell>{bid.productId.toString()}</TableCell>
                      <TableCell>{formatUnits(bid.amount, 18)} AGT</TableCell>
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
            open={isBidDialogOpen}
            onOpenChange={setBidDialogOpen}
            onSuccess={() => {
                setBidDialogOpen(false);
                refetchBids();
            }}
          />
      )}
    </>
  );
}
