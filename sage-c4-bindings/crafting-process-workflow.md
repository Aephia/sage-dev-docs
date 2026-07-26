# Crafting Process Workflow

Crafting turns input cargo into output cargo through a `Recipe`, optional crafting hab context, crew allocation, and a new `CraftingProcess` account.

Use this as the canonical review pattern for production workflows: read recipe and local player state, build the process instruction, summarize cost and writable accounts, simulate, then show the expected cargo/crew/process diffs.

Keep the economy context visible: crafted outputs can feed starbase upgrades, local markets, and Infrastructure Contracts, which are one of the loops that turn active production and SDU demand into ATLAS payouts.

## What Start Crafting Touches

```ts
import { getStartCraftingProcessInstruction } from '@staratlas/dev-sage';
```

Instruction data:

| Field | Meaning |
| --- | --- |
| `keyIndex` | Player Profile key index authorizing the action. |
| `quantity` | Number of recipe runs or output units, depending on the recipe semantics. |
| `numCrew` | Crew allocated to the process. |

Core accounts:

| Account | Role in the workflow |
| --- | --- |
| `profileValidationSigner` | Wallet/profile signer. |
| `profileValidationProfile` | Player Profile account. |
| `character` | SAGE Character for this profile/game. |
| `game` | Root SAGE game account. |
| `system` | Star system containing the relevant starbase. |
| `starbasePlayer` | Player state at that starbase. |
| `recipe` | Recipe definition being started. |
| `craftingProcess` | New generated account signer for the crafting job. |
| `craftingHabInstance` | Optional player-owned hab used by the process. |
| `currencyCache` | Required when a crafting hab instance is provided. |

## 1. Read the state

Read the recipe and local player state before building:

```ts
import {
	RecipeStatus,
	fetchMaybeRecipe,
	fetchMaybeStarbasePlayer
} from '@staratlas/dev-sage';

const [recipe, starbasePlayer] = await Promise.all([
	fetchMaybeRecipe(rpc, recipeAddress, { commitment: 'confirmed' }),
	fetchMaybeStarbasePlayer(rpc, starbasePlayerAddress, {
		commitment: 'confirmed'
	})
]);

if (!recipe.exists) throw new Error('Recipe not found');
if (!starbasePlayer.exists) throw new Error('Starbase player not found');
if (RecipeStatus[recipe.data.status] !== 'Active') {
	throw new Error(`Recipe is not active: ${RecipeStatus[recipe.data.status]}`);
}

console.log({
	recipe: recipe.data.name,
	duration: recipe.data.craftingDuration,
	inputs: recipe.data.inputs.size,
	outputs: recipe.data.outputs.size
});
```

The UI should also show whether the player's local cargo, crew, and ATLAS context satisfy the recipe.

## 2. Build the instruction

```ts
import { generateKeyPairSigner } from '@solana/kit';
import { getStartCraftingProcessInstruction } from '@staratlas/dev-sage';

const craftingProcess = await generateKeyPairSigner();

const instruction = getStartCraftingProcessInstruction({
	profileValidationSigner: walletSigner,
	profileValidationProfile: profileAddress,
	character: characterAddress,
	game: gameAddress,
	system: systemAddress,
	starbasePlayer: starbasePlayerAddress,
	recipe: recipeAddress,
	craftingProcess,
	quantity: 1n,
	numCrew: 10,
	keyIndex: 0
});
```

Use `getStartCraftingProcessInstructionAsync` if you want the generated client to derive optional accounts it knows how to derive. Use the sync builder when review screens already have every address.

## 3. Review before signing

Show these items before a wallet signs:

- Recipe name, duration, inputs, outputs, and status.
- Quantity and crew allocation.
- Player Profile and `keyIndex`.
- Starbase/system context.
- New crafting process address.
- Optional crafting hab and currency cache.
- Expected cargo, crew, ATLAS, fee, rent, and cooldown effects.

## 4. Simulate the full transaction

Simulation should catch missing optional accounts, stale recipe/starbase state, insufficient cargo, insufficient crew, and missing generated-account signatures before the user sees a wallet prompt.

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

## Live PTR shape

A recent PTR `startCraftingProcess` transaction created a signer/writable crafting-process account and wrote the profile, character, starbase-player, recipe, and new process accounts.

Decoded instruction data:

```ts
{
	keyIndex: 0,
	quantity: '350000',
	numCrew: 350
}
```

Named account roles in the sampled transaction:

```txt
profileValidationSigner
profileValidationProfile
profileValidationProgram
character
game
system
starbasePlayer
recipe
craftingProcess
systemProgram
```

Two optional account positions were filled with the SAGE program address sentinel. When decoding explorer transactions, treat that sentinel as "optional account absent", not as an extra SAGE account to fetch.

## 5. Diff targets

| Account | Expected change |
| --- | --- |
| CraftingProcess | New account should exist and decode as `CraftingProcess`. |
| StarbasePlayer | Cargo, crew, or local production state may change. |
| Character | XP, counters, or crafting-related state may change. |
| CraftingHabInstance | Usage, modifiers, or rent state may change when provided. |
| CurrencyConfigCache | Usually read/config context; include it when hab flows require it. |

Use [Transaction Review and Account Diffs](/sage-c4-bindings/transaction-review-and-diffs) for the generic simulation and diff pattern.
