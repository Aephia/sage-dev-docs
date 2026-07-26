# Installation

Install the generated clients for SAGE C4 together with the `@solana/kit` peer dependency.

This gives your TypeScript code three things:

- a Solana client library, `@solana/kit`
- generated Star Atlas program clients
- typed helpers for reading accounts and building instructions

```bash
pnpm add @solana/kit@^6.1.0 @staratlas/dev-sage@^0.52.0 @staratlas/dev-player-profile@^0.45.7 @staratlas/dev-profile-faction@^0.45.7
```

Use the current C4 package line:

| Package | Version | Role |
| --- | ---: | --- |
| `@staratlas/dev-sage` | `0.52.0` | Main SAGE gameplay program client |
| `@staratlas/dev-player-profile` | `0.45.7` | Player identity, auth keys, roles, and permissions |
| `@staratlas/dev-profile-faction` | `0.45.7` | Profile-to-faction selection state |
| `@solana/kit` | `^6.1.0` peer range; `6.10.0` inspected locally | Solana RPC, address, account, codec, and transaction primitives |

::: warning Peer dependency
The current Star Atlas C4 packages peer-depend on `@solana/kit ^6.1.0`. Keep the Solana kit major version aligned across all generated clients; mixing the old `^5.x` line with current SAGE packages will produce incompatible peer dependencies.
:::

::: tip Current generated surface
`@staratlas/dev-sage@0.52.0` exports the generated client plus `@staratlas/dev-sage/idl.json`. The package depends on `@solana/program-client-core ^6.1.0`, which supplies the generated account-meta and client plugin helpers used by the newer instruction builders.
:::

## Program addresses

A program address identifies on-chain code. These are not player wallets. They are the addresses of the Star Atlas programs your code will talk to.

```ts
import { SAGE_PROGRAM_ADDRESS } from '@staratlas/dev-sage';
import { PLAYER_PROFILE_PROGRAM_ADDRESS } from '@staratlas/dev-player-profile';
import { PROFILE_FACTION_PROGRAM_ADDRESS } from '@staratlas/dev-profile-faction';

export const programs = {
	sage: SAGE_PROGRAM_ADDRESS,
	playerProfile: PLAYER_PROFILE_PROGRAM_ADDRESS,
	profileFaction: PROFILE_FACTION_PROGRAM_ADDRESS
};
```

| Program | Address |
| --- | --- |
| SAGE | `C4SAgeKLgb3pTLWhVr6NRwWyYFuTR7ZeSXFrzoLwfMzF` |
| Player Profile | `C4PRoFNroxxzdgeCoM31LJjYRg7kT6ymogSTAT99iD1u` |
| Profile Faction | `C4FACQA1PpNRKrjQ2862ABNR42DTz7EzGj1uhTNFASwP` |

## Package roles

Do not start with SAGE in isolation. The package dependency graph mirrors the gameplay dependency graph:

```txt
Player Profile
  -> Profile Faction
      -> SAGE
```

Player Profile answers "who is acting?" Profile Faction answers "which faction is this profile enlisted with?" SAGE answers "what is happening in the game?"

For a beginner, think of it like this:

- Player Profile is the identity card.
- Profile Faction is the faction stamp on that identity.
- SAGE is the game board and the actions happening on it.
