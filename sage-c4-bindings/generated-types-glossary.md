# Generated Types Glossary

The generated clients are strongly typed, but several recurring types need careful handling in app code.

This page covers practical patterns that appear across Player Profile, Profile Faction, and SAGE.

## `Address`

Use `address()` from `@solana/kit` when turning a string into an address value.

```ts
import { address } from '@solana/kit';

const profileAddress = address('PROFILE_ADDRESS_HERE');
```

Keep address parsing near the edge of the app. Once a value is an `Address`, pass it through typed functions rather than re-parsing strings repeatedly.

## `Name`

Several generated accounts use fixed-size name fields:

- `PlayerName.name`
- `Fleet.fleetLabel`
- `Recipe.name`
- `StarSystem.name`
- `ScanPattern.name`

Generated name values may contain zero padding. Trim trailing null bytes after decoding.

```ts
export function decodeGeneratedName(name: Uint8Array | number[]): string {
	const bytes = name instanceof Uint8Array ? name : new Uint8Array(name);
	return new TextDecoder()
		.decode(bytes)
		.replace(/\0+$/u, '');
}
```

Use this at the UI boundary. Keep raw generated values available when building PDA seeds or comparing exact account data.

## `Option`

Generated optional values use a discriminated shape rather than JavaScript `null`.

Example: `StarSystem.starbase`.

```ts
const starbaseOption = starSystem.data.starbase;

if (starbaseOption.__option === 'Some') {
	const starbase = starbaseOption.value;
	console.log(starbase.level);
} else {
	console.log('No starbase in this system');
}
```

Do not assume optional generated values are plain `undefined`. Check the generated option shape.

## `Map`

Many accounts use generated `Map` values:

- `CargoDefinitionsCache.cargoTypeCache`
- `LocalMarket.bids.makers`
- `ClaimStakeInstance.buildings`
- `Recipe.inputs`
- `Recipe.outputs`

Convert maps explicitly before rendering or serializing.

```ts
const inputs = [...recipe.data.inputs.entries()].map(([cargoId, quantity]) => ({
	cargoId,
	quantity
}));
```

## `Set`

Generated sets appear in account fields such as:

- `StarSystem.celestialBodies`
- `CraftingHabInstance.recipesUnlocked`
- `Recipe.researchRequirements`

Convert sets explicitly when building UI models.

```ts
const celestialBodies = [...starSystem.data.celestialBodies];
```

## `bigint`

Generated numeric values often use `bigint`:

- timestamps
- sequence ids
- quantities
- ATLAS/Floyd values
- cargo amounts
- HP/SP/AP values in some accounts

JSON does not serialize `bigint` by default. Convert deliberately.

```ts
export function jsonSafe(value: unknown): string {
	return JSON.stringify(
		value,
		(_key, nestedValue) =>
			typeof nestedValue === 'bigint'
				? nestedValue.toString()
				: nestedValue,
		2
	);
}
```

Do not silently cast large values to `number` unless the domain guarantees they fit safely.

## Fixed-point wrappers

Some generated values represent fixed-point numbers, such as:

- `I8F56`
- `U16F16`

These are domain values, not normal JavaScript floats. Keep them as generated values until the docs have a verified conversion helper for the exact type.

For UI display, prefer a tiny adapter with a name that includes the source type.

```ts
export function displayU16F16(value: unknown): string {
	return String(value);
}
```

That is intentionally boring. It prevents accidental precision loss while the C4 fixed-point conventions are still being verified.

## Generated enums

Generated enums are numeric at runtime but readable through reverse lookup.

```ts
import { Faction } from '@staratlas/dev-profile-faction';
import { RecipeStatus } from '@staratlas/dev-sage';

console.log(Faction[profileFaction.data.faction]);
console.log(RecipeStatus[recipe.data.status]);
```

For discriminated unions, use the `__kind` field.

```ts
console.log(fleet.data.state.__kind);
console.log(claimStake.data.state.__kind);
```

## Account wrappers

Generated fetch helpers return account wrappers, not just account data.

```ts
const maybeFleet = await fetchMaybeFleet(rpc, fleetAddress);

if (maybeFleet.exists) {
	console.log(maybeFleet.address);
	console.log(maybeFleet.data);
}
```

Use `fetchMaybe...` while exploring. Switch to throwing `fetch...` helpers only when absence is genuinely exceptional.

## App adapter pattern

Keep generated data near the RPC boundary and map it into small app-facing objects.

```ts
export type FleetSummary = {
	address: string;
	label: string;
	state: string;
	shipCount: string;
};

export function toFleetSummary(fleet: {
	address: string;
	data: {
		fleetLabel: Uint8Array | number[];
		state: { __kind: string };
		shipCounts: { total: bigint };
	};
}): FleetSummary {
	return {
		address: fleet.address,
		label: decodeGeneratedName(fleet.data.fleetLabel),
		state: fleet.data.state.__kind,
		shipCount: fleet.data.shipCounts.total.toString()
	};
}
```

This keeps UI code readable and makes it obvious where generated account data becomes application data.

## Related terminology

This glossary covers generated TypeScript value shapes. For program, account,
PDA, discriminator, discovery, signer, writable-account, sysvar, sentinel, and
simulation concepts, see
[Programs, Accounts, and Terms](/sage-c4-bindings/concepts-and-terms).

For the way generated account addresses connect, see the
[Account Relationship Map](/sage-c4-bindings/account-relationship-map).
