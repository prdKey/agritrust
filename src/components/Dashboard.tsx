"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FarmerDashboard } from "@/components/FarmerDashboard";
import { BuyerDashboard } from "@/components/BuyerDashboard";

type Role = "buyer" | "farmer";

export function Dashboard() {
  const [role, setRole] = useState<Role>("buyer");

  return (
    <Tabs value={role} onValueChange={(value) => setRole(value as Role)} className="w-full">
      <div className="flex justify-center mb-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="buyer">I am a Buyer</TabsTrigger>
          <TabsTrigger value="farmer">I am a Farmer</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="buyer">
        <BuyerDashboard />
      </TabsContent>
      <TabsContent value="farmer">
        <FarmerDashboard />
      </TabsContent>
    </Tabs>
  );
}
