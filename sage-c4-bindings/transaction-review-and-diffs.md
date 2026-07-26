# Transaction Review and Account Diffs

SAGE C4 actions can move cargo, consume resources, create accounts, change fleet state, or alter shared starbase and claim-stake state. A wallet prompt is too late to explain those effects.

Use this page as the review layer between "the generated client can build an instruction" and "a user should sign this transaction".

If signer roles, writable accounts, sentinel accounts, or simulation are new,
see [Programs, Accounts, and Terms](/sage-c4-bindings/concepts-and-terms)
before adapting the examples.

## Review Sequence

For any state-changing SAGE C4 workflow:

1. Read the relevant accounts.
2. Build the instruction without signing.
3. Summarize the program, signers, writable accounts, and instruction data.
4. Simulate the transaction.
5. Show simulation logs and expected state changes.
6. Only then ask a wallet to sign.

The generated clients give you typed account metas and instruction data. They do not decide whether the action is good for the player.

## Summarize an Instruction

Generated instruction builders return an instruction object with a program address, ordered accounts, and encoded data.

```ts
type BuiltInstruction = {
	programAddress: unknown;
	accounts: readonly {
		address: unknown;
		role?: unknown;
	}[];
	data: Uint8Array;
};

export function summarizeInstruction(
	name: string,
	instruction: BuiltInstruction
) {
	return {
		name,
		program: String(instruction.programAddress),
		dataBytes: instruction.data.length,
		accounts: instruction.accounts.map((account, index) => ({
			index,
			address: String(account.address),
			role: String(account.role ?? 'unknown')
		}))
	};
}
```

Render the account list in the same order the instruction uses. Account order
matters to z.ink/Solana programs and is often the first clue when a simulation
fails.

## Classify Review Risk

Most SAGE C4 instruction reviews should call out:

| Review field | Why it matters |
| --- | --- |
| Program | Confirms the instruction targets SAGE, Player Profile, Profile Faction, or another program. |
| Signers | Shows which wallet or generated account key must authorize the instruction. |
| Writable accounts | Shows what may change if the transaction succeeds. |
| `keyIndex` | Identifies the Player Profile key authorizing the action. |
| New accounts | Highlights accounts created by the transaction, such as fleets, crafting processes, and claim-stake instances. |
| Resource effects | Calls out ATLAS, cargo, crew, fuel, ammo, claim rent, production, or cooldown effects. |

## Live PTR review evidence

Recent PTR traces are useful because they show what the generated signatures look like in practice, not just in type definitions.

Observed on May 31, 2026:

- Player actions consistently included Player Profile validation accounts.
- `keyIndex: 0` appeared across sampled player actions.
- Writable accounts were the best first approximation of what a review screen needed to explain.
- Some optional account slots appeared as the SAGE program address sentinel in compiled crafting instruction account lists.
- Fleet creation was sometimes bundled with immediate ship-assignment instructions instead of appearing as a standalone action.

Sample review-relevant traces:

| Instruction pattern | What the trace added |
| --- | --- |
| `transferCargoWithinFleet` | A narrow pod-to-pod move wrote the profile signer, profile, and fleet, and stayed under 8,000 compute units in the sampled trace. |
| `transferCargoToFleet` | Cargo transfer also wrote `Character` and `StarbasePlayer`, which makes it a broader review target than a simple fleet-only diff. |
| `idleToDocked` vs `dockedToIdle` | Docking wrote `StarbasePlayer` in the sampled trace; undocking did not. |
| `startCraftingProcess` | The new crafting-process account was both signer and writable, and absent optional accounts appeared as a sentinel value. |
| `createFleet` bundle | A sampled fleet-creation transaction also included `addShipToFleet`, so the user-visible action was larger than the builder name alone. |

Treat these as review heuristics, not permanent fixtures. PTR behavior changes, but the exercise of naming signers, writable accounts, optional slots, and likely domain diffs remains stable.

## Read Before and After

For local tools and PTR testing, capture account snapshots before and after a transaction. The same helper can also capture the "before" side for simulation review.

```ts
import { createSolanaRpc, type Address } from '@solana/kit';

const rpc = createSolanaRpc('https://testnet-rpc.z.ink');

type AccountSnapshot = {
	address: string;
	exists: boolean;
	owner?: string;
	lamports?: bigint;
	space?: bigint;
	dataBase64?: string;
};

export async function readSnapshots(addresses: Address[]) {
	const response = await rpc
		.getMultipleAccounts(addresses, {
			commitment: 'confirmed',
			encoding: 'base64'
		})
		.send();

	return addresses.map((accountAddress, index): AccountSnapshot => {
		const account = response.value[index];

		if (!account) {
			return {
				address: String(accountAddress),
				exists: false
			};
		}

		return {
			address: String(accountAddress),
			exists: true,
			owner: account.owner,
			lamports: account.lamports,
			space: account.space,
			dataBase64: account.data[0]
		};
	});
}
```

Keep raw snapshots out of UI prompts. Decode only the accounts the application
needs, and display a small domain diff instead of dumping base64 data.

## Produce a Domain Diff

A domain diff is more useful than a raw account dump.

```ts
type FleetSummary = {
	label: string;
	state: string;
	ships: number | bigint;
	cargoPod: string;
};

export function diffFleet(before: FleetSummary, after: FleetSummary) {
	return {
		labelChanged: before.label !== after.label,
		state: `${before.state} -> ${after.state}`,
		ships: `${before.ships} -> ${after.ships}`,
		cargoPodChanged: before.cargoPod !== after.cargoPod
	};
}
```

Use this pattern per workflow:

- Fleet creation: new fleet account exists, character/starbase-player counters changed.
- Crafting: new crafting process exists, recipe and starbase-player context still match, input cargo changed.
- Scanning: fleet cooldown/state changed, loot account may appear, scan pattern unchanged.
- Claim stake placement: new claim-stake instance exists, celestial body and starbase-player state changed, rent was deposited.

## Simulation Result Shape

Simulation runs against a full transaction, not an instruction by itself. The exact signing path depends on the wallet or test signer setup, but the RPC review shape is stable:

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

Some RPCs still require a structurally valid signed transaction even when
`sigVerify` is false. Treat simulation as the final pre-wallet check rather
than a substitute for understanding the instruction.

## Failure Notes

Common simulation failure categories:

| Failure area | What to inspect |
| --- | --- |
| Missing signature | Fee payer, generated account signer, or wallet signer is absent. |
| Account not found | A PDA was derived for the wrong game/profile/system, or a placeholder was never replaced. |
| Invalid account data | The address exists but is not the expected SAGE account type. |
| Permission failure | `keyIndex` does not point to a profile key with the required permission. |
| Stale state | Fleet, starbase, crafting, scan, or claim-stake state changed since the UI read it. |
| Insufficient resources | Cargo, crew, ATLAS, rent, fuel, or cooldown requirements are not satisfied. |

Apply the pattern in the
[Fleet Creation](/sage-c4-bindings/fleet-creation-workflow),
[Crafting Process](/sage-c4-bindings/crafting-process-workflow),
[Scanning](/sage-c4-bindings/scanning-workflow), and
[Claim Stake Placement](/sage-c4-bindings/claim-stake-placement-workflow)
workflows.
