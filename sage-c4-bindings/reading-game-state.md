# Reading Live Game State

Use this page when you need real C4 accounts rather than placeholder addresses.

It covers read-only discovery on the public C4 PTR deployment: identifying the network, selecting the correct program, filtering account types, and decoding live fleets with `@staratlas/dev-sage`.

This page is the first complete discovery example after
[`@solana/kit` Client](/sage-c4-bindings/kit-client). For background on
discriminators, `memcmp` filters, PDAs, and discovery, see
[Programs, Accounts, and Terms](/sage-c4-bindings/concepts-and-terms).

::: warning Deployment scope
These addresses and layouts describe the C4 public PTR deployment. Other SAGE deployments on the same z.ink chain use different program addresses and can use different account versions. Always make the target program address explicit.
:::

## Network and deployment identity

The C4 PTR runs on a dedicated Solana-compatible SVM chain, not Solana mainnet.

| Item | Value |
| --- | --- |
| HTTP RPC | `https://testnet-rpc.z.ink` |
| HTTP RPC alias | `https://rpc1.z.ink` |
| Genesis hash | `6qaAozzun2WV83PRDgqf79WXtbqfnezKB3demjxXV5EY` |
| Read commitment | `confirmed` |
| Low-latency read commitment | `processed` |

Both HTTP endpoints returned the same genesis hash during the 2026-07-25 verification pass.

```bash
curl -sS -X POST https://rpc1.z.ink \
	-H 'content-type: application/json' \
	-d '{"jsonrpc":"2.0","id":1,"method":"getGenesisHash","params":[]}'
```

Checking the genesis hash prevents a healthy but incorrect RPC endpoint from being mistaken for C4.

## C4 addresses

| Account or program | Address |
| --- | --- |
| SAGE program | `C4SAgeKLgb3pTLWhVr6NRwWyYFuTR7ZeSXFrzoLwfMzF` |
| Player Profile program | `C4PRoFNroxxzdgeCoM31LJjYRg7kT6ymogSTAT99iD1u` |
| Profile Faction program | `C4FACQA1PpNRKrjQ2862ABNR42DTz7EzGj1uhTNFASwP` |
| Game account | `EKEj47SzaCjPM3m4T4vRXrrsVtkEmiNgPMMFye3AkXj4` |
| Faction Relation Tracker | `E6X4yidKzV3NW559hrpJDwEmNiRpreXeYjzpZvG7J4n3` |

The game account is owned by the C4 SAGE program and is roughly 2.5 MB. It holds game-wide configuration and definition tables. Star systems and celestial bodies remain separate program-owned accounts; starbase data is nested in `StarSystem`.

Do not use public-mainnet SAGE program addresses against this RPC. `getProgramAccounts` only returns accounts owned by the program address you query.

## Account discriminators

SAGE account data begins with an eight-byte discriminator. The generated package exports a `get<Name>DiscriminatorBytes()` helper for each account type.

| Account | Hex discriminator | Base58 filter |
| --- | --- | --- |
| `Fleet` | `6dcffb306a0288a3` | `KNKT54ytpWW` |
| `Game` | `1b5aa67d4a647912` | `5aNQXizG8jB` |
| `StarbasePlayer` | `c0ea905648130563` | `ZGXhzS6juQW` |
| `CelestialBody` | `b9251d7a0ed88e6d` | `Xy922tyvVh6` |
| `Character` | `8c73a524f1996654` | `QVZMSrEA6j5` |
| `StarSystem` | `cf207b0909fbdda9` | `bePdXVNeenk` |
| `RegionTracker` | `171d1bdf479800e1` | `4sET8pW57x4` |
| `FactionConfig` | `340cfea68f357c37` | `9hxYJKNnXp2` |
| `FactionOwnership` | `50c73351876463e3` | `EWeeHyLbPDL` |
| `LoyaltyContribution` | `80c61e873a4394a2` | `NYGZ8NuB5e1` |
| `CargoDefinitionsCache` | `f8f77509cb1e1f92` | `ieHiRVzMnM7` |
| `CurrencyConfigCache` | `e7cb8e6cd2ea07bf` | `fmhngiKjzmt` |

The values above were checked against the generated `0.52.0` exports. Compute filter text in application code instead of hard-coding it:

```ts
import { getBase58Decoder } from '@solana/kit';
import { getFleetDiscriminatorBytes } from '@staratlas/dev-sage';

const fleetDiscriminator = getBase58Decoder().decode(
	getFleetDiscriminatorBytes()
);
```

The Anchor-style derivation is `sha256("account:<AccountName>")[0:8]`, but the generated helper should remain the application source of truth.

## Fleet filter prefix

The beginning of the `Fleet` account has a fixed, useful discovery prefix:

| Offset | Size | Field |
| ---: | ---: | --- |
| `0` | 8 | account discriminator |
| `8` | 1 | account version |
| `9` | 1 | PDA bump |
| `10` | 32 | `gameId` |
| `42` | 32 | `ownerProfile` |
| `74` | 32 | `subProfile` |
| `106` | 32 | `subProfileInvalidator` |

Use only offsets `0`, `10`, and `42` as durable `memcmp` filters. Fields after the identity prefix are decoded values, not a stable query API. The current `0.52.0` layout places `faction`, `npcFactionId`, and `fleetLabel` after this prefix, but future account versions can move later fields.

Do not filter fleets by `dataSize`. C4 fleet accounts are extensible and live account sizes vary.

## Discover fleets for one game

This read returns account addresses only, keeping the RPC response small:

```ts
const rpcUrl = 'https://rpc1.z.ink';
const sageProgram = 'C4SAgeKLgb3pTLWhVr6NRwWyYFuTR7ZeSXFrzoLwfMzF';
const game = 'EKEj47SzaCjPM3m4T4vRXrrsVtkEmiNgPMMFye3AkXj4';

const response = await fetch(rpcUrl, {
	method: 'POST',
	headers: { 'content-type': 'application/json' },
	body: JSON.stringify({
		jsonrpc: '2.0',
		id: 'fleets',
		method: 'getProgramAccounts',
		params: [
			sageProgram,
			{
				encoding: 'base64',
				commitment: 'confirmed',
				dataSlice: { offset: 0, length: 0 },
				filters: [
					{ memcmp: { offset: 0, bytes: 'KNKT54ytpWW' } },
					{ memcmp: { offset: 10, bytes: game } }
				]
			}
		]
	})
});

const payload = await response.json();

if (payload.error) {
	throw new Error(JSON.stringify(payload.error));
}

console.log(payload.result.map((account: { pubkey: string }) => account.pubkey));
```

## Stable NPC profiles

The Nemesis Engine continuously operates Jorvik and Relic Baron fleets on C4. Their profile addresses are stable enough to serve as live decoder fixtures:

| NPC faction | Owner profile | Minor faction id |
| --- | --- | ---: |
| Jorvik | `B8PCrai4bqyoR5VAcjFnLixQXejVNReNw6JunbeEACLj` | `4` |
| Relic Barons | `DNJu1dC8sZFWDNtA2dhH2CPYaNzn556jRdqEmZbzWiq9` | `5` |

Filter `ownerProfile` at offset `42`:

```ts
const jorvikProfile = 'B8PCrai4bqyoR5VAcjFnLixQXejVNReNw6JunbeEACLj';

const filters = [
	{ memcmp: { offset: 0, bytes: 'KNKT54ytpWW' } },
	{ memcmp: { offset: 42, bytes: jorvikProfile } }
];
```

::: warning NPC fleet churn
Bookmark the profiles, not individual fleet accounts. Nemesis closes and recreates fleets continuously. A verification snapshot on 2026-07-25 found 2,808 fleets for the C4 game, including 1,403 Jorvik and 379 Relic Baron fleets; these counts are evidence of the query working, not durable game constants.
:::

The registry's minor faction ids are separate from `Fleet.faction`, whose generated enum remains Unaligned, MUD, ONI, and Ustur. The live NPC fleets sampled during verification decoded as `faction: 0` and `npcFactionId: 0`; do not infer the Jorvik or Relic identity from either field alone. Use the known owner profile or the relevant faction-registry state.

## Decode live fleet accounts

The discovery query above deliberately omits account data. Fetch a selected address, then use the generated decoder for the complete account:

```ts
import { getFleetDecoder } from '@staratlas/dev-sage';

function decodeBase64(value: string): Uint8Array {
	return Uint8Array.from(Buffer.from(value, 'base64'));
}

const fleetAddress = payload.result[0]?.pubkey;

if (!fleetAddress) {
	throw new Error('No fleet accounts matched the filters');
}

const accountResponse = await fetch(rpcUrl, {
	method: 'POST',
	headers: { 'content-type': 'application/json' },
	body: JSON.stringify({
		jsonrpc: '2.0',
		id: 'fleet',
		method: 'getAccountInfo',
		params: [fleetAddress, { encoding: 'base64', commitment: 'confirmed' }]
	})
});

const accountPayload = await accountResponse.json();
const encoded = accountPayload.result?.value?.data?.[0];

if (!encoded) {
	throw new Error(`Fleet not found: ${fleetAddress}`);
}

const decoder = getFleetDecoder();
const fleet = decoder.decode(decodeBase64(encoded));
const [x, y] = fleet.location.map((coordinate) => coordinate.toNumber());

console.log({
	address: fleetAddress,
	label: fleet.fleetLabel,
	ownerProfile: fleet.ownerProfile,
	location: [x, y],
	state: fleet.state.__kind,
	hp: fleet.hp,
	sp: fleet.sp,
	ap: fleet.ap
});
```

This Node example uses `Buffer`. Browser code should decode base64 with a browser-safe helper.

### Fixed-point values

Fleet coordinates use signed `I8F56` fixed-point values. The generated client returns a `FixedPoint` object with `raw`, `fractionalBits`, and `.toNumber()`.

Call `.toNumber()` before arithmetic. String coercion and JSON output can make a fixed-point object look like a plain number even though it is not one.

### State payloads

`Fleet.state` is a generated discriminated union:

```ts
const kind = fleet.state.__kind;
const state = fleet.state.fields[0];
```

Important movement shapes:

- `MoveWarp`: `state.to`, `state.warpStart`, and `state.warpFinish`; the top-level `fleet.location` is the departure point.
- `MoveSubwarp`: `state.journey.from`, `state.journey.to`, `state.journey.departureTime`, and `state.journey.duration`.

Timestamp interpolation can produce a useful display position, but it is not authoritative for subwarp. The game can settle progress incrementally and constrain it by remaining fuel.

## Derive a fleet PDA

Fleet PDA seeds are:

1. the UTF-8 bytes for `Fleet`
2. the game address
3. the owner-profile address
4. the first 32 bytes of the zero-padded 64-byte fleet label
5. the second 32 bytes of that label

The generated helper accepts the four domain seeds after the fixed `Fleet` prefix:

```ts
import { address } from '@solana/kit';
import { findFleetPda } from '@staratlas/dev-sage';

function splitFleetLabel(label: string): [number[], number[]] {
	const encoded = new TextEncoder().encode(label);

	if (encoded.length > 64) {
		throw new Error('Fleet labels are at most 64 UTF-8 bytes');
	}

	const padded = new Uint8Array(64);
	padded.set(encoded);

	return [Array.from(padded.slice(0, 32)), Array.from(padded.slice(32))];
}

const [fleetLabelPart1, fleetLabelPart2] = splitFleetLabel('JOR:example');

const [fleetAddress, bump] = await findFleetPda({
	gameId: address('EKEj47SzaCjPM3m4T4vRXrrsVtkEmiNgPMMFye3AkXj4'),
	ownerProfile: address('B8PCrai4bqyoR5VAcjFnLixQXejVNReNw6JunbeEACLj'),
	fleetLabelPart1,
	fleetLabelPart2
});

console.log({ fleetAddress, bump });
```

Because Nemesis labels and accounts churn, derive a PDA when you know the current label; otherwise discover current fleet accounts from the stable profile.

## Verification boundaries

Verified on 2026-07-25:

- npm still reported `@staratlas/dev-sage@0.52.0` as latest
- the discriminator table matched the generated package exports
- both documented RPC hostnames returned the same z.ink genesis hash
- the C4 game account was owned by the documented C4 SAGE program
- the game and owner-profile filters returned live fleet accounts
- a current Jorvik fleet decoded successfully with `getFleetDecoder()`

Counts, fleet addresses, labels, positions, states, RPC software versions, and account sizes remain point-in-time observations. Re-query them when your application needs current state.

The [Accounts](/sage-c4-bindings/accounts) page generalizes this discovery and
decoder pattern. The [Fleets](/sage-c4-bindings/fleets) page explains the
gameplay meaning of the decoded fields and instruction families.
