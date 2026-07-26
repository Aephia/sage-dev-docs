# `@solana/kit` Client

The SAGE C4 program clients are generated for `@solana/kit`, not the legacy `@solana/web3.js` client shape.

Start with one explicit PTR client and pass it into generated fetch helpers.

If you are new to this: the client is the object your code uses to ask the z.ink testnet for account data. It does not sign anything by itself.

## Create the PTR client

```ts
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit';

export const sagePtr = {
	rpc: createSolanaRpc('https://testnet-rpc.z.ink'),
	subscriptions: createSolanaRpcSubscriptions('wss://testnet-rpc.z.ink')
};
```

Use `sagePtr.rpc` for generated account fetches.

The next example reads a Player Profile account. Replace `PROFILE_ADDRESS_HERE` with a real Player Profile account address when you have one.

```ts
import { address } from '@solana/kit';
import { fetchMaybeProfile } from '@staratlas/dev-player-profile';

const profileAddress = address('PROFILE_ADDRESS_HERE');
const profile = await fetchMaybeProfile(sagePtr.rpc, profileAddress, {
	commitment: 'confirmed'
});

if (!profile.exists) {
	throw new Error('Profile account not found');
}

console.log(profile.data.authKeyCount);
```

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
- they give you real account data for future transaction examples

State-changing instruction examples should come after the read path is documented and after every account role is clear.

::: warning RPC data is external input
Generated decoders are useful, but RPC responses still cross a trust boundary. Validate existence, owner expectations, and account role before using decoded data to make signing decisions.
:::
