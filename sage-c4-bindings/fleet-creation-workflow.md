# Fleet Creation Workflow

Creating a fleet turns ships and starbase context into a new active SAGE C4 fleet account. It is one of the first workflows where Player Profile, Profile Faction, Character, StarbasePlayer, and SAGE world state all meet.

Use this as the canonical review pattern for new-account workflows: read context, build instructions, summarize the account set, simulate a full transaction, then show diff targets before asking for a signature.

Do not present fleet creation as only "ship plus name". The KB frames crew as a real SAGE access and utility layer, so fleet setup screens should make crew availability and assignment visible when they affect the intended follow-up action.

## What Create Fleet Touches

`createFleet` uses the main SAGE program client:

```ts
import { getCreateFleetInstructionAsync } from '@staratlas/dev-sage';
```

The instruction data is small:

| Field | Meaning |
| --- | --- |
| `fleetLabel` | Fixed-size generated `Name` value shown on the fleet. |
| `keyIndex` | Player Profile key index authorizing the action. |

The account set is more important than the instruction data.

| Account | Role in the workflow |
| --- | --- |
| `profileValidationSigner` | Wallet/profile signer authorizing the action. |
| `profileValidationProfile` | Player Profile account being validated. |
| `profileFaction` | Faction account for the profile. |
| `character` | SAGE Character for this profile and game. |
| `game` | Root SAGE game account. |
| `fleet` | New Fleet account address. |
| `systemAndStarbasePlayerSystem` | Star system where the fleet is created. |
| `systemAndStarbasePlayerStarbasePlayer` | Player state at that starbase. |
| `systemProgram` | Solana System Program for account creation. |

## 1. Read the state

Before building the instruction, read:

- Player Profile, to show the active `keyIndex`.
- Profile Faction, to show faction context.
- Character, to confirm the SAGE player state exists.
- StarSystem, to confirm the starbase context.
- StarbasePlayer, to show available local player state.
- Any ship/cargo state your UI uses to explain what will become part of the fleet.

```ts
import {
	fetchMaybeCharacterFromSeeds,
	fetchMaybeStarSystem,
	fetchMaybeStarbasePlayerFromSeeds
} from '@staratlas/dev-sage';

const [character, starSystem, starbasePlayer] = await Promise.all([
	fetchMaybeCharacterFromSeeds(
		rpc,
		{ playerProfile: profileAddress, gameId: gameAddress },
		{ commitment: 'confirmed' }
	),
	fetchMaybeStarSystem(rpc, systemAddress, {
		commitment: 'confirmed'
	}),
	fetchMaybeStarbasePlayerFromSeeds(
		rpc,
		{ system: systemAddress, character: characterAddress },
		{ commitment: 'confirmed' }
	)
]);

if (!character.exists) throw new Error('SAGE character not found');
if (!starSystem.exists) throw new Error('Star system not found');
if (!starbasePlayer.exists) throw new Error('Starbase player not found');

console.log({
	character: character.address,
	system: starSystem.data.name,
	starbasePresent: starSystem.data.starbase.__option === 'Some',
	starbasePlayer: starbasePlayer.address
});
```

## 2. Build the instruction

```ts
import { address } from '@solana/kit';
import { getCreateFleetInstructionAsync } from '@staratlas/dev-sage';

const instruction = await getCreateFleetInstructionAsync({
	profileValidationSigner: walletSigner,
	profileValidationProfile: profileAddress,
	profileFaction: profileFactionAddress,
	character: characterAddress,
	game: gameAddress,
	fleet: address('NEW_FLEET_ADDRESS_HERE'),
	systemAndStarbasePlayerSystem: systemAddress,
	systemAndStarbasePlayerStarbasePlayer: starbasePlayerAddress,
	fleetLabel: 'Aephia Test Fleet',
	keyIndex: 0
});
```

`getCreateFleetInstructionAsync` can derive the Character PDA when it has the profile and game, but passing the address explicitly makes review screens easier to compare with preflight reads.

## 3. Review before signing

Show these items before a wallet signs:

- Fleet label.
- New fleet account address.
- Player Profile and `keyIndex`.
- Profile Faction value.
- Star system and starbase player address.
- Writable accounts: Player Profile, Character, Fleet, StarbasePlayer.
- Any ships, crew, cargo, fuel, ammo, or components the UI expects to assign.

## 4. Simulate the full transaction

Simulation must run against the complete transaction, especially when the UI bundles `createFleet` with ship or crew assignment instructions.

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

A recent PTR fleet-creation transaction bundled `createFleet` with follow-up `addShipToFleet` instructions in the same transaction. That is the shape real tooling should expect: creating the empty fleet account is often only the first step.

Decoded `createFleet` data:

```ts
{
	fleetLabel: 'Frozen Lynx',
	keyIndex: 0
}
```

One decoded `addShipToFleet` payload from the same transaction:

```ts
{
	ships: [{ id: 3101, amount: 4 }],
	shipEscrowIndex: 3,
	fleetShipInfoIndex: { __option: 'None' },
	keyIndex: 0
}
```

The transaction wrote the profile signer, profile, character, new fleet, and starbase-player accounts. It also read Profile Faction, Game, StarSystem, and System Program context. Total compute for the sampled transaction was about 67,000 units.

## 5. Diff targets

For simulation, use this account list to explain expected effects. When testing a real PTR transaction, compare before and after snapshots for:

| Account | Expected change |
| --- | --- |
| Fleet | New account should exist and decode as `Fleet`. |
| Character | Counters or fleet references may change. |
| StarbasePlayer | Local starbase player state may change. |
| Player Profile | Profile validation may touch writable profile state. |

Use [Transaction Review and Account Diffs](/sage-c4-bindings/transaction-review-and-diffs) for the generic summary and snapshot helpers.
