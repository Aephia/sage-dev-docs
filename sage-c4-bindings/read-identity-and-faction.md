# Read Identity and Faction

This page connects the two foundation programs used by SAGE examples:

- [Player Profile](/sage-c4-bindings/player-profile) stores player identity,
  keys, roles, and player names.
- [Profile Faction](/sage-c4-bindings/profile-faction) stores which faction a
  profile is enlisted with.

The examples are read-only. They can be used against the SAGE C4 PTR on the z.ink testnet without signing a transaction.

Read this page as a chain:

```txt
profile address
  -> read the profile
  -> derive and read the player name
  -> derive and read the faction account
  -> use those concepts when reading SAGE accounts
```

## Inputs

You need a Player Profile account address.

```ts
import { address } from '@solana/kit';

const profileAddress = address('PROFILE_ADDRESS_HERE');
```

The profile address is not necessarily the wallet address. Treat it as a Star Atlas profile account unless the UI or an indexer has already resolved that relationship for you.

::: tip Wallet vs profile
A wallet signs. A profile stores Star Atlas identity and permissions. One wallet can be related to profile state, but the addresses are not automatically the same thing.
:::

## Fetch the profile

This reads the profile account and prints a few beginner-useful fields:

- `authKeyCount`: how many auth keys are on the profile
- `keyThreshold`: how many keys are needed for profile updates
- `nextSeqId`: the next role sequence number
- `createdAt`: when the profile was created, as an on-chain timestamp

```ts
import { createSolanaRpc } from '@solana/kit';
import { fetchMaybeProfile } from '@staratlas/dev-player-profile';

const rpc = createSolanaRpc('https://testnet-rpc.z.ink');

const profile = await fetchMaybeProfile(rpc, profileAddress, {
	commitment: 'confirmed'
});

if (!profile.exists) {
	throw new Error(`Profile not found: ${profileAddress}`);
}

console.log({
	authKeyCount: profile.data.authKeyCount,
	keyThreshold: profile.data.keyThreshold,
	roleSequence: profile.data.nextSeqId,
	createdAt: profile.data.createdAt
});
```

The `profileKeys` array contains keys, permission scopes, expiry times, and raw permission bytes. Decode permission intent with the package permission helpers instead of manually interpreting the bytes in application code.

## Fetch the player name

`PlayerName` is a PDA derived from the profile address.

That means the account address is calculated from the profile address and a fixed seed. You do not have to know the player-name account in advance.

```ts
import { fetchMaybePlayerNameFromSeeds } from '@staratlas/dev-player-profile';

const playerName = await fetchMaybePlayerNameFromSeeds(
	rpc,
	{ profile: profileAddress },
	{ commitment: 'confirmed' }
);

if (playerName.exists) {
	const name = new TextDecoder().decode(new Uint8Array(playerName.data.name));
	console.log(name);
}
```

The generated account stores the name as remaining bytes. Decode it at the edge and keep the raw account object available for debugging.

## Fetch the faction account

`ProfileFactionAccount` is also a PDA derived from the profile address.

This account tells you which Star Atlas faction the profile is enlisted with.

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
	console.log('Profile has no faction account yet');
} else {
	console.log({
		profile: profileFaction.data.profile,
		faction: Faction[profileFaction.data.faction],
		bump: profileFaction.data.bump
	});
}
```

The generated `Faction` enum currently contains:

```ts
enum Faction {
	Unaligned,
	Mud,
	Oni,
	Ustur
}
```

In Star Atlas gameplay terms, choosing MUD, ONI, or Ustur is strategic identity,
not a cosmetic preference. Major faction choice has historically been
account-bound and permanent, so apps should avoid presenting faction state as
a casual toggle unless the current PTR flow explicitly says otherwise.

## How this fits SAGE

SAGE fleet accounts include both `ownerProfile` and `faction`. That is the bridge from identity and faction state into the gameplay program.

In plain English: when you read a fleet, you can see which Star Atlas profile owns it and which faction it belongs to.

```ts
import { fetchMaybeFleet } from '@staratlas/dev-sage';

const fleet = await fetchMaybeFleet(rpc, address('FLEET_ADDRESS_HERE'), {
	commitment: 'confirmed'
});

if (fleet.exists) {
	console.log({
		ownerProfile: fleet.data.ownerProfile,
		faction: Faction[fleet.data.faction],
		label: fleet.data.fleetLabel
	});
}
```

## Safety notes

These read examples can be run freely against PTR RPC. Before turning them
into transaction builders, identify:

- the signer or wallet that is expected to authorize the action
- which profile key or role grants permission
- which accounts are writable
- which assets, cargo, fleet state, or faction state can change
- a simulation step before asking a wallet to sign

Continue with [Character and Progression](/sage-c4-bindings/character-progression)
to derive the game-specific player account, then use the
[Account Relationship Map](/sage-c4-bindings/account-relationship-map) to
resolve StarbasePlayer, Fleet, and world state.
