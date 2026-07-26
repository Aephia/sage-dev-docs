# Fleets

Fleets are a natural first SAGE gameplay domain after Player Profile and Profile Faction.

In game terms, a fleet is a group of ships controlled by a player profile. Fleets move, dock, carry cargo, mine, fight, repair, reload, and represent much of the player's active presence in SAGE.

Fleet workflows sit at the center of SAGE because they connect movement, starbases, resources, crafting, progression, and faction conflict.

Ships alone are not the whole gameplay gate. Crew Cards, crew assignment,
faction assignment, stations, and perks explain why newer fleet and crafting
builders include crew-binding and roster state.

::: info Position in the account hierarchy
**Owned by:** SAGE program through `@staratlas/dev-sage`<br>
**Scoped by:** `Game` and owner `Profile`<br>
**Player context:** `Character`, `ProfileFactionAccount`, and often `StarbasePlayer`<br>
**Derived from:** game address, owner-profile address, and the exact 64-byte fleet label<br>
**Connects to:** cargo pods, star systems, starbases, claim stakes, crew, combat, mining, and scanning
:::

If the exact label is unknown, discover fleets by discriminator plus `gameId`
or `ownerProfile`, then decode them. See the
[Account Relationship Map](/sage-c4-bindings/account-relationship-map) for the
difference between derivation and discovery.

## Developer use

Use this page when you need to build tools for:

- showing a player's active fleets and ship composition
- explaining whether a fleet is docked, idle, moving, mining, respawning, or destroyed
- preparing movement, mining, cargo, repair, crew, or ship-assignment transactions
- reviewing which fleet, character, starbase-player, and cargo state can change before signing

## Technical model

Fleet state lives in the SAGE program. The `Fleet` account is player-owned game state, while related accounts such as `Character`, `StarbasePlayer`, `StarSystem`, and `Game` provide authority, location, and configuration context.

Live PTR traces show that fleet workflows commonly include Player Profile validation accounts and use `keyIndex: 0` in the sampled player actions. Treat the profile signer, profile account, fleet account, character account, and starbase-player account as the first accounts to explain in transaction review.

## Program Client

Fleet account and instruction helpers live in `@staratlas/dev-sage`.

```ts
import {
	fetchMaybeFleet,
	fetchMaybeFleetFromSeeds,
	findFleetPda,
	getCreateFleetInstructionAsync,
	SAGE_PROGRAM_ADDRESS
} from '@staratlas/dev-sage';
```

## Account

SAGE has one primary fleet account type: `Fleet`.

| Field group | Beginner meaning | Example fields |
| --- | --- | --- |
| Identity | Which game/profile/faction owns the fleet. | `gameId`, `ownerProfile`, `subProfile`, `faction` |
| Label and ships | Human-ish label and ship composition. | `fleetLabel`, `shipCounts`, `fleetShips` |
| Movement and state | Where the fleet is and what it is currently doing. | `location`, `state`, `lastUpdateAt` |
| Timers | Cooldowns and delayed effects. | `warpCooldownExpiresAt`, `scanCooldownExpiresAt`, `apReloadExpiresAt` |
| Combat | Current survivability and combat posture. | `ap`, `sp`, `hp`, `pendingHp`, `stance` |
| Cargo | Fuel, ammo, cargo, components, and respawn cargo. | `fuelTank`, `ammoBank`, `cargoHold`, `components`, `respawningCargo` |
| Crew and temporary effects | Crew currently loaded or rented, NPC faction context, and active stimulants. | `crewCount`, `rentedCrew`, `npcFactionId`, `activeStimulants` |

## Fleet state

`Fleet.state` is a generated union. It tells you what the fleet is doing right now.

Current generated variants:

```txt
Idle
ClaimStakeTransfer
Destroyed
Docked
MineAsteroid
MoveWarp
MoveSubwarp
Respawn
```

For beginners, read this as the fleet's current mode. A fleet that is `Docked` should be interpreted differently from one that is `MoveSubwarp` or `Destroyed`.

```ts
if (fleet.exists) {
	console.log(fleet.data.state.__kind);
}
```

The generated union uses Codama tuple encoding. Variant data is under `state.fields[0]`; for example, a warp payload is `fleet.data.state.fields[0]`, while subwarp journey data is one level deeper at `fleet.data.state.fields[0].journey`.

Movement coordinates and several durations use generated `FixedPoint` values. Convert them with `.toNumber()` before arithmetic:

```ts
const [x, y] = fleet.data.location.map((coordinate) => coordinate.toNumber());
```

Do not assume that timestamp interpolation is authoritative game state. `MoveWarp` keeps the departure point in the top-level location until completion. `MoveSubwarp` can settle progress incrementally and is constrained by fuel, so a purely time-based projection is only a display estimate.

## Ship counts

`ShipCounts` groups ships by size class.

```txt
total
xxSmall
xSmall
small
medium
large
capital
commander
titan
```

The generated fields are counts, not token metadata. Use them to understand the fleet composition, then fetch or join additional data when you need ship details.

## PDA helper

Fleet accounts can be derived with `findFleetPda`.

| Helper | Seeds | Meaning |
| --- | --- | --- |
| `findFleetPda` | `gameId`, `ownerProfile`, `fleetLabelPart1`, `fleetLabelPart2` | Find a fleet account from game, owner profile, and split label bytes. |

The label seeds are two 32-byte arrays. The generated `Name` type is a fixed 64-byte UTF-8 field, so the PDA splits the label into two fixed-size parts.

If you already know the fleet account address, use `fetchMaybeFleet`. If you only know the seeds, use `fetchMaybeFleetFromSeeds`.

For a complete label-padding example and live NPC fleets that can be used as decoder fixtures, see [Reading Live Game State](/sage-c4-bindings/reading-game-state).

## Read a fleet by address

This example reads a fleet account directly. It does not sign or send a transaction.

```ts
import { address, createSolanaRpc } from '@solana/kit';
import { Faction } from '@staratlas/dev-profile-faction';
import { fetchMaybeFleet } from '@staratlas/dev-sage';

const rpc = createSolanaRpc('https://testnet-rpc.z.ink');
const fleetAddress = address('FLEET_ADDRESS_HERE');

const fleet = await fetchMaybeFleet(rpc, fleetAddress, {
	commitment: 'confirmed'
});

if (!fleet.exists) {
	throw new Error(`Fleet not found: ${fleetAddress}`);
}

console.log({
	label: fleet.data.fleetLabel,
	ownerProfile: fleet.data.ownerProfile,
	faction: Faction[fleet.data.faction],
	state: fleet.data.state.__kind,
	shipCount: fleet.data.shipCounts.total,
	hp: fleet.data.hp,
	sp: fleet.data.sp,
	ap: fleet.data.ap
});
```

## Instruction families

Fleet-related instruction builders fall into several groups.

| Family | Instructions | What they manage |
| --- | --- | --- |
| Lifecycle | `createFleet`, `disbandFleet`, `forcedDisbandFleet`, `disbandDestroyedFleet` | Create and remove fleets, including destroyed or invalid cases. |
| Ships and crew | `addShipToFleet`, `addShipEscrow`, `removeShipEscrow`, `loadFleetCrew`, `unloadFleetCrew` | Change ship or crew composition and escrow. |
| Cargo | `transferCargoToFleet`, `transferCargoWithinFleet` | Move cargo between fleet cargo pods or between fleet and starbase-related storage. |
| Repair and reload | `repairDockedFleet`, `repairIdleFleet`, `reloadFleetAp` | Restore health or ability power. Current repair builders also carry Atlas reward registry/config/epoch/contribution accounts. |
| Combat | `attackFleet`, `applyCombatStimulant`, `resolveCombatRewards`, `sweepExpiredCombatRewardLoot` | Attack another fleet, apply temporary stimulants, and settle or clean up combat rewards. Current attack builders include faction ownership/relation and attacker/defender reward accounts. |
| Claim stake transfer | `startClaimStakesFleetTransfer`, `exitClaimStakesFleetTransfer`, `forceExitClaimStakesFleetTransfer` | Move resources between claim stake and fleet flows. |
| Crew binding | `bindCrew`, `unbindCrew`, `loadFleetCrewRoster`, `unloadFleetCrewRoster`, `awardCrewActivityXp` | Bind fleet crew, manage rosters, and award crew activity XP. |
| Synchronization and handlers | `syncFleetWithGame`, `theOneFleetStateHandler`, `forceUndockStaleFleet` | Keep fleet state aligned with game rules and timers. |

Many fleet instructions include Player Profile validation accounts. A create-fleet flow needs both gameplay accounts and profile authority context.

## Instruction example: create fleet

This example builds a `createFleet` instruction for review.

For the full read/build/review/simulate path, see [Fleet Creation Workflow](/sage-c4-bindings/fleet-creation-workflow).

```ts
import { getCreateFleetInstructionAsync } from '@staratlas/dev-sage';

// These values must come from your wallet, profile, game, and starbase flow.
// They are placeholders here so the example stays in review mode.
const instruction = await getCreateFleetInstructionAsync({
	profileValidationSigner: signer,
	profileValidationProfile: profileAddress,
	profileFaction: profileFactionAddress,
	character: characterAddress,
	game: gameAddress,
	fleet: fleetAddress,
	systemAndStarbasePlayerSystem: starSystemAddress,
	systemAndStarbasePlayerStarbasePlayer: starbasePlayerAddress,
	fleetLabel: 'First Fleet',
	keyIndex: 0
});

console.log(instruction.programAddress);
```

Before sending a create-fleet transaction, show:

- which wallet signs
- which Player Profile is being validated
- which faction account is being used
- which game and starbase context the fleet belongs to
- what label is used to derive the fleet PDA
- which accounts become writable
- what simulation returns

## Safety notes

Reading fleets is safe. Sending fleet instructions can change game state, cargo, ship assignment, combat state, or resource flows.

Before requesting a signature, show the transaction summary. Do not hide
signers, writable accounts, cargo, or asset movement behind helper magic.
