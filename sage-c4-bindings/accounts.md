# Accounts

Account reads are the first place where generated clients can create false confidence.

The generated decoder can prove shape after validation, but the raw account response still arrives from an external RPC and should be treated as untrusted input.

## Minimum account checks

Before decoding:

- Confirm the account exists.
- Confirm the account is expected to belong to the program/client you are using.
- Confirm the data length is plausible for the account kind.
- Confirm the discriminator or account tag matches the generated type.

## Prefer generated fetch helpers

```ts
import { address, createSolanaRpc } from '@solana/kit';
import { fetchMaybeFleet, SAGE_PROGRAM_ADDRESS } from '@staratlas/dev-sage';

const rpc = createSolanaRpc('https://testnet-rpc.z.ink');

const fleet = await fetchMaybeFleet(rpc, address('FLEET_ADDRESS_HERE'), {
	commitment: 'confirmed'
});

if (!fleet.exists) {
	throw new Error('Fleet account does not exist');
}

console.log({
	program: SAGE_PROGRAM_ADDRESS,
	ownerProfile: fleet.data.ownerProfile,
	faction: fleet.data.faction,
	state: fleet.data.state
});
```

The generated helpers fetch encoded account data and decode it with the generated account decoder. They also preserve an explicit `exists` branch when you use `fetchMaybeX`.

Decoded fields such as `ownerProfile`, `faction`, and `state` are gameplay concepts as much as typed data: they connect identity, allegiance, location, and action availability.

## Program-wide discovery

When you do not have a candidate address yet, use a discriminator-filtered `getProgramAccounts` pass to discover live accounts before switching back to generated fetch helpers.

```ts
const rpcUrl = 'https://testnet-rpc.z.ink';
const sageProgram = 'C4SAgeKLgb3pTLWhVr6NRwWyYFuTR7ZeSXFrzoLwfMzF';

// Base58 of the generated Fleet discriminator bytes:
// [109, 207, 251, 48, 106, 2, 136, 163]
const fleetDiscriminator = 'KNKT54ytpWW';

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
	const response = await fetch(rpcUrl, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			jsonrpc: '2.0',
			id: method,
			method,
			params
		})
	});

	const body = await response.json();

	if (body.error) {
		throw new Error(JSON.stringify(body.error));
	}

	return body.result;
}

const fleets = await rpc<Array<{ pubkey: string }>>('getProgramAccounts', [
	sageProgram,
	{
		encoding: 'base64',
		dataSlice: { offset: 0, length: 0 },
		filters: [
			{
				memcmp: {
					offset: 0,
					bytes: fleetDiscriminator
				}
			}
		]
	}
]);

console.log({
	count: fleets.length,
	firstFleet: fleets[0]?.pubkey
});
```

This broad discovery pattern is useful for live PTR audits and integration tests, but it should not replace typed reads in application code.

Fleet discovery has two additional stable prefix filters:

- `gameId` starts at offset `10`, after the discriminator, version, and bump.
- `ownerProfile` starts at offset `42`, immediately after `gameId`.

Do not copy offsets from later in the fleet account into long-lived queries. The generated account tail is versioned and can move as fields are added. See [Reading Live Game State](/sage-c4-bindings/reading-game-state) for the verified prefix layout, current discriminators, and owner-profile examples.

## PDA-aware fetch helpers

Some accounts include generated seed helpers. Prefer the seed-aware fetch when you already have the domain inputs.

```ts
import { fetchMaybeProfileFactionAccountFromSeeds } from '@staratlas/dev-profile-faction';

const profileFaction = await fetchMaybeProfileFactionAccountFromSeeds(
	rpc,
	{ profile: address('PROFILE_ADDRESS_HERE') },
	{ commitment: 'confirmed' }
);

if (profileFaction.exists) {
	console.log(profileFaction.data.faction);
}
```

## Decoder boundary

Keep generated decoders behind small adapters once application code grows. That gives the rest of the app a clean domain object and keeps RPC validation close to the wire.

::: tip
Prefer boring adapter names over clever abstractions while the generated clients are new. The first useful documentation is usually the code everyone can read under pressure.
:::
