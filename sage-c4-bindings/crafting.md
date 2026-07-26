# Crafting

Crafting is the SAGE production loop that turns input cargo into output cargo through recipes, starbases, crew, timers, fees, and optional crafting habs.

Recipes define what can be made, crafting habs modify and unlock work, and crafting processes track active jobs.

In SAGE C4, crafting is an on-chain production workflow: read a recipe, verify
starbase, player, cargo, and crew context, create a crafting process, wait for
it to mature, then complete or cancel it. Crafted outputs feed fleet logistics,
starbase upgrades, local markets, and other economy loops.

::: info Position in the account hierarchy
**Owned by:** SAGE program through `@staratlas/dev-sage`<br>
**Definition:** `Recipe` is derived from `Game` + recipe id<br>
**Infrastructure:** `CraftingHabInstance` belongs to a profile in a star system<br>
**Activity:** `CraftingProcess` links Profile, StarSystem, StarbasePlayer, Recipe, and optional hab context<br>
**Discovery:** process and hab accounts have no generated PDA helper in this package
:::

See the [Crafting Process Workflow](/sage-c4-bindings/crafting-process-workflow)
for the full read, build, review, simulate, and diff sequence.

Read crafting as part of the active economy, not a standalone manufacturing screen. Crafted outputs can support starbase upgrades, infrastructure contracts, trading, upkeep, and other player-driven loops.

## Developer use

Use this page when you need to:

- display recipe inputs, outputs, status, duration, fees, and requirements
- inspect a player's crafting hab infrastructure
- start, complete, cancel, or destroy crafting processes
- explain crew, cargo, ATLAS, rent, and starbase-player effects before signing

## Technical model

Crafting has three layers: `Recipe` for configuration, `CraftingHabInstance` for player infrastructure, and `CraftingProcess` for a specific job. The write path commonly validates Player Profile, reads `Game` and `StarSystem`, writes `Character` and `StarbasePlayer`, and creates or mutates a `CraftingProcess`.

PTR traces show `startCraftingProcess` creating a signer/writable crafting-process account and using the SAGE program address as a sentinel for absent optional accounts. Transaction summaries should call out both details.

## Generated anchors

Crafting account and instruction helpers live in `@staratlas/dev-sage`.

```ts
import {
	fetchMaybeCraftingHabInstance,
	fetchMaybeCraftingProcess,
	fetchMaybeRecipe,
	findRecipePda,
	getStartCraftingProcessInstructionAsync,
	RecipeStatus
} from '@staratlas/dev-sage';
```

## Accounts and types

| Generated symbol | Kind | Beginner meaning |
| --- | --- | --- |
| `Recipe` | account | A recipe definition: inputs, outputs, duration, fees, status, limits, and requirements. |
| `CraftingHabInstance` | account | A placed crafting hab owned by a player. It can unlock recipes and apply crafting modifiers. |
| `CraftingProcess` | account | One active or completed crafting job for a profile, starbase player, recipe, and hab context. |
| `RecipeStatus` | enum | Whether a recipe is `Active` or `Deactivated`. |
| `StructureInstanceState` | union | Whether a crafting hab is `Active`, in `Design`, or `Deactivated`. |

Read this as three layers:

- `Recipe` is static-ish game configuration for what can be crafted.
- `CraftingHabInstance` is player-owned production infrastructure.
- `CraftingProcess` is the time-bound job created when crafting starts.

## `Recipe` account

`Recipe` is a generated account with a PDA helper.

Important fields:

```txt
recipeId                  unique recipe identifier
gameId                    SAGE game account
craftingDuration          base duration required to craft
minDuration               minimum duration after modifiers
name                      fixed generated Name value
status                    Active or Deactivated
feeAmount                 fee charged when recipe is used
feeRecipient              fee currency and recipient
habRequired               whether a crafting hab is required
usageCount / usageLimit   current usage and max usage
value                     XP value
minStarbaseLevel          minimum starbase level
crafting*Minmax           modifier bounds applied by habs
researchRequirements      research tags, requiring any listed tag
inputs / outputs          cargo id to quantity maps
```

## `CraftingHabInstance` account

`CraftingHabInstance` represents a placed hab and its production state.

Important fields:

```txt
owner                     owner of the crafting hab instance
gameId                    SAGE game account
system                    star system where the hab is placed
craftingHabDefinitionId   hab definition id
systemSeqId               sequence id of the system
lastRentClockTimestamp    last rent collection time
constructionRemaining     construction seconds remaining
constructionProgressTimestamp active-time construction cursor
rentBalance               available rent balance
neededCrew                crew needed by this hab
craftingJobConcurrency    jobs that can run simultaneously
craftingJobs              jobs currently running
craftingModifiers         cumulative modifiers from buildings
habBuildings              building id to count map
recipesUnlocked           recipes unlocked by this hab
state                     Active, Design, or Deactivated
productionCore            production and consumption core
```

## `CraftingProcess` account

`CraftingProcess` tracks a single crafting job.

Important fields:

```txt
recipe          recipe account being crafted
profile         Player Profile account
system          StarSystem account
starbasePlayer  player state at the starbase
starbaseSeqId   starbase sequence id
craftingHab     crafting hab used by the job
quantity        output quantity to craft
numCrew         crew assigned
startTime       start timestamp
endTime         completion timestamp
feeEscrow       recipe fee held in escrow
inputs          cargo inputs committed to the process
```

## PDA helper

Only `Recipe` has a generated PDA helper.

| Helper | Seeds | Meaning |
| --- | --- | --- |
| `findRecipePda` | `gameId`, `recipeId` | Find the definition account for a recipe in one SAGE game. |

```ts
import { findRecipePda } from '@staratlas/dev-sage';

const [recipeAddress] = await findRecipePda({
	gameId: gameAddress,
	recipeId
});
```

`CraftingHabInstance` and `CraftingProcess` do not expose generated PDA helpers in the current package; read them by known account address unless a higher-level indexer or UI gives you the derivation.

## Read a recipe

This example reads a recipe by PDA. It does not sign or send a transaction.

```ts
import { address, createSolanaRpc } from '@solana/kit';
import {
	fetchMaybeRecipe,
	findRecipePda,
	RecipeStatus,
	StarbaseLevel
} from '@staratlas/dev-sage';

const rpc = createSolanaRpc('https://testnet-rpc.z.ink');
const gameAddress = address('GAME_ADDRESS_HERE');
const recipeId = /* RecipeId value from config or UI */;

const [recipeAddress] = await findRecipePda({ gameId: gameAddress, recipeId });
const recipe = await fetchMaybeRecipe(rpc, recipeAddress, {
	commitment: 'confirmed'
});

if (!recipe.exists) {
	throw new Error(`Recipe not found: ${recipeAddress}`);
}

console.log({
	name: recipe.data.name,
	status: RecipeStatus[recipe.data.status],
	minStarbaseLevel: StarbaseLevel[recipe.data.minStarbaseLevel],
	craftingDuration: recipe.data.craftingDuration,
	inputs: recipe.data.inputs,
	outputs: recipe.data.outputs
});
```

## Read a crafting process

This example reads a process by address.

```ts
import { address } from '@solana/kit';
import { fetchMaybeCraftingProcess } from '@staratlas/dev-sage';

const craftingProcessAddress = address('CRAFTING_PROCESS_ADDRESS_HERE');
const process = await fetchMaybeCraftingProcess(rpc, craftingProcessAddress, {
	commitment: 'confirmed'
});

if (process.exists) {
	console.log({
		recipe: process.data.recipe,
		profile: process.data.profile,
		quantity: process.data.quantity,
		numCrew: process.data.numCrew,
		startTime: process.data.startTime,
		endTime: process.data.endTime
	});
}
```

## Instruction families

Crafting-related instruction builders fall into several groups.

| Family | Instructions | What they manage |
| --- | --- | --- |
| Recipe admin | `createRecipe`, `updateRecipe`, `deactivateRecipe` | Create, change, or deactivate recipe definitions. |
| Crafting process | `startCraftingProcess`, `completeCraftingProcess`, `cancelCraftingProcess`, `destroyCraftingProcess` | Start, finish, cancel, or close crafting jobs. |
| Crafting hab lifecycle | `placeCraftingHabInstance`, `deconstructCraftingHabInstance`, `evictCraftingHabInstance`, `respawnCraftingHabInstance`, `completeCraftingHabRespawn` | Place, remove, evict, or respawn crafting hab instances. |
| Hab buildings | `placeCraftingHabBuildings`, `finalizeHabBuildingChanges`, `cancelHabBuildingDesign` | Design and finalize building changes for a crafting hab. |
| Rent | `payCraftingHabRent`, `craftingHabRentTopUp` | Collect or add rent balance for hab infrastructure. |
| Resource loop | `craftingHabResourceConsumption`, `craftingHabResourceSwap` | Consume or swap resources through hab production state. |
| Runtime config | `updateCraftingHabDefinition`, `updateCraftingHabRuntimeConfig` | Update hab definitions and runtime config. |

Many crafting instructions validate the Player Profile and may write profile, starbase-player, recipe, hab, process, cargo, or currency-cache accounts.

## Instruction example: start crafting

This example builds a `startCraftingProcess` instruction for review.

For the full read/build/review/simulate path, see [Crafting Process Workflow](/sage-c4-bindings/crafting-process-workflow).

```ts
import { getStartCraftingProcessInstructionAsync } from '@staratlas/dev-sage';

// These values must come from wallet/profile state, recipe discovery,
// starbase-player state, and cargo availability.
const instruction = await getStartCraftingProcessInstructionAsync({
	profileValidationSigner: signer,
	profileValidationProfile: profileAddress,
	character: characterAddress,
	game: gameAddress,
	system: starSystemAddress,
	starbasePlayer: starbasePlayerAddress,
	recipe: recipeAddress,
	craftingProcess: craftingProcessSigner,
	craftingHabInstance: craftingHabAddress,
	crewBinding: crewBindingAddress,
	keyIndex: 0,
	quantity: 1n,
	numCrew: 1
});

console.log(instruction.programAddress);
```

Before sending a crafting transaction, show:

- which wallet signs
- which Player Profile key index authorizes the action
- which recipe is used and whether it is active
- which input cargo is consumed
- which output cargo will be produced
- which starbase player and crafting hab accounts become writable
- whether a crew binding is selected for the job
- whether fees, crew, rent, or usage limits change
- what simulation returns

## Safety notes

Reading crafting accounts is safe. Sending crafting instructions can lock cargo, consume resources, change rent state, alter usage counts, or mutate player-owned infrastructure.

Do not use send examples until PTR behavior has been verified with a transaction simulation and a before/after account diff.
