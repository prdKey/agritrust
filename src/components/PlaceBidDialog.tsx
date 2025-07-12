"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { parseUnits } from "viem";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { marketplaceContract, tokenContract } from "@/lib/contracts";
import { Loader2 } from "lucide-react";

const bidSchema = z.object({
  amount: z.coerce.number().positive("Bid amount must be positive"),
});

type BidFormValues = z.infer<typeof bidSchema>;

interface PlaceBidDialogProps {
  productId: bigint;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type TransactionStep = "idle" | "approving" | "approve-confirming" | "bidding" | "bid-confirming";

export function PlaceBidDialog({ productId, open, onOpenChange, onSuccess }: PlaceBidDialogProps) {
  const { address } = useAccount();
  const { toast } = useToast();
  const [step, setStep] = useState<TransactionStep>("idle");
  
  // --- Contract Hooks ---
  const { data: approveHash, writeContract: approve, reset: resetApprove } = useWriteContract();
  const { data: bidHash, writeContract: placeBid, reset: resetPlaceBid } = useWriteContract();
  
  // --- Transaction Receipt Hooks ---
  const { isLoading: isApproving, isSuccess: isApproved } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: isBidding, isSuccess: isBidPlaced } = useWaitForTransactionReceipt({ hash: bidHash });

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
  
  const bidAmount = parseUnits(form.watch("amount")?.toString() || '0', 18);

  const onSubmit = (data: BidFormValues) => {
    const requiredAmount = parseUnits(data.amount.toString(), 18);
    if (allowance !== undefined && allowance >= requiredAmount) {
      setStep("bidding");
      placeBid({
        ...marketplaceContract,
        functionName: 'placeBid',
        args: [productId, requiredAmount]
      });
    } else {
      setStep("approving");
      approve({
        ...tokenContract,
        functionName: 'approve',
        args: [marketplaceContract.address, requiredAmount]
      });
    }
  };

  useEffect(() => {
    if(isApproving) setStep("approve-confirming");
  }, [isApproving]);

  useEffect(() => {
    if (isApproved) {
      toast({ title: "Approval Confirmed", description: "You can now place your bid." });
      refetchAllowance();
      setStep("bidding");
      placeBid({
        ...marketplaceContract,
        functionName: 'placeBid',
        args: [productId, bidAmount]
      });
    }
  }, [isApproved, productId, placeBid, refetchAllowance, bidAmount, toast]);
  
  useEffect(() => {
    if(isBidding) setStep("bid-confirming");
  }, [isBidding]);

  useEffect(() => {
    if (isBidPlaced) {
      toast({ title: "Success!", description: "Your bid has been placed." });
      form.reset();
      setStep("idle");
      resetApprove();
      resetPlaceBid();
      onSuccess?.();
    }
  }, [isBidPlaced, toast, form, onSuccess, resetApprove, resetPlaceBid]);

  useEffect(() => {
    if (!open) {
      form.reset();
      setStep("idle");
      resetApprove();
      resetPlaceBid();
    }
  }, [open, form, resetApprove, resetPlaceBid]);

  const isLoading = isApproving || isBidding;
  const buttonText = () => {
    switch (step) {
      case 'approving': return "Check Wallet for Approval...";
      case 'approve-confirming': return "Confirming Approval...";
      case 'bidding': return "Check Wallet to Place Bid...";
      case 'bid-confirming': return "Placing Bid...";
      default:
        if (allowance !== undefined && allowance >= bidAmount) {
          return "Place Bid";
        }
        return "Approve & Place Bid";
    }
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
                  <FormControl><Input type="number" placeholder="e.g., 100" {...field} min="0" step="any" /></FormControl>
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
