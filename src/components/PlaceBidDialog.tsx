
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { marketplaceContract, tokenContract } from "@/lib/contracts";
import { Loader2 } from "lucide-react";

const bidSchema = z.object({
  amount: z.coerce.number().int().positive("Bid amount must be a positive whole number"),
});

type BidFormValues = z.infer<typeof bidSchema>;

interface PlaceBidDialogProps {
  productId: bigint;
  operationFee: bigint | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PlaceBidDialog({ productId, operationFee, open, onOpenChange, onSuccess }: PlaceBidDialogProps) {
  const { address } = useAccount();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // --- Contract Hooks ---
  const { data: approveHash, writeContract: approve, isPending: isApproving, error: approveError, reset: resetApprove } = useWriteContract();
  const { data: bidHash, writeContract: placeBid, isPending: isBidding, error: bidError, reset: resetPlaceBid } = useWriteContract();
  
  // --- Transaction Receipt Hooks ---
  const { isLoading: isApproveConfirming, isSuccess: isApproved, error: approveReceiptError } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: isBidConfirming, isSuccess: isBidPlaced, error: bidReceiptError } = useWaitForTransactionReceipt({ hash: bidHash });

  // --- Data Hooks ---
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    ...tokenContract,
    functionName: 'allowance',
    args: [address!, marketplaceContract.address],
    query: { enabled: !!address && !!open },
  });

  const form = useForm<BidFormValues>({
    resolver: zodResolver(bidSchema),
    defaultValues: { amount: 0 },
  });
  
  const bidAmountValue = form.watch("amount");

  const onSubmit = (data: BidFormValues) => {
    if (operationFee === undefined) {
        toast({ variant: "destructive", title: "Error", description: "Could not retrieve operation fee." });
        return;
    }
    setIsSubmitting(true);
    const requiredAmount = BigInt(data.amount);
    const totalAmount = requiredAmount + operationFee;

    if (allowance !== undefined && allowance >= totalAmount) {
      placeBid({
        ...marketplaceContract,
        functionName: 'placeBid',
        args: [productId, requiredAmount]
      });
    } else {
      approve({
        ...tokenContract,
        functionName: 'approve',
        args: [marketplaceContract.address, totalAmount]
      });
    }
  };

  useEffect(() => {
    if (isApproved) {
      toast({ title: "Approval Confirmed", description: "You can now place your bid." });
      refetchAllowance();
      placeBid({
        ...marketplaceContract,
        functionName: 'placeBid',
        args: [productId, BigInt(bidAmountValue)]
      });
    }
  }, [isApproved, productId, placeBid, refetchAllowance, bidAmountValue, toast]);
  

  useEffect(() => {
    if (isBidPlaced) {
      toast({ title: "Success!", description: "Your bid has been placed." });
      setIsSubmitting(false);
      onOpenChange(false);
      onSuccess?.();
    }
  }, [isBidPlaced, toast, onOpenChange, onSuccess]);

  useEffect(() => {
    const anyError = approveError || approveReceiptError || bidError || bidReceiptError;
    if (anyError) {
      const errorMessage = anyError.message || "An unknown error occurred.";
      toast({ variant: "destructive", title: "Error", description: errorMessage });
      setIsSubmitting(false);
    }
  }, [approveError, approveReceiptError, bidError, bidReceiptError, toast]);


  useEffect(() => {
    if (!open) {
      form.reset();
      resetApprove();
      resetPlaceBid();
      setIsSubmitting(false);
    }
  }, [open, form, resetApprove, resetPlaceBid]);

  const isLoading = isApproving || isApproveConfirming || isBidding || isBidConfirming || isSubmitting;
  const buttonText = () => {
      if (isApproving) return "Check Wallet for Approval...";
      if (isApproveConfirming) return "Confirming Approval...";
      if (isBidding) return "Check Wallet to Place Bid...";
      if (isBidConfirming) return "Placing Bid...";

      if (operationFee === undefined) return "Loading...";

      const totalAmount = BigInt(bidAmountValue) + operationFee;
      
      if (allowance !== undefined && bidAmountValue > 0 && allowance >= totalAmount) {
          return "Place Bid";
      }
      return "Approve & Place Bid";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Place a Bid</DialogTitle>
          <DialogDescription>
            Enter your bid amount in AGT tokens. You might be asked to approve the token amount before placing the bid.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bid Amount (AGT)</FormLabel>
                  <FormControl><Input type="number" placeholder="e.g., 100" {...field} min="0" step="1" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {buttonText()}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
