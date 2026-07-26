# Starbases

Starbases are the main station-like infrastructure in SAGE.

In game terms, starbases are places where players and factions interact with storage, crafting, repair, upgrades, respawn, movement, and conflict.

Star Atlas KB material describes SAGE resources as inputs for crafting, trading, and starbase upkeep/upgrades. Starbases are the place where many of those loops converge: fleets dock there, cargo is stored there, crafting is run there, and upgrade contributions affect faction infrastructure.

In the C4 region model, starbases also drive territory. Owning and upgrading starbases affects whether systems and regions become usable faction space, and destroying low-tier starbases can change control. Treat starbase instructions as strategic actions even when the generated builder name sounds like a local repair or upgrade.

## Developer use

Use this page when you need to:

- inspect whether a star system has a starbase
- show starbase level, faction owner, HP/SP, recipes, crafting hab plots, or valid services
- inspect one player's `StarbasePlayer` cargo, crew, ships, respawn queues, and local state
- prepare upgrade, repair, cargo-sync, crew, ship, crafting, or docking-related reviews

## Technical model

Starbase data is split intentionally. The starbase itself is nested in `StarSystem.starbase`; player-local state at that starbase lives in `StarbasePlayer`; upgrade contribution state lives in `StarbaseUpgradeProcess`.

For transaction review, decide which layer is changing. A dock/undock or cargo flow may write `StarbasePlayer`; a world or admin flow may write `StarSystem`; an upgrade flow may create or mutate `StarbaseUpgradeProcess`.

## Generated anchors

Starbase-related account and instruction helpers live in `@staratlas/dev-sage`.

```ts
import {
	fetchMaybeStarSystem,
	fetchMaybeStarbasePlayer,
	fetchMaybeStarbasePlayerFromSeeds,
	fetchMaybeStarbaseUpgradeProcess,
	findStarbasePlayerPda
} from '@staratlas/dev-sage';
```

## Accounts and types

Starbase data is split across a few generated concepts.

| Generated symbol | Kind | Beginner meaning |
| --- | --- | --- |
| `StarSystem` | account | A star system. It can contain an optional `starbase` value. |
| `Starbase` | type inside `StarSystem` | The starbase's faction owner, level, health, shields, crafting support, and valid recipes. |
| `StarbasePlayer` | account | One player's state at a starbase: cargo, crew, escrowed ships, and respawn queues. |
| `StarbaseUpgradeProcess` | account | A resource contribution currently being processed for a starbase upgrade. |
| `StarbaseLevel` | enum | `Level0` through `Level5`, plus `Css`. |
| `StarbaseLevelInfo` | type | Stats and tuning values for a level: HP, SP, repair rates, fees, damage, and XP value. |

Read this as two layers:

- `StarSystem.starbase` describes the starbase itself.
- `StarbasePlayer` describes a specific player's state at that starbase.

## `Starbase` type

`Starbase` is not its own account. It is nested in `StarSystem.starbase`.

Important fields:

```txt
owner                     faction that owns the starbase
level                     current starbase level
localMarketEnableLevel    level at which local markets are enabled
repairEnableLevel         level at which ship repairs are enabled
hp / pendingHp / sp       health and shield values
craftingHabPlots          crafting hab plot grid
baseCraftingHabRentRate   rent tuning for crafting habs
baseCraftingHabPlacementFee placement-fee tuning
locationTags              location tags provided by this starbase
buildingTags              building tags for crafting hab buildings
validRecipes              recipes valid at this starbase
craftingHabs              crafting habs currently placed
```

## `StarbasePlayer` account

`StarbasePlayer` is the player's starbase state.

Important fields:

```txt
playerProfile             Player Profile account
faction                   player's faction
system                    StarSystem account
character                 SAGE Character account
totalCrew / busyCrew      crew totals at this starbase
respawningCrew            crew respawn queue
seqId                     starbase sequence id
cargoRespawnEndsAt        cargo respawn completion timestamp
respawningShips           ship respawn queues
respawningClaimStakes     claim stake respawn queues
respawningCraftingHabs    crafting hab respawn queues
respawningCargo           cargo waiting to respawn
shipsInEscrow             ships held at the starbase
cargoPod                  player's cargo pod at the starbase
```

## `StarbaseUpgradeProcess` account

`StarbaseUpgradeProcess` tracks a resource contribution being processed for an upgrade.

```txt
profile          Player Profile account
system           StarSystem account
starbasePlayer   owner/authority of the upgrade process
starbaseSeqId    starbase sequence id
resourceId       contributed resource id
quantity         resource quantity
numCrew          crew assigned
startTime        processing start
endTime          processing end
```

## PDA helper

`StarbasePlayer` can be derived from a star system and character.

| Helper | Seeds | Meaning |
| --- | --- | --- |
| `findStarbasePlayerPda` | `system`, `character` | Find one player's starbase state for a character in a system. |

```ts
import { findStarbasePlayerPda } from '@staratlas/dev-sage';

const [starbasePlayerAddress] = await findStarbasePlayerPda({
	system: starSystemAddress,
	character: characterAddress
});
```

## Read a star system and starbase

This example reads a `StarSystem` and checks whether it currently contains a starbase.

```ts
import { address, createSolanaRpc } from '@solana/kit';
import { Faction } from '@staratlas/dev-profile-faction';
import { fetchMaybeStarSystem, StarbaseLevel } from '@staratlas/dev-sage';

const rpc = createSolanaRpc('https://testnet-rpc.z.ink');
const starSystemAddress = address('STAR_SYSTEM_ADDRESS_HERE');

const starSystem = await fetchMaybeStarSystem(rpc, starSystemAddress, {
	commitment: 'confirmed'
});

if (!starSystem.exists) {
	throw new Error(`Star system not found: ${starSystemAddress}`);
}

const starbaseOption = starSystem.data.starbase;

if (starbaseOption.__option === 'Some') {
	const starbase = starbaseOption.value;

	console.log({
		systemName: starSystem.data.name,
		owner: Faction[starbase.owner],
		level: StarbaseLevel[starbase.level],
		hp: starbase.hp,
		sp: starbase.sp
	});
}
```

## Read player state at a starbase

This example reads the `StarbasePlayer` account from seeds.

```ts
import { fetchMaybeStarbasePlayerFromSeeds } from '@staratlas/dev-sage';

const starbasePlayer = await fetchMaybeStarbasePlayerFromSeeds(
	rpc,
	{
		system: starSystemAddress,
		character: characterAddress
	},
	{ commitment: 'confirmed' }
);

if (starbasePlayer.exists) {
	console.log({
		playerProfile: starbasePlayer.data.playerProfile,
		totalCrew: starbasePlayer.data.totalCrew,
		busyCrew: starbasePlayer.data.busyCrew,
		cargoRespawnEndsAt: starbasePlayer.data.cargoRespawnEndsAt
	});
}
```

## Instruction families

Starbase-related instruction builders fall into several groups.

| Family | Instructions | What they manage |
| --- | --- | --- |
| Registration | `registerStarbase`, `registerStarbasePlayer`, `destroyStarbasePlayer` | Create or remove starbase and player-at-starbase state. |
| Admin and tables | `updateStarbase`, `updateStarbaseTables` | Update starbase configuration and tuning tables. |
| Upgrade contribution | `contributeToStarbaseUpgrade`, `cancelStarbaseUpgradeContribution`, `installStarbaseUpgradeResource`, `destroyStarbaseUpgradeContribution` | Contribute resources and crew to starbase upgrades, cancel or install processed contributions. |
| Repair | `repairStarbase` | Repair starbase health using fleet/player context plus Atlas reward registry/config/epoch/contribution accounts. |
| Combat | `attackStarbase` | Attack a starbase using a fleet, faction relation/ownership state, captor treasury, king tracker, and reward config context. |
| Sync | `syncStarbaseCargoWithGame` | Keep starbase cargo state aligned with game config. |

Many of these instructions include Player Profile validation accounts. Any transaction example should show signers, `keyIndex`, writable accounts, and simulation notes before it asks for a wallet signature.

## Instruction example: contribute upgrade resources

This example builds a contribution instruction for review.

```ts
import { getContributeToStarbaseUpgradeInstruction } from '@staratlas/dev-sage';

// These values must come from the player's wallet/profile,
// SAGE account discovery, and starbase UI or indexer state.
// They are placeholders here so the example stays in review mode.
const instruction = getContributeToStarbaseUpgradeInstruction({
	profileValidationSigner: signer,
	profileValidationProfile: profileAddress,
	character: characterAddress,
	starSystem: starSystemAddress,
	starbasePlayer: starbasePlayerAddress,
	upgradeProcess: upgradeProcessSigner,
	game: gameAddress,
	keyIndex: 0,
	resourceId,
	quantity: 1n,
	crew: 1
});

console.log(instruction.programAddress);
```

Before sending a starbase transaction, show:

- which wallet signs
- which Player Profile key index authorizes the action
- which starbase or starbase-player account changes
- whether cargo, crew, HP, SP, or upgrade state changes
- whether fees or resources are consumed
- what simulation returns

## Safety notes

Reading starbase accounts is safe. Sending starbase instructions can change shared strategic state, consume resources, affect faction conflict, or alter upgrade progress.

Keep starbase send examples conservative until PTR behavior has been verified directly.
