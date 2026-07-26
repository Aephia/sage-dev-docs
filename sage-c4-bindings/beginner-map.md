# Beginner Map

This section is for developers who are new to Star Atlas Golden Era (SAGE),
new to z.ink/Solana development, or both. C4 is the current SAGE release label.

The short version: the TypeScript packages let you read and build instructions
for Star Atlas programs on z.ink. SAGE C4 is browser strategy gameplay where
fleets, resources, crafting, territory, and faction identity settle into
on-chain state. Before you send anything, learn the nouns.

## The big picture

```txt
Wallet
  signs transactions

Player Profile
  stores Star Atlas identity and permissions

Profile Faction
  stores the faction chosen by a profile

SAGE
  stores and changes gameplay state
```

A wallet is the key that can sign. A profile is the Star Atlas identity. A faction account says which side that profile belongs to. SAGE accounts describe the game world: fleets, starbases, cargo, crafting, movement, combat, and other gameplay systems.

## Words you will see everywhere

### Remote Procedure Call (RPC)

An RPC endpoint is the URL your code talks to when it reads z.ink account data
or sends transactions.

For the SAGE C4 Public Test Realm (PTR), use:

```txt
https://testnet-rpc.z.ink
```

### Program

A z.ink/Solana program is on-chain code. In these docs, the important programs
are SAGE, Player Profile, and Profile Faction.

### Account

A z.ink/Solana account stores data. A SAGE fleet, a player profile, and a
profile's faction are all accounts.

### Address

An address identifies a program or account. It looks like a long base58 string.

### Program Derived Address (PDA)

A PDA is an account address calculated from known inputs, called seeds.

For example, a profile's faction account can be derived from the profile address. You do not have to search the whole chain if you already know the profile.

### Fetch helper

The generated packages include functions like `fetchMaybeProfile` and `fetchMaybeFleet`. These read and decode accounts for you.

Prefer `fetchMaybe...` while exploring because missing accounts become a normal `exists: false` result instead of an exception.

### Instruction

An instruction asks a z.ink/Solana program to do something. Reading an account
is harmless. Sending an instruction can change game state, move assets, spend
tokens, or require a wallet signature.

These docs start with read-only examples first.

## First path through the docs

Read these pages in order:

1. [Connection setup](/sage-c4-bindings/connection)
2. [Installation](/sage-c4-bindings/installation)
3. [`@solana/kit` client](/sage-c4-bindings/kit-client)
4. [Read identity and faction](/sage-c4-bindings/read-identity-and-faction)
5. [SAGE gameplay overview](/sage-c4-bindings/sage-gameplay-overview)

After that, the reference-style pages will make much more sense.

## Safety rule

Reading is fine. Signing is serious.

Before an example asks a wallet to sign, it should explain:

- which program is being called
- which account will change
- which wallet or profile authority is required
- whether assets, cargo, tokens, or fleet state can move
- how to simulate before sending
