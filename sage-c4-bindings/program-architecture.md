# Program Architecture

SAGE C4 is a major expansion and update of SAGE. For developers, its on-chain state is reached through three generated program clients:

- `@staratlas/dev-player-profile`
- `@staratlas/dev-profile-faction`
- `@staratlas/dev-sage`

Read them as a layered system. Player Profile answers "who is acting?", Profile Faction answers "which faction is this profile aligned with?", and SAGE answers "what game state is being read or changed?"

For a beginner-first diagram, start with the
[Beginner Map](/sage-c4-bindings/beginner-map). For exact PDA, stored-field,
nested-data, and instruction-only relationships, use the
[Account Relationship Map](/sage-c4-bindings/account-relationship-map).

## SAGE C4 in Star Atlas

SAGE C4 is the strategic gameplay layer of Star Atlas as a live browser game and public test realm. It models an on-chain economy where players operate fleets, move through star systems, mine and scan for resources, haul cargo, craft goods, trade through local markets, upgrade starbases, place claim stakes, and compete through faction-sensitive systems.

The TypeScript clients are the developer interface to the on-chain programs behind that game. They make program accounts, PDA seeds, instruction builders, parsers, enums, and data wrappers available to tools without reducing SAGE C4 to its developer packages.

## Program stack

| Layer | Package | Program address | Main job |
| --- | --- | --- | --- |
| Identity | `@staratlas/dev-player-profile` | `C4PRoFNroxxzdgeCoM31LJjYRg7kT6ymogSTAT99iD1u` | Profiles, names, auth keys, roles, and profile permissions. |
| Faction | `@staratlas/dev-profile-faction` | `C4FACQA1PpNRKrjQ2862ABNR42DTz7EzGj1uhTNFASwP` | One profile's faction selection. |
| Gameplay | `@staratlas/dev-sage` | `C4SAgeKLgb3pTLWhVr6NRwWyYFuTR7ZeSXFrzoLwfMzF` | Game world, fleets, cargo, crafting, markets, combat, progression, and economy loops. |

## Why the split matters

SAGE instructions often accept accounts from all three layers.

Example: a fleet action may need:

- a wallet signer
- a Player Profile account
- a key index proving which profile key is authorizing the action
- a Profile Faction account
- a SAGE Character account
- a SAGE Fleet account
- one or more SAGE world, cargo, or starbase accounts

Do not treat the wallet address as the whole identity. The wallet signs; Player Profile validates the profile authority; Profile Faction provides faction context; SAGE mutates gameplay state.

## Dependency flow

```txt
wallet signer
  -> Player Profile profile + profile key index
  -> Profile Faction profile-faction account
  -> SAGE character
  -> SAGE gameplay accounts
```

This is why a SAGE integration usually resolves identity first, faction second, and gameplay state third.

## Read-only flow

A beginner-safe SAGE app should usually start with reads:

1. Connect to the PTR RPC.
2. Read the Player Profile.
3. Read the Player Name if it exists.
4. Read the Profile Faction account if it exists.
5. Derive and read the SAGE Character account.
6. Read SAGE domain state such as fleets, starbases, recipes, or local markets.

That gives the UI enough context to explain what would happen before asking a wallet to sign.

## State-changing flow

Before building a transaction:

1. Show which program will be called.
2. Show which profile key index authorizes the action.
3. Show the generated instruction name.
4. Show all signers.
5. Show writable accounts.
6. Show resource, cargo, ATLAS, XP, cooldown, or state effects.
7. Simulate the transaction.
8. Only then ask for a wallet signature.

The generated instruction builder is not a policy decision. It only constructs bytes and account metas.

## Program boundaries

### Player Profile

Player Profile is reusable identity infrastructure. SAGE uses it, but it is not SAGE-specific gameplay state.

Player Profile covers:

- profile existence
- readable player name
- profile keys
- permission bytes
- roles and delegated authority
- `keyIndex` values used by generated instruction builders

### Profile Faction

Profile Faction is a small bridge program. It does not manage starbases or fleets directly; it records faction selection for a profile.

Profile Faction covers:

- faction account derivation
- `Faction` enum display
- faction preconditions before SAGE actions
- why fleets, starbases, risk zones, and territory are faction-sensitive

### SAGE

SAGE is the main strategic game program.

SAGE covers:

- game configuration
- world map and star systems
- characters and progression
- fleets and movement
- starbases and starbase players
- cargo, currency, crafting, local markets, claim stakes
- mining, scanning, loot, combat, repair, and respawn

## PTR Context

SAGE C4 is currently testable through the browser client and the z.ink testnet environment.

```txt
HTTP RPC:      https://testnet-rpc.z.ink
WebSocket RPC: wss://testnet-rpc.z.ink
Explorer:      https://explorer.z.ink
```

Treat PTR behavior as test-realm behavior: useful for integration, not a permanent mainnet contract.

See [Programs, Accounts, and Terms](/sage-c4-bindings/concepts-and-terms) for
the application-to-program layers used throughout this page.
