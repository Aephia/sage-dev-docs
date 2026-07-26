# Claim Stake Placement Workflow

Claim-stake placement adds player infrastructure to a celestial body. It touches land-style production state, faction/profile authority, local starbase context, and rent.

Use this as the canonical review pattern for infrastructure-placement workflows: read world and local player context, build the generated account instruction, summarize rent and writable accounts, simulate, then show account-creation and domain diff targets.

In the C4 economy, claim stakes are production infrastructure on celestial bodies. They produce resources into limited local storage, and fleets must interact with individual stakes when transferring resources out, so placement review should include the body, production intent, storage expectation, and local fleet/starbase path.

::: warning Scaffold, not a copy-paste transaction
The snippets below show the verified account and review shape. Your application
must resolve the selected definition, hub building, world/player accounts,
signers, and full transaction before simulation or sending.
:::

## What Placement Touches

```ts
import { getPlaceClaimStakeInstanceWithHubInstructionAsync } from '@staratlas/dev-sage';
```

Instruction data:

| Field | Meaning |
| --- | --- |
| `keyIndex` | Player Profile key index authorizing the action. |
| `claimStakeDefinitionId` | Claim-stake definition to place. |
| `hubBuildingId` | Planet- and family-matched hub building bundled with the stake. |
| `initialRentAmount` | Optional initial rent deposit. |

Core accounts:

| Account | Role in the workflow |
| --- | --- |
| `game` | Root SAGE game account. |
| `profileValidationSigner` | Wallet/profile signer. |
| `profileValidationProfile` | Player Profile account. |
| `profileFaction` | Profile Faction account. |
| `claimStakeInstance` | New generated account signer for the placed instance. |
| `systemAndStarbasePlayerSystem` | Star system context. |
| `systemAndStarbasePlayerStarbasePlayer` | Player state at the starbase. |
| `celestialBody` | Celestial body receiving the claim stake. |
| `character` | SAGE Character for this profile/game. |
| `currencyCache` | Currency configuration cache. |
| `systemProgram` | Solana System Program for account creation. |

## 1. Read the state

Read the celestial body, starbase player, and currency cache before building:

```ts
import {
	fetchMaybeCelestialBody,
	fetchMaybeCurrencyConfigCache,
	fetchMaybeStarbasePlayer
} from '@staratlas/dev-sage';

const [celestialBody, starbasePlayer, currencyCache] = await Promise.all([
	fetchMaybeCelestialBody(rpc, celestialBodyAddress, {
		commitment: 'confirmed'
	}),
	fetchMaybeStarbasePlayer(rpc, starbasePlayerAddress, {
		commitment: 'confirmed'
	}),
	fetchMaybeCurrencyConfigCache(rpc, currencyCacheAddress, {
		commitment: 'confirmed'
	})
]);

if (!celestialBody.exists) throw new Error('Celestial body not found');
if (!starbasePlayer.exists) throw new Error('Starbase player not found');
if (!currencyCache.exists) throw new Error('Currency cache not found');

console.log({
	body: celestialBody.data.name,
	bodyType: celestialBody.data.celestialBodyType,
	currencyCache: currencyCache.address
});
```

The UI should also show the claim-stake definition, player location, rent deposit, and any cargo or resource requirements.

## 2. Build the instruction

```ts
import { generateKeyPairSigner } from '@solana/kit';
import { getPlaceClaimStakeInstanceWithHubInstructionAsync } from '@staratlas/dev-sage';

const claimStakeInstance = await generateKeyPairSigner();

const instruction = await getPlaceClaimStakeInstanceWithHubInstructionAsync({
	game: gameAddress,
	profileValidationSigner: walletSigner,
	profileValidationProfile: profileAddress,
	profileFaction: profileFactionAddress,
	claimStakeInstance,
	systemAndStarbasePlayerSystem: systemAddress,
	systemAndStarbasePlayerStarbasePlayer: starbasePlayerAddress,
	celestialBody: celestialBodyAddress,
	character: characterAddress,
	currencyCache: currencyCacheAddress,
	claimStakeDefinitionId: 1,
	hubBuildingId: 4,
	initialRentAmount: 1_000_000n,
	keyIndex: 0
});
```

Use `initialRentAmount: null` when the flow intentionally starts without an initial rent deposit.

## 3. Review before signing

Show these items before a wallet signs:

- Celestial body name and system.
- Claim-stake definition id.
- Hub building id.
- New claim-stake instance address.
- Player Profile and `keyIndex`.
- Profile Faction value.
- Starbase player context.
- Initial rent amount.
- Expected account creation, rent, cargo, and production effects.

## 4. Simulate the full transaction

Simulation should catch an invalid claim-stake definition id, missing generated-account signature, insufficient rent/currency context, stale celestial-body state, and profile/faction mismatches before signing.

```ts
const simulation = await rpc
	.simulateTransaction(encodedTransactionBase64, {
		commitment: 'confirmed',
		encoding: 'base64',
		replaceRecentBlockhash: true,
		sigVerify: false
	})
	.send();

console.log({
	err: simulation.value.err,
	unitsConsumed: simulation.value.unitsConsumed,
	logs: simulation.value.logs
});
```

## 5. Diff targets

| Account | Expected change |
| --- | --- |
| ClaimStakeInstance | New account should exist and decode as `ClaimStakeInstance`. |
| CelestialBody | Claim-stake placement or capacity state may change. |
| StarbasePlayer | Local player state, cargo, or rent-related state may change. |
| Character | Progression or counters may change. |
| CurrencyConfigCache | Usually config context; include it in review because rent uses currency config. |

Use [Transaction Review and Account Diffs](/sage-c4-bindings/transaction-review-and-diffs) for the generic simulation and diff pattern.
