import { http, createConfig } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { defineChain } from "viem";

export const victionTestnet = defineChain({
  id: 89,
  name: "Viction Testnet",
  nativeCurrency: { name: "VIC", symbol: "VIC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://89.rpc.thirdweb.com/"] },
  },
  blockExplorers: {
    default: { name: "Vicscan", url: "https://testnet.vicscan.xyz" },
  },
  testnet: true,
});

export const config = createConfig({
  chains: [victionTestnet, mainnet, sepolia],
  transports: {
    [victionTestnet.id]: http(),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});
