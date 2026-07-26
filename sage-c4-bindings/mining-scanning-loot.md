# Mining, Scanning, and Loot

Mining and scanning are SAGE exploration and resource-discovery loops. Fleets mine asteroids, scan the map with scan patterns, and retrieve loot from generated loot accounts.

These loops connect fleet location, scan configuration, resource gathering, loot tables, and cooldown-sensitive actions.

In Star Atlas terms, mining and scanning are how players turn fleet activity into resource discovery and extraction. The resulting resources feed transport, crafting, trading, and starbase upkeep.

Scanning is an active discovery loop, not generic random loot. Results are tied
to fleet location, scan-pattern configuration, costs, cooldowns, and the
broader resource economy. The official C4 guides show the player-facing
[mining](https://support.staratlas.com/hc/en-us/articles/52272891667987-How-to-Mine-Resources-in-C4-PTR)
and [scanning](https://support.staratlas.com/hc/en-us/articles/52275761937555-How-to-Scan-in-C4-PTR)
preconditions that a developer UI should make visible.

::: info Position in the account hierarchy
**Owned by:** SAGE program through `@staratlas/dev-sage`<br>
**Actor:** Fleet, authorized through Profile and Character<br>
**World context:** StarSystem, CelestialBody, RegionTracker, and Game<br>
**Configuration:** `ScanPattern` is derived from Game + scan-pattern id<br>
**Result:** `Loot` has no generated PDA helper and must be obtained from results, discovery, or indexing
:::

## Developer use

Use this page when you need to:

- show scan-pattern cost, cooldown, and loot-table context
- explain what a fleet is mining or scanning for
- review mining and scan transactions before signing
- inspect loot accounts created by gameplay or indexing
- connect resource ids from mining/scanning flows back to cargo metadata

## Technical model

Mining is fleet-centered but not fleet-only. PTR traces show `startMiningAsteroid` and `stopMiningAsteroid` touching profile validation, fleet, character, asteroid, game, and sometimes region-tracker state. Scanning adds scan-pattern and loot context.

For transaction review, explain the fleet state change, the resource ids or scan pattern used, and every writable account beyond the fleet itself.

## Generated anchors

Mining, scanning, and loot account and instruction helpers live in `@staratlas/dev-sage`.

```ts
import {
	fetchMaybeLoot,
	fetchMaybeScanPattern,
	findScanPatternPda,
	getScanInstructionAsync,
	ScanPatternStatus
} from '@staratlas/dev-sage';
```

## Accounts and types

| Generated symbol | Kind | Beginner meaning |
| --- | --- | --- |
| `ScanPattern` | account | Scan configuration: costs, cooldown, loot table, noise maps, and status. |
| `ScanPatternNoiseMapUpload` | account | Staging account for large scan noise-map uploads. |
| `Loot` | account | Lootable items created for a profile at coordinates. |
| `ScanCost` | type | Cost paid per scan. |
| `ScanLootEntry` | type | One possible result in a scan loot table. |
| `ScanNoiseMap` | type | Noise-map data used by a scan pattern. |
| `LootInfo` | type | One loot item entry. |
| `FleetState.MineAsteroid` | union variant | Fleet state while mining. |

## `ScanPattern` account

Important fields:

```txt
scanPatternId       unique scan-pattern id
name                fixed generated Name value
gameId              SAGE game account
cooldownMultiplier  scan cooldown multiplier
blankWeight         weight added when a scan fails
blankXpValue        XP value for blank results
status              generated scan pattern status
cost                scan costs paid per scan
lootTable           possible scan loot entries
noiseMaps           scan noise maps
```

## `Loot` account

Important fields:

```txt
gameId              SAGE game account
profile             Player Profile that created this loot account
coordinates         map coordinates where loot is located
rewardStatus        combat/reward settlement state
rewardLegCount      number of committed reward legs
rewardPad           generated padding field
rewardConfigVersion reward config version used for the commit
rewardCommitSlot    slot tied to the reward commit
rewardCommittedAt   timestamp tied to the reward commit
rewardLegs          committed reward legs for newer reward flows
items               generated loot item entries
```

`Loot` does not expose a generated PDA helper, so use an address from scan results, an indexer, or transaction output.

## PDA helper

`ScanPattern` has a generated PDA helper.

| Helper | Seeds | Meaning |
| --- | --- | --- |
| `findScanPatternPda` | `gameId`, `scanPatternId` | Find a scan-pattern definition account. |

```ts
import { findScanPatternPda } from '@staratlas/dev-sage';

const [scanPatternAddress] = await findScanPatternPda({
	gameId: gameAddress,
	scanPatternId
});
```

## Read a scan pattern

This example reads a scan pattern by PDA. It does not sign or send a transaction.

```ts
import { createSolanaRpc } from '@solana/kit';
import {
	fetchMaybeScanPattern,
	findScanPatternPda,
	ScanPatternStatus
} from '@staratlas/dev-sage';

const rpc = createSolanaRpc('https://testnet-rpc.z.ink');

const [scanPatternAddress] = await findScanPatternPda({
	gameId: gameAddress,
	scanPatternId
});

const scanPattern = await fetchMaybeScanPattern(rpc, scanPatternAddress, {
	commitment: 'confirmed'
});

if (!scanPattern.exists) {
	throw new Error(`Scan pattern not found: ${scanPatternAddress}`);
}

console.log({
	name: scanPattern.data.name,
	status: ScanPatternStatus[scanPattern.data.status],
	costCount: scanPattern.data.cost.length,
	lootEntryCount: scanPattern.data.lootTable.length,
	noiseMapCount: scanPattern.data.noiseMaps.length
});
```

## Read loot

This example reads a loot account by address.

```ts
import { address } from '@solana/kit';
import { fetchMaybeLoot } from '@staratlas/dev-sage';

const lootAddress = address('LOOT_ADDRESS_HERE');

const loot = await fetchMaybeLoot(rpc, lootAddress, {
	commitment: 'confirmed'
});

if (loot.exists) {
	console.log({
		profile: loot.data.profile,
		coordinates: loot.data.coordinates,
		itemCount: loot.data.items.unsizedList.length
	});
}
```

## Instruction families

| Family | Instructions | What they manage |
| --- | --- | --- |
| Mining | `startMiningAsteroid`, `stopMiningAsteroid`, `mineAsteroidToRespawn` | Move fleets into and out of mining state and handle asteroid-to-respawn behavior. |
| Scanning | `scan` | Execute a scan with a fleet/profile context. |
| Loot | `retrieveLoot` | Retrieve generated loot into the relevant player/fleet/cargo context. |
| Scan patterns | `createScanPattern`, `updateScanPattern`, `removeScanPattern` | Admin/configuration for scan pattern definitions. |
| Noise-map upload | `startScanPatternNoiseMapUpload`, `appendScanPatternNoiseMapUploadChunk`, `commitScanPatternNoiseMapUpload`, `cancelScanPatternNoiseMapUpload`, `appendScanPatternNoiseMaps` | Stage and apply large scan noise-map data. |

## Live mining trace

A recent PTR `startMiningAsteroid` transaction decoded to:

```ts
{
	keyIndex: 0,
	resources: [306, 311, 326]
}
```

The account roles were:

```txt
profileValidationSigner
profileValidationProfile
profileValidationProgram
fleet
character
starSystem
regionTracker
asteroid
game
```

The sampled `startMiningAsteroid` transaction consumed about 22,000 compute units. A sampled `stopMiningAsteroid` transaction consumed about 32,000 compute units and wrote the profile signer, profile, character, fleet, and asteroid accounts.

The important integration lesson is that mining is not just a fleet state change. Character, asteroid, and sometimes region-tracker state are part of the review surface.

## Canonical flow: start mining

Use this shape for mining tools: read the fleet and world context, build the instruction with selected resource ids, summarize the writable accounts, simulate, then explain the fleet/character/asteroid diff targets.

### 1. Read the state

```ts
import {
	fetchMaybeCelestialBody,
	fetchMaybeFleet,
	fetchMaybeRegionTracker,
	fetchMaybeStarSystem
} from '@staratlas/dev-sage';

const [fleet, starSystem, regionTracker, asteroid] = await Promise.all([
	fetchMaybeFleet(rpc, fleetAddress, { commitment: 'confirmed' }),
	fetchMaybeStarSystem(rpc, starSystemAddress, { commitment: 'confirmed' }),
	fetchMaybeRegionTracker(rpc, regionTrackerAddress, {
		commitment: 'confirmed'
	}),
	fetchMaybeCelestialBody(rpc, asteroidAddress, { commitment: 'confirmed' })
]);

if (!fleet.exists) throw new Error('Fleet not found');
if (!starSystem.exists) throw new Error('Star system not found');
if (!regionTracker.exists) throw new Error('Region tracker not found');
if (!asteroid.exists) throw new Error('Asteroid not found');
```

### 2. Build the instruction

```ts
import { getStartMiningAsteroidInstructionAsync } from '@staratlas/dev-sage';

const instruction = await getStartMiningAsteroidInstructionAsync({
	profileValidationSigner: signer,
	profileValidationProfile: profileAddress,
	fleet: fleetAddress,
	character: characterAddress,
	starSystem: starSystemAddress,
	regionTracker: regionTrackerAddress,
	asteroid: asteroidAddress,
	game: gameAddress,
	keyIndex: 0,
	resources: [306, 311, 326]
});
```

### 3. Review before signing

Show:

- fleet label, current state, and current location
- selected resource ids and their cargo metadata
- profile signer, profile, and `keyIndex`
- writable accounts: profile, fleet, character, region tracker, asteroid
- expected fleet state change into `MineAsteroid`
- simulation result and logs

### 4. Simulate and diff

Simulation runs against the full transaction. The domain diff should focus on:

| Account | Expected change |
| --- | --- |
| Fleet | State should move toward mining and resource/mining fields may change. |
| Character | Counters, XP, or progression-related state may change. |
| Asteroid | Mining/resource state may change. |
| RegionTracker | Region activity or mining-related state may change when included. |

## Instruction example: scan

This example builds a `scan` instruction for review.

For the full read/build/review/simulate path, see [Scanning Workflow](/sage-c4-bindings/scanning-workflow).

```ts
import { getScanInstructionAsync } from '@staratlas/dev-sage';

// These values must come from wallet/profile state, fleet state,
// scan-pattern discovery, cargo availability, and current location.
const instruction = await getScanInstructionAsync({
	profileValidationSigner: signer,
	profileValidationProfile: profileAddress,
	game: gameAddress,
	fleet: fleetAddress,
	scanPattern: scanPatternAddress,
	recentSlothashes: recentSlothashesAddress,
	crewBinding: crewBindingAddress,
	regionTracker: regionTrackerAddress,
	encounterCommit: encounterCommitAddress,
	encounterPool: encounterPoolAddress,
	keyIndex: 0
});

console.log(instruction.programAddress);
```

Before sending a mining or scanning transaction, show:

- which wallet signs
- which Player Profile key index authorizes the action
- which fleet changes state or cooldowns
- which scan pattern and costs apply
- whether the scan arms encounter state
- whether cargo, loot, XP, or AP changes
- which accounts become writable
- what simulation returns

## Safety notes

Reading scan patterns and loot is safe. Sending mining, scanning, or retrieve-loot instructions can consume resources, change fleet state, alter cooldowns, mint or move loot-like cargo, and affect progression.

Keep send examples in review mode until PTR simulations prove exact account effects.
