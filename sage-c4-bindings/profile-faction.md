# Profile Faction

`@staratlas/dev-profile-faction` links a Player Profile to a Star Atlas faction.

In Star Atlas terms, faction is part of the player's strategic identity. SAGE actions often need to know whether a profile belongs to MUD, ONI, or Ustur before the game can validate ownership, territory, starbase, or conflict-sensitive state.

For SAGE C4 developers, Profile Faction is the second foundation layer after Player Profile: it answers which side the profile belongs to before gameplay accounts such as fleets, characters, starbase players, and claim stakes are interpreted.

## Developer use

Use this page when you need to:

- read the faction account for a profile
- verify that a profile has chosen a faction before a SAGE action
- pass `profileFaction` into generated SAGE instruction builders
- explain faction-sensitive state in fleet, starbase, claim-stake, or combat flows

## Technical model

The package is Codama-generated, depends on `@staratlas/dev-player-profile` and `@solana/program-client-core`, and uses `@solana/kit ^6.1.0` as a peer dependency.

## Package metadata

| Field | Value |
| --- | --- |
| Package | `@staratlas/dev-profile-faction` |
| Version | `0.45.7` |
| License | `Apache-2.0` |
| Generator | Codama-generated Solana client |
| Dependencies | `@staratlas/dev-player-profile ^0.45.7`, `@solana/program-client-core ^6.1.0` |
| Peer dependency | `@solana/kit ^6.1.0` |

## Program address

```ts
import { PROFILE_FACTION_PROGRAM_ADDRESS } from '@staratlas/dev-profile-faction';

console.log(PROFILE_FACTION_PROGRAM_ADDRESS);
// C4FACQA1PpNRKrjQ2862ABNR42DTz7EzGj1uhTNFASwP
```

## What it owns

Profile Faction is a small foundation program:

- one profile-faction account type
- one `chooseFaction` instruction
- one PDA helper
- one `Faction` generated type

SAGE imports and uses faction concepts in gameplay account types, including fleet-related data. Document this package early so SAGE examples can talk about faction requirements without pretending faction state lives inside SAGE itself.

Faction choice is game-significant. Treat `chooseFaction` as a real gameplay action and verify current PTR behavior before presenting it as a simple setup step.

Star Atlas has historically treated major faction choice as account-bound and permanent. Keep that context in the UI copy even while PTR-specific mutation rules are being verified.

## Ecosystem role

In game terms, Profile Faction connects a player identity to one of the Star Atlas factions. That matters because SAGE is framed around faction conflict, faction home regions, starbases, and competition for resources.

This page covers:

- which profile has selected a faction
- how to derive and fetch that profile-faction account
- how the generated `Faction` type appears in SAGE account data
- where faction context matters for fleets, starbases, combat, and resource competition

Keep policy claims cautious until PTR behavior confirms whether a user can choose, reselect, or mutate faction state.

## Generated surface

The package exports roughly 49 named symbols.

| Group | Count | Examples |
| --- | ---: | --- |
| Accounts | 1 | `ProfileFactionAccount` |
| Instructions | 1 | `chooseFaction` |
| PDA helpers | 1 | `findProfileFactionAccountPda` |
| Generated types | 1 | `Faction` |

## Account families

Profile Faction has one account type.

| Account | Beginner meaning | Key fields |
| --- | --- | --- |
| `ProfileFactionAccount` | Stores the faction enlisted by one Player Profile. | `profile`, `faction`, `bump` |

The account is small because faction selection is the whole job of this program.

```txt
version   data version
profile   Player Profile account this faction belongs to
faction   selected faction enum value
bump      PDA bump
```

## PDA helper

`ProfileFactionAccount` is a PDA derived from the profile address.

| Helper | Seeds | Meaning |
| --- | --- | --- |
| `findProfileFactionAccountPda` | `profile` | Find the faction account for a Player Profile. |

```ts
import { findProfileFactionAccountPda } from '@staratlas/dev-profile-faction';

const [profileFactionAddress] = await findProfileFactionAccountPda({
	profile: profileAddress
});
```

Most code should use the helper instead of rebuilding seeds manually.

## Generated type

The generated `Faction` enum is the canonical C4 type for faction values in this package.

```ts
export enum Faction {
	Unaligned,
	Mud,
	Oni,
	Ustur
}
```

SAGE imports this enum too. For example, fleet data includes a `faction` field using the same generated concept.

## Instruction families

Profile Faction has one generated instruction.

| Instruction | What it does | State changed |
| --- | --- | --- |
| `chooseFaction` | Creates or updates the profile-faction account for a profile. | `ProfileFactionAccount` and profile-validation accounts |

The generated package exposes both:

- `getChooseFactionInstruction`
- `getChooseFactionInstructionAsync`

Use the async builder when you want it to derive the faction account PDA for you. Use the sync builder when you already have the faction account address.

## Basic imports

```ts
import {
	Faction,
	fetchProfileFactionAccount,
	findProfileFactionAccountPda,
	getChooseFactionInstruction
} from '@staratlas/dev-profile-faction';
```

## Read the faction account

This example reads the faction for a profile. It does not sign or send a transaction.

```ts
import { address, createSolanaRpc } from '@solana/kit';
import {
	Faction,
	fetchMaybeProfileFactionAccountFromSeeds
} from '@staratlas/dev-profile-faction';

const rpc = createSolanaRpc('https://testnet-rpc.z.ink');
const profileAddress = address('PROFILE_ADDRESS_HERE');

const profileFaction = await fetchMaybeProfileFactionAccountFromSeeds(
	rpc,
	{ profile: profileAddress },
	{ commitment: 'confirmed' }
);

if (!profileFaction.exists) {
	console.log('Profile has not chosen a faction account on this network');
} else {
	console.log({
		profile: profileFaction.data.profile,
		faction: Faction[profileFaction.data.faction]
	});
}
```

## Faction preflight for SAGE

This example turns faction lookup into a reusable preflight before a SAGE action.

```ts
import {
	Faction,
	fetchMaybeProfileFactionAccountFromSeeds
} from '@staratlas/dev-profile-faction';

const profileFaction = await fetchMaybeProfileFactionAccountFromSeeds(
	rpc,
	{ profile: profileAddress },
	{ commitment: 'confirmed' }
);

if (!profileFaction.exists) {
	throw new Error('Profile has no faction account on this network.');
}

if (profileFaction.data.faction === Faction.Unaligned) {
	throw new Error('Profile is unaligned. Choose a faction before SAGE play.');
}

console.log({
	profileFaction: profileFaction.address,
	faction: Faction[profileFaction.data.faction]
});
```

Use this before fleet creation, starbase-player registration, combat, claim-stake placement, or any other action where faction context affects game state.

## Instruction example

This example builds a `chooseFaction` instruction for review. Faction choice is game-significant, so a UI should summarize the profile, faction value, writable accounts, and simulation result before signing.

```ts
import {
	Faction,
	getChooseFactionInstructionAsync
} from '@staratlas/dev-profile-faction';

// This signer must come from your wallet/signing flow.
// It is a placeholder here so the example stays in review mode.
const instruction = await getChooseFactionInstructionAsync({
	profileValidationSigner: signer,
	profileValidationProfile: profileAddress,
	keyIndex: 0,
	faction: Faction.Mud
});

console.log(instruction.programAddress);
```

Before sending a transaction built from this instruction, explain:

- which wallet signs
- which Player Profile is being validated
- what `keyIndex` refers to on that profile
- which faction is being selected
- whether PTR currently allows reselection or mutation
- what simulation returns

## Permissions

The package exports `ProfileFactionPermissions` and `FACTION_FLAGS`.

```ts
import {
	FACTION_FLAGS,
	ProfileFactionPermissions
} from '@staratlas/dev-profile-faction';

const setFaction = new ProfileFactionPermissions(FACTION_FLAGS.SET_FACTION);
```

There is currently one faction permission flag:

| Flag | Meaning |
| --- | --- |
| `SET_FACTION` | Allows setting the profile's faction. |

## Reference checklist

- Account: `ProfileFactionAccount`
- PDA: `findProfileFactionAccountPda`
- Type: `Faction`
- Instruction builders: `getChooseFactionInstruction`, `getChooseFactionInstructionAsync`
- Parser: `parseChooseFactionInstruction`
- Permission wrapper: `ProfileFactionPermissions`

The first state-changing example should be careful: choosing a faction may be irreversible or game-significant depending on PTR rules. The generated client can build the instruction, but live behavior and signing policy should be verified before publishing a send example.

## Faction Layer

SAGE is a strategy game where factions compete for resources, starbases, territory, and influence. Profile Faction is the foundation program that connects a profile to that faction layer.
