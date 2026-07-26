# Player Profile

`@staratlas/dev-player-profile` is the identity and authorization foundation used by SAGE C4.

In Star Atlas terms, this is the player identity layer. A wallet signs, but a profile is the durable account other programs use to decide which player, name, role, and delegated authority is acting.

For SAGE C4 developers, Player Profile is the first account model to understand before fleets, crafting, cargo, claim stakes, or markets. Most player-facing SAGE instructions validate a profile and a `keyIndex` before they mutate game state.

## Developer use

Use this page when you need to:

- resolve a Star Atlas profile from application context
- read a player name or profile role membership
- explain which profile key is authorizing a SAGE instruction
- check whether a profile key is present before building a transaction
- prepare profile-validation accounts for SAGE instructions

## Technical model

The package is Codama-generated, depends on `@solana/program-client-core`, and uses `@solana/kit ^6.1.0` as a peer dependency.

## Package metadata

| Field | Value |
| --- | --- |
| Package | `@staratlas/dev-player-profile` |
| Version | `0.45.7` |
| License | `Apache-2.0` |
| Generator | Codama-generated z.ink/Solana client |
| Dependency | `@solana/program-client-core ^6.1.0` |
| Peer dependency | `@solana/kit ^6.1.0` |

## Program address

```ts
import { PLAYER_PROFILE_PROGRAM_ADDRESS } from '@staratlas/dev-player-profile';

console.log(PLAYER_PROFILE_PROGRAM_ADDRESS);
// C4PRoFNroxxzdgeCoM31LJjYRg7kT6ymogSTAT99iD1u
```

## What it owns

Player Profile provides the account model for Star Atlas player identity and authorization:

- profile accounts
- player names
- role accounts
- profile-role memberships
- profile keys and permission flags

SAGE instructions commonly need profile validation accounts or profile-related authority checks. Treat this package as the first foundation layer before documenting fleet, cargo, crafting, combat, or claim-stake flows.

## Ecosystem role

In game terms, Player Profile is not a SAGE gameplay loop by itself. It is the player identity layer that lets other Star Atlas programs reason about who owns or controls game state.

This page covers:

- which wallet or authority is acting for a profile
- how a player name relates to a profile
- how profile keys and roles model delegated authority
- which permissions a SAGE action expects before an instruction is built

Once profile authority is clear, later SAGE pages can focus on the gameplay domain they cover.

## Authority model

Most SAGE transaction builders ask for two profile-related values:

- `profileValidationProfile`: the Player Profile account being validated
- `keyIndex`: the index of the profile key authorizing the action

That means a wallet signature is not enough context for a UI. The UI also needs to show which profile key is being used and whether that key is present, expired, or scoped for the intended action.

The generated profile stores `profileKeys` as an ordered array. Treat the `keyIndex` as an account-data index, not a wallet address.

## Generated surface

The package exports roughly 347 named symbols.

| Group | Count | Examples |
| --- | ---: | --- |
| Accounts | 4 | `Profile`, `PlayerName`, `Role`, `ProfileRoleMembership` |
| Instructions | 18 | `createProfile`, `setName`, `addKeys`, `createRole`, `acceptInvite` |
| PDA helpers | 3 | `findPlayerNamePda`, `findRolePda`, `findProfileRoleMembershipPda` |
| Generated types | 4 | `ProfileKey`, `RoleMembership`, `MemberStatus`, `AddKeyInput` |

## Account families

Player Profile has four account types.

| Account | Beginner meaning | Key fields |
| --- | --- | --- |
| `Profile` | The Star Atlas identity account. This is the account other programs use when they need to know which player/profile is acting. | `authKeyCount`, `keyThreshold`, `nextSeqId`, `createdAt`, `profileKeys` |
| `PlayerName` | The on-chain display name for a profile. | `profile`, `name`, `bump` |
| `Role` | A role owned by a profile. Roles can group members and model delegated authority. | `profile`, `authorizer`, `roleSeqId`, `acceptingNewMembers`, `memberships` |
| `ProfileRoleMembership` | The roles one member profile has within another profile's role system. | `profile`, `member`, `memberships` |

Each generated account file provides discriminator bytes, codecs, decoders, and fetch helpers.

```ts
import {
	fetchMaybeProfile,
	fetchMaybePlayerNameFromSeeds,
	fetchMaybeProfileRoleMembershipFromSeeds,
	fetchMaybeRoleFromSeeds
} from '@staratlas/dev-player-profile';
```

Use the `fetchMaybe...` variants first. Missing accounts are common while exploring, and `exists: false` is easier for beginners than a thrown error.

## Account fields

### `Profile`

`Profile` is the core identity account.

```txt
version       data version
authKeyCount  number of auth keys on the profile
keyThreshold  number of auth keys needed to update profile auth
nextSeqId     next sequence number for a new role
createdAt     creation timestamp
profileKeys   keys, scopes, expiry times, and permission bytes
```

The profile address is not automatically the wallet address. A wallet signs; a profile stores Star Atlas identity and permissions.

### `PlayerName`

`PlayerName` stores the readable name for a profile. It is derived from the profile address.

```ts
const playerName = await fetchMaybePlayerNameFromSeeds(
	rpc,
	{ profile: profileAddress },
	{ commitment: 'confirmed' }
);
```

The generated account stores `name` as bytes. Decode those bytes at the edge of your app:

```ts
const name = new TextDecoder().decode(new Uint8Array(playerName.data.name));
```

### `Role`

`Role` belongs to a profile and has a sequence id. It can accept members and stores unordered membership entries.

Use `fetchMaybeRoleFromSeeds` when you know the owning profile and role sequence id:

```ts
const role = await fetchMaybeRoleFromSeeds(
	rpc,
	{
		profile: profileAddress,
		roleSeqId: 0n
	},
	{ commitment: 'confirmed' }
);
```

### `ProfileRoleMembership`

`ProfileRoleMembership` links a member profile to roles on another profile.

```ts
const membership = await fetchMaybeProfileRoleMembershipFromSeeds(
	rpc,
	{
		profile: profileAddress,
		member: memberProfileAddress
	},
	{ commitment: 'confirmed' }
);
```

Read it as: "which roles does this member have on this profile?"

## PDA helpers

A PDA is an account address derived from known inputs. Player Profile exposes three PDA helpers.

| Helper | Seeds | Meaning |
| --- | --- | --- |
| `findPlayerNamePda` | `profile` | Find the player-name account for a profile. |
| `findRolePda` | `profile`, `roleSeqId` | Find one role for a profile. |
| `findProfileRoleMembershipPda` | `profile`, `member` | Find one member's role membership account for a profile. |

The seed prefixes are generated into the package. Most application code should call the helpers instead of rebuilding seeds manually.

```ts
import { findPlayerNamePda } from '@staratlas/dev-player-profile';

const [playerNameAddress] = await findPlayerNamePda({
	profile: profileAddress
});
```

## Generated types

| Type | Meaning |
| --- | --- |
| `ProfileKey` | One key on a profile, with a `key`, permission `scope`, `expireTime`, and raw permission bytes. |
| `AddKeyInput` | Input shape used when adding a key. It has `scope`, `expireTime`, and permission bytes. |
| `RoleMembership` | A member key plus membership status. |
| `MemberStatus` | Enum with `Inactive` and `Active`. |

`expireTime < 0` means the key does not expire. Auth keys cannot expire.

## Instruction families

The generated package exposes instruction builders named `getXInstruction`, and parsers named `parseXInstruction`.

Read-only examples should come first. These instruction builders create transaction instructions, but they do not send them by themselves.

| Family | Instructions | What they manage |
| --- | --- | --- |
| Profile creation | `createProfile` | Create a profile account with initial key permissions and threshold. |
| Name | `setName` | Create or resize the player-name account and set profile name bytes. |
| Keys and auth | `addKeys`, `removeKeys`, `adjustAuth` | Add non-auth keys, remove non-auth keys, and adjust auth keys or auth threshold. |
| Roles | `createRole`, `removeRole`, `setRoleName`, `setRoleAuthorizer`, `setRoleAcceptingMembers`, `setRoleNotAcceptingMembers` | Create, remove, rename, authorize, and open or close roles. |
| Membership | `inviteMember`, `acceptInvite`, `joinRole`, `leaveRole`, `addRoleMember`, `removeRoleMember` | Invite, accept, join, leave, add, or remove members from roles. |
| SOL vault | `drainSolVault` | Withdraw from the profile SOL vault. Treat this as highly sensitive. |

## Beginner-safe read example

This example reads a profile and its player name. It does not sign or send a transaction.

```ts
import { address, createSolanaRpc } from '@solana/kit';
import {
	fetchMaybePlayerNameFromSeeds,
	fetchMaybeProfile
} from '@staratlas/dev-player-profile';

const rpc = createSolanaRpc('https://testnet-rpc.z.ink');
const profileAddress = address('PROFILE_ADDRESS_HERE');

const profile = await fetchMaybeProfile(rpc, profileAddress, {
	commitment: 'confirmed'
});

if (!profile.exists) {
	throw new Error(`Profile not found: ${profileAddress}`);
}

const playerName = await fetchMaybePlayerNameFromSeeds(
	rpc,
	{ profile: profileAddress },
	{ commitment: 'confirmed' }
);

console.log({
	authKeyCount: profile.data.authKeyCount,
	keyThreshold: profile.data.keyThreshold,
	name: playerName.exists
		? new TextDecoder().decode(new Uint8Array(playerName.data.name))
		: null
});
```

## Review a profile key

This example checks the key that a later SAGE instruction would reference by `keyIndex`.

```ts
import { address, createSolanaRpc } from '@solana/kit';
import { fetchMaybeProfile } from '@staratlas/dev-player-profile';

const rpc = createSolanaRpc('https://testnet-rpc.z.ink');
const profileAddress = address('PROFILE_ADDRESS_HERE');
const keyIndex = 0;

const profile = await fetchMaybeProfile(rpc, profileAddress, {
	commitment: 'confirmed'
});

if (!profile.exists) {
	throw new Error(`Profile not found: ${profileAddress}`);
}

const profileKey = profile.data.profileKeys[keyIndex];

if (!profileKey) {
	throw new Error(`Profile key index ${keyIndex} does not exist`);
}

const now = BigInt(Math.floor(Date.now() / 1000));
const neverExpires = profileKey.expireTime < 0n;
const expired = !neverExpires && profileKey.expireTime <= now;

console.log({
	key: profileKey.key,
	scope: profileKey.scope,
	expireTime: profileKey.expireTime,
	expired,
	permissionBytes: profileKey.permissions
});
```

Use this kind of check before showing a SAGE instruction. It gives the user a concrete authority review instead of a vague "connect wallet" prompt.

## Instruction example

This example builds a `setName` instruction object for review. It still needs transaction summary and simulation before a wallet prompt.

```ts
import { address } from '@solana/kit';
import {
	findPlayerNamePda,
	getSetNameInstruction
} from '@staratlas/dev-player-profile';

const profileAddress = address('PROFILE_ADDRESS_HERE');
const [nameAddress] = await findPlayerNamePda({ profile: profileAddress });
const encodedName = Array.from(new TextEncoder().encode('My SAGE Name'));

// These signers must come from your wallet/signing flow.
// They are placeholders here so the example stays in review mode.
const instruction = getSetNameInstruction({
	key: keySigner,
	funder: funderSigner,
	profile: profileAddress,
	name: nameAddress,
	keyIndex: 0,
	nameArg: encodedName,
	remainingAccounts: []
});

console.log(instruction.programAddress);
```

Before sending a transaction built from this instruction, explain which key signs, why `keyIndex` points to that key, who pays rent or resize costs, and what account will change.

## Permissions

The package exports `ProfilePermissions`, `PROFILE_FLAGS`, and `BitFlags`.

```ts
import { PROFILE_FLAGS, ProfilePermissions } from '@staratlas/dev-player-profile';

const allProfilePermissions = ProfilePermissions.all();
const canAddKeys = new ProfilePermissions(PROFILE_FLAGS.ADD_KEYS);
```

The current permission flags are:

| Flag | Meaning |
| --- | --- |
| `AUTH` | Auth key that can update the profile. Auth permission changes must meet the threshold. |
| `ADD_KEYS` | Add non-auth keys. |
| `REMOVE_KEYS` | Remove non-auth keys. |
| `CHANGE_NAME` | Change the profile's player name. |
| `CREATE_ROLE` | Create a new role. |
| `REMOVE_ROLE` | Remove a role. |
| `SET_AUTHORIZER` | Set a role's authorizer. |
| `JOIN_ROLE` | Join a role. |
| `LEAVE_ROLE` | Leave a role. |
| `TOGGLE_ACCEPTING_NEW_MEMBERS` | Open or close a role to new members. |
| `ADD_MEMBER` | Add a member to a role. |
| `REMOVE_MEMBER` | Remove a member from a role. |
| `DRAIN_SOL_VAULT` | Withdraw from the SOL vault. |

Profile permissions are security-sensitive. Any example that changes keys, roles, memberships, authorizers, or authentication settings must show the account metas plainly and recommend simulation before signing.

## Errors

The package exports Player Profile error constants and helpers:

```ts
import {
	getPlayerProfileErrorMessage,
	isPlayerProfileError,
	PLAYER_PROFILE_ERROR__KEY_MISSING_PERMISSIONS
} from '@staratlas/dev-player-profile';
```

Common beginner-facing errors include:

| Error | Meaning |
| --- | --- |
| `KEY_INDEX_OUT_OF_BOUNDS` / `KEY_INDEX_NOT_SET` | The instruction referenced a profile key index that does not exist or is empty. |
| `KEY_MISMATCH` / `PROFILE_MISMATCH` / `SCOPE_MISMATCH` | The provided accounts do not match the key, profile, or scope expected by the profile data. |
| `KEY_EXPIRED` | The selected key has expired. |
| `KEY_MISSING_PERMISSIONS` | The selected key does not have the required permission flag. |
| `INVALID_KEY_THRESHOLD` / `TOO_FEW_AUTH_KEYS` | The auth threshold is invalid for the auth keys supplied. |
| `ROLE_NOT_ACCEPTING_MEMBERS` | The role is closed to new members. |
| `ROLE_HAS_MEMBERS` | The role cannot be removed while members remain. |

## Common Starting Points

Start with these pages before deeper SAGE examples:

- Create or fetch a profile.
- Resolve a player name.
- Add and remove profile keys.
- Create a role and invite a member.
- Understand profile permissions used by SAGE.

Once those are clear, SAGE pages can reference profile validation without re-explaining the identity model each time.

## Star Atlas Identity Layer

Player Profile is shared identity and authorization infrastructure across Star
Atlas programs on z.ink. SAGE uses it to validate which profile is acting and
which profile key is authorizing a generated instruction.
