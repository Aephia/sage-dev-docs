# Local Markets

Local markets are the SAGE in-system order books for a single cargo type at a starbase.

They connect regional logistics, cargo, pricing, and player economy. For developers, the local-market client surface is compact: one `LocalMarket` account, one PDA helper, and a small set of order-management instructions.

In Star Atlas terms, markets are where extracted or crafted resources can become economic activity. They sit at the intersection of starbase location, cargo ids, ATLAS pricing, escrow, and player-owned inventory.

The KB frames local markets as a way to bring resource trading into the game world instead of treating everything like external OTC or global marketplace activity. That is why market docs should keep the starbase/system context visible.

For C4 context, local markets are regional infrastructure: the KB material describes one Local Marketplace per region, centered on that region's King System, which makes market access part of territory and logistics rather than only price discovery.

## Developer use

Use this page when you need to:

- find the local market for one cargo id at one starbase
- display bid and ask sides of the book
- explain ATLAS price, cargo quantity, maker, escrow, and vault state
- prepare place-order, cancel-order, close-market, or cleanup flows

## Technical model

`LocalMarket` is a PDA derived from `system`, `cargoId`, and `starbaseSeqId`. It stores both order-book state and escrow/accounting fields. Market write paths should be reviewed together with the player's `StarbasePlayer` cargo state and the relevant currency or vault movement.

## Generated anchors

Local-market account and instruction helpers live in `@staratlas/dev-sage`.

```ts
import {
	fetchMaybeLocalMarket,
	findLocalMarketPda,
	getPlaceLocalMarketOrderInstructionAsync,
	OrderSide
} from '@staratlas/dev-sage';
```

## Account and types

| Generated symbol | Kind | Beginner meaning |
| --- | --- | --- |
| `LocalMarket` | account | An order book for one cargo id in one starbase/system context. |
| `OrderBookSide` | type | One side of the book: bids or asks. |
| `OrderInfo` | type | A single order: price, quantity, id, and maker. |
| `MakerInfo` | type | Per-maker accounting within the order book. |
| `OrderSide` | enum | `Bid` or `Ask`. |
| `ProcessOrderArgs` | type | Input shape used when placing an order. |
| `CancelOrderArgs` | type | Input shape used when cancelling orders. |

## `LocalMarket` account

Important fields:

```txt
system              star system where this market is located
starbaseSeqId       starbase sequence id when the market was created
bump                PDA bump
marketInitializer   profile that initialized the market and receives close rent
cargo               escrowed cargo for pending asks and completed bids
vault               ATLAS vault amount for this market
bids                orders sorted highest price to lowest
asks                orders sorted lowest price to highest
```

Each `OrderInfo` stores:

```txt
price     price in ATLAS Floyds
quantity  cargo quantity being sold
orderId   unique id within the market
maker     maker id that placed the order
```

## PDA helper

`LocalMarket` has a generated PDA helper.

| Helper | Seeds | Meaning |
| --- | --- | --- |
| `findLocalMarketPda` | `system`, `cargoId`, `starbaseSeqId` | Find the market for one cargo id at one starbase in a system. |

```ts
import { findLocalMarketPda } from '@staratlas/dev-sage';

const [localMarketAddress] = await findLocalMarketPda({
	system: starSystemAddress,
	cargoId,
	starbaseSeqId
});
```

## Read a local market

This example reads a local market by PDA. It does not sign or send a transaction.

```ts
import { createSolanaRpc } from '@solana/kit';
import {
	fetchMaybeLocalMarket,
	findLocalMarketPda
} from '@staratlas/dev-sage';

const rpc = createSolanaRpc('https://testnet-rpc.z.ink');

const [marketAddress] = await findLocalMarketPda({
	system: starSystemAddress,
	cargoId,
	starbaseSeqId
});

const market = await fetchMaybeLocalMarket(rpc, marketAddress, {
	commitment: 'confirmed'
});

if (!market.exists) {
	throw new Error(`Local market not found: ${marketAddress}`);
}

console.log({
	system: market.data.system,
	starbaseSeqId: market.data.starbaseSeqId,
	bids: market.data.bids.orders.length,
	asks: market.data.asks.orders.length,
	vault: market.data.vault
});
```

## Instruction families

Local-market instruction builders are focused.

| Family | Instructions | What they manage |
| --- | --- | --- |
| Market lifecycle | `createLocalMarket`, `closeLocalMarket`, `cleanupInvalidMarket` | Create, close, or clean up a market account. |
| Orders | `placeLocalMarketOrder`, `cancelLocalMarketOrders` | Place bids/asks or cancel existing orders. |

Order placement uses `ProcessOrderArgs`:

```txt
side        Bid or Ask
price       price in ATLAS Floyds
quantity    cargo quantity
fillOrKill  whether partial/non-immediate fills are allowed
```

## Instruction example: place an order

This example builds a `placeLocalMarketOrder` instruction for review.

```ts
import {
	getPlaceLocalMarketOrderInstructionAsync,
	OrderSide
} from '@staratlas/dev-sage';

// These values must come from wallet/profile state, local-market discovery,
// starbase-player state, and cargo/ATLAS availability.
const instruction = await getPlaceLocalMarketOrderInstructionAsync({
	profileValidationSigner: signer,
	profileValidationProfile: profileAddress,
	game: gameAddress,
	character: characterAddress,
	system: starSystemAddress,
	starbasePlayer: starbasePlayerAddress,
	localMarket: localMarketAddress,
	keyIndex: 0,
	args: {
		side: OrderSide.Bid,
		price: 1n,
		quantity: 1n,
		fillOrKill: false
	}
});

console.log(instruction.programAddress);
```

Before sending a market transaction, show:

- which wallet signs
- which Player Profile key index authorizes the action
- whether the order is a bid or ask
- price denomination and cargo quantity
- which market and starbase-player accounts become writable
- whether cargo or ATLAS moves into escrow
- what simulation returns

## Safety notes

Reading local markets is safe. Sending order instructions can move cargo or ATLAS into escrow, alter the visible order book, and create settlement state for later withdrawal or cancellation.

Do not hide denomination details. `price` is ATLAS in Floyds in the generated type comments, so UI code must present it carefully.
