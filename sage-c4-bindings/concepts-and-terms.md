# Programs, Accounts, and Terms

This reference defines the shared vocabulary of the Star Atlas Golden Era
(SAGE) C4 bindings. Domain guides explain how each concept applies to the game.

## Application layers

### Binding or generated client

A binding is generated TypeScript code for one on-chain program. It provides
typed account decoders, fetch helpers, PDA helpers, instruction builders,
parsers, enums, errors, and codecs.

The binding does not contain the live game state, discover every account, hold
wallet keys, or decide whether a transaction should be sent.

### `@solana/kit`

`@solana/kit` supplies the z.ink/Solana primitives used by the bindings:
addresses, RPC clients, codecs, transaction messages, signers, and transaction
encoding.

### Remote Procedure Call (RPC)

RPC is the request interface used to read chain state, simulate transactions,
submit signed transactions, and query network information. The C4 PTR uses the
z.ink endpoints listed in [Connection Setup](/sage-c4-bindings/connection).

### Indexer

An indexer continuously reads chain data and reshapes it into application-
friendly queries. It is useful when a PDA cannot be derived from inputs the
application already knows, or when scanning the complete program on every
request would be too expensive.

## On-chain structure

### Program

A program is executable on-chain code. C4 uses separate SAGE, Player Profile,
and Profile Faction programs. Each program address identifies the code that
owns or validates its account family.

### Account

An account is addressable on-chain state. Accounts can represent identity,
configuration, world data, player state, active jobs, inventories, rewards, or
other domain data.

### Address

An address identifies a program or account. A wallet address, program address,
and data-account address can all look similar, but their roles are different.

### Program Derived Address (PDA)

A PDA is an address derived deterministically from a program address and a
specific ordered set of seed bytes. Use the generated `find...Pda` helpers
instead of reproducing string prefixes and byte encodings by hand.

Not every account is a PDA. Some C4 accounts are signer-created or must be
found through transaction results, stored-field joins, an indexer, or a
filtered program-account query.

### Seed

A seed is one input to a PDA derivation. Seeds can include fixed text, another
account address, an identifier, a sequence number, or fixed-size name bytes.
All required seeds and their order matter.

### Bump

A bump is the extra one-byte seed used to find a valid PDA. Generated helpers
return it with the derived address. Most application code should not search
for bumps manually.

### Discriminator

A discriminator is the byte prefix that identifies an account or instruction
type. It is used to reject the wrong data shape and to filter
`getProgramAccounts` queries before decoding.

### `memcmp` filter

A `memcmp` filter asks RPC to return accounts whose encoded bytes match a
specific value at a specific offset. Only use offsets verified against the
current generated account layout. Later fields can move when account versions
change.

### Nested data

Some generated types are decoded inside a parent account and do not have their
own address. For example, `Starbase` is nested in `StarSystem.starbase`; there
is no standalone Starbase account or Starbase PDA.

### Sysvar

A sysvar is a system-provided account containing runtime data. Instructions
can require sysvars such as recent slot hashes or the current instruction list.

## Reading and writing

### Fetch helper

Generated helpers such as `fetchMaybeFleet` read and decode one account.
Seed-aware helpers such as `fetchMaybeCharacterFromSeeds` first derive the PDA.

Use `fetchMaybe...` while exploring so a missing account becomes
`exists: false` instead of an exception.

### Decoder

A decoder turns encoded bytes into the generated TypeScript account shape.
Validate existence, expected owner, and discriminator before treating decoded
data as trusted application state.

### Instruction

An instruction asks one program to execute an operation. It includes the
program address, ordered account metadata, and encoded instruction data.

Building an instruction does not sign, simulate, or send it.

### Signer

A signer proves authorization with a private key. A wallet can sign for a key
stored on a Player Profile, while `keyIndex` tells the profile-validation logic
which profile key is being used.

### Key index

`keyIndex` is the position of the authorizing key in `Profile.profileKeys`. It
is account-data context, not a wallet address or a globally fixed value. Read
the Profile and verify that the selected key exists, has not expired, and has
the required permission before building a write.

### Writable account

An instruction marks accounts writable when the program may change them.
Writable accounts are the first useful approximation of what a transaction
review should explain, but exact effects still depend on program logic.

### Sentinel account

Some generated builders fill an absent optional account position with a known
program-address sentinel. Treat that value as “optional account not supplied,”
not as another domain account to fetch.

### Simulation

Simulation executes a complete encoded transaction without committing its
state. Use it to inspect errors, logs, compute use, and expected account effects
before asking a wallet to sign.

## Game and value terms

### Public Test Realm (PTR)

The PTR is the public C4 test environment at `https://sage.staratlas.com`. Its
program addresses, state, and behavior are separate from production Star Atlas
deployments and can change.

### Solana Virtual Machine (SVM)

The SVM is the execution environment used by Solana-compatible chains. z.ink is
a dedicated SVM chain; it is not Solana mainnet.

### ATLAS and Floyds

ATLAS is a Star Atlas currency. A Floyd is the smallest ATLAS unit used by
generated integer fields. Display code must apply the correct denomination
instead of showing raw values as whole ATLAS.

### HP, SP, and AP

Fleet and starbase fields use hit points (HP), shield points (SP), and ability
points (AP). The exact effects and regeneration rules belong to the relevant
gameplay system; generated fields only expose the current stored values.

### XP and LP

Experience points (XP) track progression. Loyalty Points (LP) belong to
faction-supporting reward flows. Do not infer reward policy from a field name
alone; verify the active C4 configuration and workflow.

### Survey Data Unit (SDU)

SDUs are resources found through scanning and used by crafting and other
production loops. See
[Mining, Scanning, and Loot](/sage-c4-bindings/mining-scanning-loot).

## Relationship reference

For the exact generated relationships—including PDA seeds, stored-field joins,
nested values, instruction-only context, and accounts requiring discovery—see
the [Account Relationship Map](/sage-c4-bindings/account-relationship-map).
