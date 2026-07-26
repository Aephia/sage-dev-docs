# Cargo and Currency

Cargo and currency accounts are the accounting layer used by fleets, starbases, claim stakes, crafting, markets, and admin withdrawals.

For beginners: SAGE does not expose one generic inventory account in this package. Instead, cargo-like state appears inside domain accounts such as `Fleet`, `StarbasePlayer`, `LocalMarket`, `ClaimStakeInstance`, `CraftingHabInstance`, and `CraftingProcess`. The package also includes cache accounts for cargo definitions and currency configuration.

Star Atlas KB material describes resources as the materials that keep fleets operational, feed crafting, support trading, and contribute to starbase upkeep and upgrades. In the generated SAGE C4 clients, that game idea appears as cargo ids, cargo pods, resource definitions, and currency vault/accounting fields.

## Developer use

Use this page when you need to:

- resolve cargo ids into readable resource metadata
- inspect fleet, starbase-player, market, crafting, or claim-stake cargo state
- explain ATLAS vault and currency-cache context
- build or review cargo-transfer, deposit, withdraw, market, or crafting transactions

## Technical model

Cargo is distributed state. `CargoDefinitionsCache` and `CurrencyConfigCache` are cache/config accounts for one `Game`; cargo balances then live inside domain accounts. A developer usually reads the caches first, then reads the specific domain account that owns the relevant cargo pod.

Explorer traces confirm this split: cargo transfer instructions wrote the profile signer, profile, fleet, character, and starbase-player accounts while using the `Game` and `StarSystem` as read-only context.

## Generated anchors

Cargo and currency account and instruction helpers live in `@staratlas/dev-sage`.

```ts
import {
	fetchMaybeCargoDefinitionsCache,
	fetchMaybeCurrencyConfigCache,
	findCargoDefinitionsCachePda,
	findCurrencyConfigCachePda
} from '@staratlas/dev-sage';
```

## Accounts and types

| Generated symbol | Kind | Beginner meaning |
| --- | --- | --- |
| `CargoDefinitionsCache` | account | Cache of cargo type definitions for one game. |
| `CurrencyConfigCache` | account | Cache of ATLAS/POLIS currency settings and vault amounts. |
| `CargoPod` | type | Cargo container used inside many accounts. |
| `SingleCargo` | type | Single-cargo storage used by local markets. |
| `CargoType` | type | Cargo definition data. |
| `CargoId` | type | Generated cargo identifier. |
| `Resources` | type | Resource configuration nested in `Game`. |
| `Currencies` | type | Currency configuration nested in `Game`. |

## `CargoDefinitionsCache` account

Important fields:

```txt
gameId          SAGE game account
bump            PDA bump
cargoTypeCache  map of cargo ids to cached cargo type data
```

Use this when application code needs cargo metadata without decoding the full `Game` definition table every time.

## `CurrencyConfigCache` account

Important fields:

```txt
gameId         SAGE game account
bump           PDA bump
atlas          ATLAS balance cache
polis          POLIS balance cache
atlasVault     ATLAS held for game withdrawal
daoAtlasVault  ATLAS held for DAO withdrawal
```

This account appears in several state-changing flows that need currency config or vault accounting.

## PDA helpers

| Helper | Seeds | Meaning |
| --- | --- | --- |
| `findCargoDefinitionsCachePda` | `gameId` | Find the cargo definitions cache for a game. |
| `findCurrencyConfigCachePda` | `gameId` | Find the currency config cache for a game. |

```ts
import {
	findCargoDefinitionsCachePda,
	findCurrencyConfigCachePda
} from '@staratlas/dev-sage';

const [cargoDefinitionsCacheAddress] = await findCargoDefinitionsCachePda({
	gameId: gameAddress
});

const [currencyConfigCacheAddress] = await findCurrencyConfigCachePda({
	gameId: gameAddress
});
```

## Read the caches

This example reads the generated cache accounts. It does not sign or send a transaction.

```ts
import { createSolanaRpc } from '@solana/kit';
import {
	fetchMaybeCargoDefinitionsCache,
	fetchMaybeCurrencyConfigCache,
	findCargoDefinitionsCachePda,
	findCurrencyConfigCachePda
} from '@staratlas/dev-sage';

const rpc = createSolanaRpc('https://testnet-rpc.z.ink');

const [cargoDefinitionsCacheAddress] = await findCargoDefinitionsCachePda({
	gameId: gameAddress
});

const cargoDefinitions = await fetchMaybeCargoDefinitionsCache(
	rpc,
	cargoDefinitionsCacheAddress,
	{ commitment: 'confirmed' }
);

const [currencyConfigCacheAddress] = await findCurrencyConfigCachePda({
	gameId: gameAddress
});

const currencyConfig = await fetchMaybeCurrencyConfigCache(
	rpc,
	currencyConfigCacheAddress,
	{ commitment: 'confirmed' }
);

console.log({
	cargoDefinitionsExist: cargoDefinitions.exists,
	currencyConfigExists: currencyConfig.exists,
	cargoTypes: cargoDefinitions.exists
		? cargoDefinitions.data.cargoTypeCache.size
		: 0
});
```

## Instruction families

| Family | Instructions | What they manage |
| --- | --- | --- |
| Cargo definitions | `createCargoDefinitionsCache`, `createCargoCategory`, `createCargoType`, `updateCargoType` | Admin/configuration for cargo metadata and the cache. |
| Cargo movement | `depositCargoToGame`, `withdrawCargoFromGame`, `transferCargoToFleet`, `transferCargoWithinFleet` | Move cargo between game/player/fleet storage contexts. |
| Currency setup | `initCurrencyCache` | Initialize the currency cache for a game. |
| Currency movement | `depositAtlas`, `withdrawAtlas`, `adminWithdrawAtlas` | Move ATLAS through SAGE-managed vault/accounting flows. |
| Synchronization | `syncFleetWithGame`, `syncStarbaseCargoWithGame` | Align fleet or starbase cargo state with game configuration. |

## Canonical flow: move cargo inside a fleet

This is the preferred shape for state-changing examples in these docs: read the state, build the instruction, summarize it, then simulate a full transaction before asking a wallet to sign.

The example mirrors a live PTR pattern where cargo moved between fleet cargo pods.

### 1. Read the state

Read the fleet and cargo metadata first. The UI needs both: the fleet tells you where cargo is stored, and the cache tells you what a `cargoId` means.

```ts
import { createSolanaRpc } from '@solana/kit';
import {
	fetchMaybeCargoDefinitionsCache,
	fetchMaybeFleet
} from '@staratlas/dev-sage';

const rpc = createSolanaRpc('https://testnet-rpc.z.ink');

const [fleet, cargoDefinitions] = await Promise.all([
	fetchMaybeFleet(rpc, fleetAddress, { commitment: 'confirmed' }),
	fetchMaybeCargoDefinitionsCache(rpc, cargoDefinitionsCacheAddress, {
		commitment: 'confirmed'
	})
]);

if (!fleet.exists) throw new Error(`Fleet not found: ${fleetAddress}`);
if (!cargoDefinitions.exists) throw new Error('Cargo definitions not found');

const cargoType = cargoDefinitions.data.cargoTypeCache.get(2);

console.log({
	fleet: fleet.data.fleetLabel,
	state: fleet.data.state.__kind,
	cargoId: 2,
	cargoType
});
```

### 2. Build the instruction

Build the instruction without sending it. Account order and roles are part of the review surface.

```ts
import {
	FleetCargoPod,
	getTransferCargoWithinFleetInstruction
} from '@staratlas/dev-sage';

const instruction = getTransferCargoWithinFleetInstruction({
	profileValidationSigner: signer,
	profileValidationProfile: profileAddress,
	fleet: fleetAddress,
	game: gameAddress,
	amount: 1554n,
	cargoPodTo: FleetCargoPod.CargoHold,
	cargoPodFrom: FleetCargoPod.FuelTank,
	cargoId: 2,
	keyIndex: 0
});

console.log({
	program: String(instruction.programAddress),
	accounts: instruction.accounts.map((account, index) => ({
		index,
		address: String(account.address),
		role: String(account.role)
	})),
	dataBytes: instruction.data.length
});
```

### 3. Review before signing

Before presenting the transaction to a wallet, show:

- cargo id and amount
- source and destination cargo pods
- profile signer and profile account
- fleet account that will be written
- whether the `Game` account is only read as context
- simulation result and logs

### 4. Simulate the full transaction

Simulation takes a full encoded transaction, not just the instruction. The exact wallet or test-signer setup depends on your app, but the review contract is stable:

```ts
const simulation = await rpc
	.simulateTransaction(encodedTransactionBase64, {
		commitment: 'confirmed',
		encoding: 'base64',
		replaceRecentBlockhash: true,
		sigVerify: false
	})
	.send();

console.log({
	err: simulation.value.err,
	unitsConsumed: simulation.value.unitsConsumed,
	logs: simulation.value.logs
});
```

### 5. Diff targets

For `transferCargoWithinFleet`, the first diff target is the `Fleet` account. The profile account may also be writable because profile validation is part of the instruction account set.

Explain the domain diff, not raw account data:

```txt
Fleet cargo pod: FuelTank -> CargoHold
cargo id: 2
amount: 1554
fleet state: unchanged unless simulation logs say otherwise
```

## Safety notes

Reading caches is safe. Sending cargo or currency instructions can move assets, consume resources, update vaults, or change cache/config state.

Cargo examples should always name the source, destination, cargo id, amount, signer, writable accounts, and simulation output before they become send examples.
