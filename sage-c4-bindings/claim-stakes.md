# Claim Stakes

Claim stakes are the SAGE planetary-production and land-style infrastructure loop.

They let players place infrastructure on celestial bodies and produce resources over time.

In Star Atlas terms, claim stakes connect player-owned infrastructure to celestial bodies, resource production, rent, construction, and eventual logistics through fleets and starbases.

Claim stakes are physical infrastructure placed on celestial bodies to access
local production. Planet and body tags, building choices, fuel, storage, and
fleet logistics matter, so placement examples should show the body, selected
stake definition, bundled hub building, and expected building and resource
constraints. The official
[C4 PTR claim-stake guide](https://support.staratlas.com/hc/en-us/articles/52247034465939-How-to-Set-Up-a-Claim-Stake-in-C4-PTR)
shows where this flow appears in the game client.

::: info Position in the account hierarchy
**Owned by:** SAGE program through `@staratlas/dev-sage`<br>
**World context:** one `CelestialBody` inside a `StarSystem` and `Game`<br>
**Player context:** Profile, Profile Faction, Character, and StarbasePlayer<br>
**Activity account:** `ClaimStakeInstance` is signer-created and has no generated PDA helper<br>
**Connects to:** buildings, rent, production, cargo, currency config, and fleet-transfer state
:::

## Developer use

Use this page when you need to:

- inspect a placed claim stake and its construction or production state
- explain rent, crew, buildings, and production-core fields
- prepare placement, rent top-up, production, transfer, respawn, or deconstruction flows
- show which celestial-body, character, starbase-player, and currency context a claim-stake action touches

## Technical model

The generated client exposes `ClaimStakeInstance` as the main account but does not expose a PDA helper for it. Applications normally get the address from the UI, an indexer, account discovery, or the transaction that created the instance.

Claim-stake write paths commonly cross several domains: Player Profile validation, Profile Faction, Character, Celestial Body, Starbase Player, Game, Currency Config, and sometimes fleet or cargo state. A transaction prompt should explain those related accounts instead of presenting the claim stake as isolated state.

## Generated anchors

Claim-stake account and instruction helpers live in `@staratlas/dev-sage`.

```ts
import {
	fetchMaybeClaimStakeInstance,
	getClaimStakesResourceProductionInstructionAsync,
	getPlaceClaimStakeInstanceWithHubInstructionAsync
} from '@staratlas/dev-sage';
```

## Accounts and types

| Generated symbol | Kind | Beginner meaning |
| --- | --- | --- |
| `ClaimStakeInstance` | account | A placed claim stake owned by a player on a celestial body. |
| `ClaimStakeDefinition` | type | Definition data for stake classes and costs. |
| `ClaimStakesInfo` | type | Runtime/config context for claim-stake behavior. |
| `ClaimStakeTransfer` | type | Fleet-transfer state used when moving resources through claim-stake flows. |
| `StructureInstanceState` | union | Whether an instance is `Active`, in `Design`, or `Deactivated`. |

The generated client does not expose a PDA helper for `ClaimStakeInstance`, so a caller normally needs the instance address from a UI, indexer, transaction result, or account discovery pass.

## `ClaimStakeInstance` account

Important fields:

```txt
owner                     owner of the claim stake instance
gameId                    SAGE game account
celestialBodyId           celestial body where the stake is placed
claimStakeDefinitionId    claim stake definition id
claimStakeDefinitionSeqId sequence id of claim stake definitions
buildingDefinitionSeqId   sequence id of building definitions
systemSeqId               sequence id of the containing system
lastRentClockTimestamp    last rent collection time
constructionRemaining     construction seconds remaining
constructionProgressTimestamp active-time construction cursor
rentBalance               available rent balance
neededCrew                crew needed by this stake
buildings                 building id to count map
state                     Active, Design, or Deactivated
productionCore            production and consumption core
```

Read these fields as the on-chain state of a single deployed stake. Definition ids and sequence ids tie the instance back to game configuration; rent, construction, crew, buildings, and production core tell you what it is doing now.

## State model

`ClaimStakeInstance.state` uses the same generated `StructureInstanceState` union as crafting habs.

Current generated variants:

```txt
Active
Design
Deactivated
```

For beginners:

- `Active` means the stake is in its active mode.
- `Design` means it carries intermediate design data that still needs finalization or cancellation.
- `Deactivated` means the instance is no longer active and carries structure-state data.

## Read a claim stake

This example reads a claim stake by address. It does not sign or send a transaction.

```ts
import { address, createSolanaRpc } from '@solana/kit';
import { fetchMaybeClaimStakeInstance } from '@staratlas/dev-sage';

const rpc = createSolanaRpc('https://testnet-rpc.z.ink');
const claimStakeAddress = address('CLAIM_STAKE_INSTANCE_ADDRESS_HERE');

const claimStake = await fetchMaybeClaimStakeInstance(
	rpc,
	claimStakeAddress,
	{ commitment: 'confirmed' }
);

if (!claimStake.exists) {
	throw new Error(`Claim stake not found: ${claimStakeAddress}`);
}

console.log({
	owner: claimStake.data.owner,
	gameId: claimStake.data.gameId,
	celestialBodyId: claimStake.data.celestialBodyId,
	definitionId: claimStake.data.claimStakeDefinitionId,
	state: claimStake.data.state.__kind,
	rentBalance: claimStake.data.rentBalance,
	neededCrew: claimStake.data.neededCrew
});
```

## Instruction families

Claim-stake-related instruction builders fall into several groups.

| Family | Instructions | What they manage |
| --- | --- | --- |
| Placement and removal | `placeClaimStakeInstanceWithHub`, `deconstructClaimStakeInstance`, `evictClaimStakeInstance` | Place claim stake instances with their matched hub building, remove, or evict claim stake instances. |
| Buildings | `placeClaimStakeBuildings`, `finalizeBuildingChanges`, `cancelClaimStakeBuildingDesign` | Design and finalize building changes on a claim stake. |
| Rent | `payClaimStakesRent`, `claimStakesRentTopUp` | Collect or add rent balance for claim stakes. |
| Production | `claimStakesResourceProduction` | Run resource production against a claim stake and celestial body. |
| Respawn | `respawnClaimStakeInstance`, `completeClaimStakeRespawn` | Move claim stakes through respawn flows. |
| Fleet transfer | `startClaimStakesFleetTransfer`, `exitClaimStakesFleetTransfer`, `forceExitClaimStakesFleetTransfer` | Move resources through fleet-to-claim-stake transfer state. |
| Runtime config | `updateClaimStakeDefinition`, `updateClaimStakeRuntimeConfig`, `updatePlanetTables` | Update definition and planet/runtime config used by claim stakes. |

Most player-facing claim-stake instructions touch more than one domain: Player Profile validation, Profile Faction, Starbase Player, Character, Celestial Body, Currency Cache, cargo, and sometimes fleet state.

## Live rent top-up trace

A recent PTR `claimStakesRentTopUp` transaction decoded to:

```ts
{
	keyIndex: 0,
	amount: '1000000'
}
```

Named account roles:

```txt
profileValidationSigner
profileValidationProfile
profileValidationProgram
character
claimStakeInstance
celestialBody
systemAndStarbasePlayerSystem
systemAndStarbasePlayerStarbasePlayer
game
```

The sampled transaction wrote the profile signer, profile, character, and claim-stake instance accounts. The celestial body, star system, starbase player, and game accounts were context. That distinction is useful for review screens: rent top-up mutates the specific stake and player/progression state, not every related world account.

## Instruction example: place a claim stake

This example builds a `placeClaimStakeInstanceWithHub` instruction for review. The older `placeClaimStakeInstance` helper is no longer exposed in `@staratlas/dev-sage@0.52.0`.

For the full read/build/review/simulate path, see [Claim Stake Placement Workflow](/sage-c4-bindings/claim-stake-placement-workflow).

```ts
import { getPlaceClaimStakeInstanceWithHubInstructionAsync } from '@staratlas/dev-sage';

// These values must come from wallet/profile state, celestial-body discovery,
// starbase-player state, and claim-stake definition selection.
const instruction = await getPlaceClaimStakeInstanceWithHubInstructionAsync({
	game: gameAddress,
	profileValidationSigner: signer,
	profileValidationProfile: profileAddress,
	profileFaction: profileFactionAddress,
	claimStakeInstance: claimStakeInstanceSigner,
	systemAndStarbasePlayerSystem: starSystemAddress,
	systemAndStarbasePlayerStarbasePlayer: starbasePlayerAddress,
	celestialBody: celestialBodyAddress,
	character: characterAddress,
	keyIndex: 0,
	claimStakeDefinitionId,
	hubBuildingId,
	initialRentAmount: 1n
});

console.log(instruction.programAddress);
```

Before sending a placement transaction, show:

- which wallet signs
- which Player Profile key index authorizes the action
- which Profile Faction account is used
- which celestial body receives the stake
- which claim-stake definition id is selected
- which hub building id is bundled with the stake
- how much initial rent is deposited
- which starbase-player, character, currency-cache, and claim-stake accounts become writable
- what simulation returns

## Instruction example: produce resources

`claimStakesResourceProduction` is a separate production instruction. Use it only after checking the exact account effects with PTR simulation.

```ts
import { getClaimStakesResourceProductionInstructionAsync } from '@staratlas/dev-sage';

const instruction = await getClaimStakesResourceProductionInstructionAsync({
	game: gameAddress,
	currencyCache: currencyCacheAddress,
	claimStakeInstance: claimStakeAddress,
	celestialBody: celestialBodyAddress
});

console.log(instruction.programAddress);
```

Before sending a production transaction, show:

- which claim-stake state changes
- which celestial body state changes
- which cargo or production-core values change
- whether rent, crew, construction, or cooldown state gates production
- what simulation returns

## Safety notes

Reading claim-stake accounts is safe. Sending claim-stake instructions can place infrastructure, consume rent, alter production, mutate building layouts, or move resources through fleets.

Keep send examples conservative until they include concrete PTR simulations and before/after account diffs.
