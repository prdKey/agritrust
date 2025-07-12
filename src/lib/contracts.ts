export const tokenContract = {
  address: "0x87D58253DE27A6247Aa76223B773D326AC77Ea2c",
  abi: [
    {
      "type": "constructor",
      "inputs": [
        {"name": "name_", "type": "string"},
        {"name": "symbol_", "type": "string"},
        {"name": "decimals_", "type": "uint8"},
        {"name": "initialSupply", "type": "uint256"},
        {"name": "minFee_", "type": "uint256"}
      ],
      "stateMutability": "nonpayable"
    },
    { "type": "function", "name": "allowance", "inputs": [{"name": "owner", "type": "address"}, {"name": "spender", "type": "address"}], "outputs": [{"name": "", "type": "uint256"}], "stateMutability": "view" },
    { "type": "function", "name": "approve", "inputs": [{"name": "spender", "type": "address"}, {"name": "amount", "type": "uint256"}], "outputs": [{"name": "", "type": "bool"}], "stateMutability": "nonpayable" },
    { "type": "function", "name": "balanceOf", "inputs": [{"name": "account", "type": "address"}], "outputs": [{"name": "", "type": "uint256"}], "stateMutability": "view" },
    { "type": "function", "name": "decimals", "inputs": [], "outputs": [{"name": "", "type": "uint8"}], "stateMutability": "view" },
    { "type": "function", "name": "decreaseAllowance", "inputs": [{"name": "spender", "type": "address"}, {"name": "subtractedValue", "type": "uint256"}], "outputs": [{"name": "", "type": "bool"}], "stateMutability": "nonpayable" },
    { "type": "function", "name": "increaseAllowance", "inputs": [{"name": "spender", "type": "address"}, {"name": "addedValue", "type": "uint256"}], "outputs": [{"name": "", "type": "bool"}], "stateMutability": "nonpayable" },
    { "type": "function", "name": "name", "inputs": [], "outputs": [{"name": "", "type": "string"}], "stateMutability": "view" },
    { "type": "function", "name": "symbol", "inputs": [], "outputs": [{"name": "", "type": "string"}], "stateMutability": "view" },
    { "type": "function", "name": "totalSupply", "inputs": [], "outputs": [{"name": "", "type": "uint256"}], "stateMutability": "view" },
    { "type": "function", "name": "transfer", "inputs": [{"name": "recipient", "type": "address"}, {"name": "amount", "type": "uint256"}], "outputs": [{"name": "", "type": "bool"}], "stateMutability": "nonpayable" },
    { "type": "function", "name": "transferFrom", "inputs": [{"name": "sender", "type": "address"}, {"name": "recipient", "type": "address"}, {"name": "amount", "type": "uint256"}], "outputs": [{"name": "", "type": "bool"}], "stateMutability": "nonpayable" },
    { "type": "function", "name": "owner", "inputs": [], "outputs": [{"name": "", "type": "address"}], "stateMutability": "view" },
    { "type": "function", "name": "renounceOwnership", "inputs": [], "outputs": [], "stateMutability": "nonpayable" },
    { "type": "function", "name": "transferOwnership", "inputs": [{"name": "newOwner", "type": "address"}], "outputs": [], "stateMutability": "nonpayable" },
    { "type": "function", "name": "issuer", "inputs": [], "outputs": [{"name": "", "type": "address"}], "stateMutability": "view" },
    { "type": "function", "name": "estimateFee", "inputs": [{"name": "value", "type": "uint256"}], "outputs": [{"name": "", "type": "uint256"}], "stateMutability": "view" },
    { "type": "event", "name": "Transfer", "inputs": [{"name": "from", "type": "address", "indexed": true}, {"name": "to", "type": "address", "indexed": true}, {"name": "value", "type": "uint256", "indexed": false}], "anonymous": false },
    { "type": "event", "name": "Approval", "inputs": [{"name": "owner", "type": "address", "indexed": true}, {"name": "spender", "type": "address", "indexed": true}, {"name": "value", "type": "uint256", "indexed": false}], "anonymous": false },
    { "type": "event", "name": "OwnershipTransferred", "inputs": [{"name": "previousOwner", "type": "address", "indexed": true}, {"name": "newOwner", "type": "address", "indexed": true}], "anonymous": false },
    { "type": "event", "name": "Fee", "inputs": [{"name": "from", "type": "address", "indexed": true}, {"name": "to", "type": "address", "indexed": true}, {"name": "issuer", "type": "address", "indexed": true}, {"name": "amount", "type": "uint256", "indexed": false}], "anonymous": false }
  ],
} as const;

export const marketplaceContract = {
  address: "0x322D6EaEC87180F0695fe4da899C76C9b9216141",
  abi: [
  { "inputs": [{"internalType": "address", "name": "tokenAddress", "type": "address"}], "stateMutability": "nonpayable", "type": "constructor" },
  { "inputs": [], "name": "getAllProducts", "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}], "stateMutability": "view", "type": "function" },
  { "inputs": [{"internalType": "uint256", "name": "bidId", "type": "uint256"}], "name": "acceptBid", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{"internalType": "uint256", "name": "bidId", "type": "uint256"}], "name": "completeBid", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{"internalType": "string", "name": "name", "type": "string"}, {"internalType": "uint256", "name": "price", "type": "uint256"}, {"internalType": "string", "name": "unit", "type": "string"}, {"internalType": "uint256", "name": "quantity", "type": "uint256"}, {"internalType": "uint256", "name": "stock", "type": "uint256"}], "name": "createProduct", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{"internalType": "uint256", "name": "productId", "type": "uint256"}], "name": "getProduct", "outputs": [{"components": [{ "internalType": "uint256", "name": "id", "type": "uint256" }, { "internalType": "string", "name": "name", "type": "string" }, { "internalType": "uint256", "name": "price", "type": "uint256" }, { "internalType": "string", "name": "unit", "type": "string" }, { "internalType": "uint256", "name": "quantity", "type": "uint256" }, { "internalType": "uint256", "name": "stock", "type": "uint256" }, { "internalType": "address", "name": "farmer", "type": "address" }], "internalType": "struct Marketplace.Product", "name": "", "type": "tuple"}], "stateMutability": "view", "type": "function" },
  { "inputs": [{"internalType": "uint256", "name": "orderId", "type": "uint256"}], "name": "getOrderDetails", "outputs": [{"components": [{ "internalType": "uint256", "name": "id", "type": "uint256" }, { "internalType": "uint256", "name": "productId", "type": "uint256" }, { "internalType": "uint256", "name": "quantity", "type": "uint256" }, { "internalType": "uint256", "name": "totalPrice", "type": "uint256" }, { "internalType": "address", "name": "buyer", "type": "address" }, { "internalType": "bool", "name": "fulfilled", "type": "bool" }], "internalType": "struct Marketplace.Order", "name": "", "type": "tuple"}], "stateMutability": "view", "type": "function" },
  { "inputs": [{"internalType": "address", "name": "user", "type": "address"}], "name": "getUserOrders", "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}], "stateMutability": "view", "type": "function" },
  { "inputs": [{"internalType": "uint256", "name": "bidId", "type": "uint256"}], "name": "getBidDetails", "outputs": [{"components": [{ "internalType": "uint256", "name": "id", "type": "uint256" }, { "internalType": "uint256", "name": "productId", "type": "uint256" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "address", "name": "bidder", "type": "address" }, { "internalType": "bool", "name": "accepted", "type": "bool" }, { "internalType": "bool", "name": "completed", "type": "bool" }], "internalType": "struct Marketplace.Bid", "name": "", "type": "tuple"}], "stateMutability": "view", "type": "function" },
  { "inputs": [{"internalType": "address", "name": "user", "type": "address"}], "name": "getUserBids", "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "operationFee", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function" },
  { "inputs": [{"internalType": "uint256", "name": "productId", "type": "uint256"}, {"internalType": "uint256", "name": "quantity", "type": "uint256"}], "name": "placeOrder", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{"internalType": "uint256", "name": "productId", "type": "uint256"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}], "name": "placeBid", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{"internalType": "uint256", "name": "newFee", "type": "uint256"}], "name": "setOperationFee", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{"internalType": "string", "name": "name", "type": "string"}, {"internalType": "string", "name": "contactInfo", "type": "string"}], "name": "setUserDetails", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "name": "token", "outputs": [{"internalType": "contract IVRC25", "name": "", "type": "address"}], "stateMutability": "view", "type": "function" }
  ],
} as const;

export type Product = {
  id: bigint;
  name: string;
  price: bigint;
  unit: string;
  quantity: bigint;
  stock: bigint;
  farmer: `0x${string}`;
  // This is a client-side only field to simulate futures
  biddingEndDate?: string; 
};

export type Order = {
  id: bigint;
  productId: bigint;
  quantity: bigint;
  totalPrice: bigint;
  buyer: `0x${string}`;
  fulfilled: boolean;
};

export type Bid = {
  id: bigint;
  productId: bigint;
  amount: bigint;
  bidder: `0x${string}`;
  accepted: boolean;
  completed: boolean;
};
