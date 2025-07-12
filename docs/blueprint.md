# **App Name**: AgriBid

## Core Features:

- Wallet Authentication: Connect to Viction Testnet via Metamask to authenticate users as either farmers or buyers based on their wallet address.
- Farmer Dashboard: Display a farmer-specific view with product listing, bidding management, and profile settings.
- Buyer Marketplace: Showcase a buyer-specific view with product browsing, order placement, and bid submission.
- Product Listing: Enable farmers to list products with details such as price, unit, quantity, and stock using a fixed-price model. Store data on the blockchain via the FarmersMarketplace smart contract (0x322D6EaEC87180F0695fe4da899C76C9b9216141).
- Bidding System: Implement a bidding process where buyers can request products for a specific amount, and farmers can accept these bids. Once accepted, the bid becomes open for the 'growing' phase. Interact with FarmersMarketplace smart contract (0x322D6EaEC87180F0695fe4da899C76C9b9216141) for bid management.
- AGT Token Integration: Utilize the SimpleVRC25Token smart contract (0x87D58253DE27A6247Aa76223B773D326AC77Ea2c) for transactions using AGT tokens on the Viction Testnet.
- Transaction Fee Management: The contract owner (0x21A85759D7b1641Fd666B1Bb4601cB5101C9c819) pays transaction fees in VIC. Manage fees through the FarmersMarketplace smart contract (0x322D6EaEC87180F0695fe4da899C76C9b9216141).

## Style Guidelines:

- Primary color: Light green (#90EE90) for a fresh, natural feel, reflecting the agricultural theme.
- Background color: Very light green (#F0FFF0), almost white, providing a clean and bright backdrop to highlight the content and products.
- Accent color: Dark green (#228B22) for key interactive elements and calls to action, offering a strong contrast and signaling important actions.
- Font: 'PT Sans', a humanist sans-serif that is both modern and warm, suitable for both headlines and body text.
- Use clean, line-based icons in shades of green to represent different product categories, actions, and features. Icons should be simple and easily recognizable.
- Implement a clean and structured layout with clear sections for product listings, bidding information, and user profiles. Ensure responsiveness for different screen sizes.
- Use subtle animations for loading states and transitions to provide a smooth and engaging user experience. Avoid overly complex animations that may distract from the app's functionality.