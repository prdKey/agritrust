"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
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

export function PlaceBidDialog({ productId, open, onOpenChange, onSuccess }: PlaceBidDialogProps) {
  const { toast } = useToast();
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const form = useForm<BidFormValues>({
    resolver: zodResolver(bidSchema),
    defaultValues: { amount: 0 },
  });

  const onSubmit = (data: BidFormValues) => {
    const bidAmount = parseUnits(data.amount.toString(), 18);
    
    // Simple flow: approve then bid
    toast({ title: "Action Required", description: "Please approve the token transfer in your wallet." });
    writeContract({
      ...tokenContract,
      functionName: 'approve',
      args: [marketplaceContract.address, bidAmount]
    }, {
      onSuccess: () => {
        toast({ title: "Approval Sent", description: "Waiting for confirmation before placing bid..." });
        setTimeout(() => {
          toast({ title: "Action Required", description: "Please confirm the bid in your wallet." });
          writeContract({
            ...marketplaceContract,
            functionName: 'placeBid',
            args: [productId, bidAmount]
          });
        }, 5000); // Naive wait
      },
      onError: (err) => {
        toast({ variant: "destructive", title: "Approval Failed", description: err.message });
      }
    });
  };

  useEffect(() => {
    if (isConfirmed) {
      toast({ title: "Success!", description: "Your bid has been placed." });
      form.reset();
      onSuccess?.();
    }
    if (error) {
      toast({ variant: "destructive", title: "Error placing bid", description: error.message });
    }
  }, [isConfirmed, error, toast, form, onSuccess]);
  
  useEffect(() => {
    if(!open) {
      form.reset();
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Place a Bid</DialogTitle>
          <DialogDescription>
            Enter your bid amount in AGT tokens. You will be asked to approve the token amount before placing the bid.
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
                  <FormControl><Input type="number" placeholder="e.g., 100" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending || isConfirming}>
                {(isPending || isConfirming) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isConfirming ? "Confirming..." : isPending ? "Check Wallet..." : "Place Bid"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
