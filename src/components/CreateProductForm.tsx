"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { marketplaceContract } from "@/lib/contracts";
import { Loader2 } from "lucide-react";

const productSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  price: z.coerce.number().positive("Price must be positive"),
  unit: z.string().min(1, "Unit is required (e.g., kg, piece, bundle)"),
  quantity: z.coerce.number().int().positive("Quantity must be a positive whole number"),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative"),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface CreateProductFormProps {
  onSuccess?: () => void;
}

export function CreateProductForm({ onSuccess }: CreateProductFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const { data: hash, writeContract, isPending, error: writeError, reset } = useWriteContract();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", price: 0, unit: "", quantity: 1, stock: 0 },
  });

  const { isLoading: isConfirming, isSuccess: isConfirmed, error: receiptError } = useWaitForTransactionReceipt({ hash });

  const onSubmit = (data: ProductFormValues) => {
    writeContract({
      ...marketplaceContract,
      functionName: "createProduct",
      args: [
        data.name,
        parseUnits(data.price.toString(), 18),
        data.unit,
        BigInt(data.quantity),
        BigInt(data.stock),
      ],
    });
  };

  useEffect(() => {
    if (isConfirmed) {
      toast({ title: "Success!", description: "Product created successfully." });
      setIsOpen(false);
      onSuccess?.();
    }
    if (writeError || receiptError) {
      const errorMessage = writeError?.message || receiptError?.message || "An unknown error occurred.";
      toast({ variant: "destructive", title: "Error creating product", description: errorMessage });
    }
  }, [isConfirmed, writeError, receiptError, toast, onSuccess]);

  useEffect(() => {
    if(!isOpen) {
        form.reset();
        reset();
    }
  }, [isOpen, form, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Create Product</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a New Product</DialogTitle>
          <DialogDescription>
            Fill in the details below to list your product on the marketplace.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl><Input placeholder="e.g., Organic Tomatoes" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (in AGT)</FormLabel>
                  <FormControl><Input type="number" placeholder="e.g., 5.5" {...field} min="0" step="any" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit</FormLabel>
                  <FormControl><Input placeholder="e.g., kg, lbs, piece" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity per Unit</FormLabel>
                  <FormControl><Input type="number" placeholder="e.g., 1" {...field} min="1" step="1" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Stock</FormLabel>
                  <FormControl><Input type="number" placeholder="e.g., 100" {...field} min="0" step="1" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending || isConfirming}>
                {(isPending || isConfirming) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isConfirming ? "Confirming..." : isPending ? "Check Wallet..." : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
