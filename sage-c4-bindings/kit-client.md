# `@solana/kit` Client

The SAGE C4 program clients are generated for `@solana/kit`, not the legacy `@solana/web3.js` client shape.

Start with one explicit PTR client and pass it into generated fetch helpers.

If you are new to this: the client is the object your code uses to ask the z.ink testnet for account data. It does not sign anything by itself.

The layers are:

```txt
generated fetch helper
  -> @solana/kit RPC client
  -> z.ink RPC endpoint
  -> encoded account response
  -> generated decoder
  -> typed account data
```

## Create the PTR client

```ts
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit';

export const sagePtr = {
	rpc: createSolanaRpc('https://testnet-rpc.z.ink'),
	subscriptions: createSolanaRpcSubscriptions('wss://testnet-rpc.z.ink')
};
```

Use `sagePtr.rpc` for generated account fetches.

## Run a real generated read

The next example reads a known Jorvik non-player-character (NPC) Player Profile
used by the live C4 Nemesis Engine. The profile address is stable even though
the individual fleets it owns are recreated regularly, so the example can be
run without first connecting a wallet or finding your own profile.

```ts
import { address } from '@solana/kit';
import { fetchMaybeProfile } from '@staratlas/dev-player-profile';

const profileAddress = address(
	'B8PCrai4bqyoR5VAcjFnLixQXejVNReNw6JunbeEACLj'
);
const profile = await fetchMaybeProfile(sagePtr.rpc, profileAddress, {
	commitment: 'confirmed'
});

if (!profile.exists) {
	throw new Error('Profile account not found');
}

console.log(profile.data.authKeyCount);
```

This proves that the RPC client and generated Player Profile binding work
together. Continue with [Reading Live Game State](/sage-c4-bindings/reading-game-state)
to discover current Fleet accounts owned by this profile, then decode one with
the SAGE binding.

## Account fetch shape

Generated account helpers follow a consistent naming pattern:

```txt
fetchX(rpc, address, config?)
fetchMaybeX(rpc, address, config?)
fetchAllX(rpc, addresses, config?)
fetchAllMaybeX(rpc, addresses, config?)
```

When the account has a generated PDA helper, there are seed-aware variants:

```txt
fetchXFromSeeds(rpc, seeds, config?)
fetchMaybeXFromSeeds(rpc, seeds, config?)
```

Use `fetchMaybeX` or `fetchMaybeXFromSeeds` while exploring. They make missing accounts an expected branch instead of throwing immediately.

For example, `fetchMaybeProfile` means "try to fetch a profile, but let me handle the case where it does not exist."

## Read-only first

Start with read-only account calls:

- they do not require a signer
- they do not move assets
- they are easier to compare against the PTR UI
- they give you real account data for later transaction flows

Build state-changing instructions only after the read path works and every
account role is clear.

See [Programs, Accounts, and Terms](/sage-c4-bindings/concepts-and-terms) for
the distinction between programs, accounts, PDAs, discovery, and instruction
building.

::: warning RPC data is external input
Generated decoders are useful, but RPC responses still cross a trust boundary. Validate existence, owner expectations, and account role before using decoded data to make signing decisions.
:::
