# Scanning Workflow

Scanning is an exploration action. A fleet uses a scan pattern against the current game state, pays the configured scan costs, and may produce loot or state changes tied to fleet position and cooldowns.

Use this as the canonical review pattern for chance/result workflows: read fleet and scan-pattern context, build the instruction, summarize costs and writable accounts, simulate the full transaction, then show cooldown and loot diff targets before asking for a signature.

Scan output is part of the active economy, not just loot user experience.
Survey Data Units (SDUs) and discovered resources can feed recipes and other
ATLAS-earning loops, so scan review should show why a result matters beyond the
immediate transaction.

::: warning Scaffold, not a copy-paste transaction
The snippets below show the verified account and review shape. Your application
must resolve live Fleet, Character, ScanPattern, optional encounter accounts,
and the complete transaction before simulation or sending.
:::

## What Scan Touches

```ts
import { getScanInstruction } from '@staratlas/dev-sage';
```

Instruction data:

| Field | Meaning |
| --- | --- |
| `keyIndex` | Player Profile key index authorizing the action. |

Core accounts:

| Account | Role in the workflow |
| --- | --- |
| `profileValidationSigner` | Wallet/profile signer. |
| `profileValidationProfile` | Player Profile account. |
| `character` | SAGE Character for this profile/game. |
| `fleet` | Fleet performing the scan. |
| `scanPattern` | Scan configuration, costs, cooldown, and loot table. |
| `game` | Root SAGE game account. |
| `instructionsSysvar` | Instructions sysvar, defaulted by the generated client when omitted. |
| `recentSlothashes` | Recent slot hashes sysvar used by the scan flow. |
| `crewBinding` | Optional per-fleet crew binding touched by crew-aware scans. |
| `regionTracker` | Optional region context used when arming encounter state. |
| `encounterCommit` | Optional writable encounter commit stamped when a scan arms an encounter. |
| `encounterPool` | Optional encounter pool context pinned into the commit. |

## 1. Read the state

Read the fleet and scan pattern first:

```ts
import {
	ScanPatternStatus,
	fetchMaybeFleet,
	fetchMaybeScanPattern
} from '@staratlas/dev-sage';

const [fleet, scanPattern] = await Promise.all([
	fetchMaybeFleet(rpc, fleetAddress, { commitment: 'confirmed' }),
	fetchMaybeScanPattern(rpc, scanPatternAddress, {
		commitment: 'confirmed'
	})
]);

if (!fleet.exists) throw new Error('Fleet not found');
if (!scanPattern.exists) throw new Error('Scan pattern not found');
if (ScanPatternStatus[scanPattern.data.status] !== 'Active') {
	throw new Error(
		`Scan pattern is not active: ${ScanPatternStatus[scanPattern.data.status]}`
	);
}

console.log({
	fleetLabel: fleet.data.fleetLabel,
	fleetState: fleet.data.state.__kind,
	pattern: scanPattern.data.name,
	costs: scanPattern.data.cost.length,
	lootEntries: scanPattern.data.lootTable.length
});
```

The UI should also show the fleet position, scan cooldown, cargo requirements, and any risk implied by the current fleet state.

## 2. Build the instruction

```ts
import { address } from '@solana/kit';
import { getScanInstruction } from '@staratlas/dev-sage';

const RECENT_SLOTHASHES_SYSVAR = address(
	'SysvarS1otHashes111111111111111111111111111'
);

const instruction = getScanInstruction({
	profileValidationSigner: walletSigner,
	profileValidationProfile: profileAddress,
	character: characterAddress,
	fleet: fleetAddress,
	scanPattern: scanPatternAddress,
	game: gameAddress,
	recentSlothashes: RECENT_SLOTHASHES_SYSVAR,
	crewBinding: crewBindingAddress,
	regionTracker: regionTrackerAddress,
	encounterCommit: encounterCommitAddress,
	encounterPool: encounterPoolAddress,
	keyIndex: 0
});
```

Leave the optional encounter accounts out for a plain scan. When a scan is also arming encounter state, provide `regionTracker`, `encounterCommit`, and `encounterPool` together so the review screen can show the encounter side effects.

## 3. Review before signing

Show these items before a wallet signs:

- Fleet label, state, and current location.
- Scan pattern name, costs, cooldown, and possible loot entries.
- Player Profile and `keyIndex`.
- Writable accounts: Player Profile, Character, Fleet, optional Crew Binding, and optional Encounter Commit.
- Expected cargo/resource costs.
- Expected cooldown or state change.
- Whether loot, encounter, or reward state is expected to appear or update.

## 4. Simulate the full transaction

Simulation should catch stale fleet state, inactive scan patterns, insufficient scan costs, and sysvar/account-shape mistakes before the wallet prompt.

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
| Fleet | Scan cooldown, state, or cargo/resource state may change. |
| Character | Progression or counters may change. |
| Loot | New or updated loot account may appear depending on result. |
| ScanPattern | Usually config context; should not change during a normal player scan. |

Use [Transaction Review and Account Diffs](/sage-c4-bindings/transaction-review-and-diffs) for the generic simulation and diff pattern.
