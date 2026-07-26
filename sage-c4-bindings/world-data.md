# World Data

World data is the SAGE map and configuration layer: the game account, star systems, celestial bodies, regions, and upload-staging accounts used to change large definitions safely.

This layer gives developers the map context needed by fleets, starbases, mining, local markets, claim stakes, and crafting.

In Star Atlas terms, this is the galaxy context that gameplay happens inside. Fleets move between star systems, starbases live inside systems, celestial bodies host claim-stake and mining context, and regions provide map-scale boundaries.

For C4, regions are not just labels on the map. King Systems, Core Systems,
safe, border, and neutral state, starbase ownership, battle lines, and
faction-controlled warp lanes make `RegionTracker`, `StarSystem`, and
`Starbase` data strategic context for movement and conflict, not just
coordinates. The official
[C4 PTR map guide](https://support.staratlas.com/hc/en-us/articles/52243941755923-How-to-Use-the-C4-PTR-Map)
shows how territory, borders, bases, and warp lanes appear to players.

::: info Position in the account hierarchy
**Owned by:** SAGE program through `@staratlas/dev-sage`<br>
**Root:** `Game` stores global configuration and definition tables<br>
**Map:** `RegionTracker`, `StarSystem`, and `CelestialBody` are separate accounts derived from game-scoped ids<br>
**Nested infrastructure:** `Starbase` is decoded inside `StarSystem.starbase`<br>
**Connects to:** every location-sensitive fleet, mining, claim-stake, crafting, market, territory, and combat workflow
:::

## Developer use

Use this page when you need to:

- resolve game configuration before reading player state
- show map coordinates, star-system connections, regions, bodies, or starbase presence
- derive world-data PDAs from game ids and sequence ids
- understand which world accounts are read-only context versus mutable admin/configuration state

## Technical model

Most player-facing transactions read world data as context. `Game` carries configuration tables; `StarSystem` carries map and nested starbase data; `CelestialBody` anchors planetary/body state; `RegionTracker` provides region metadata. Upload accounts support chunked admin updates and should be treated separately from normal player flows.

## Generated anchors

World-data account, PDA, and instruction helpers live in `@staratlas/dev-sage`.

```ts
import {
	fetchMaybeCelestialBody,
	fetchMaybeGame,
	fetchMaybeRegionTracker,
	fetchMaybeStarSystem,
	findCelestialBodyPda,
	findRegionTrackerPda,
	findStarSystemPda
} from '@staratlas/dev-sage';
```

## Accounts and types

| Generated symbol | Kind | Beginner meaning |
| --- | --- | --- |
| `Game` | account | Global SAGE configuration and definition tables. |
| `StarSystem` | account | A system on the SAGE map, with coordinates, connections, bodies, and optional starbase. |
| `CelestialBody` | account | A planet-like body inside a star system. |
| `RegionTracker` | account | Region definitions and border data for the game map. |
| `RegionBorderUpload` | account | Staging account for chunked region-border updates. |
| `ShipDefinitionUpload` | account | Staging account for chunked ship-definition updates. |
| `Starbase` | nested type | Starbase data nested inside `StarSystem.starbase`. |
| `Region` | type | Region metadata and border vertices. |

## `Game` account

`Game` is the root configuration account for SAGE.

Important fields:

```txt
profile                  Player Profile that manages the game
resources                token resource settings
currencies               currency settings
combat                   combat configuration
crewConfig               crew program config account
shipDefinitions          ship definition table
cargoDefinitions         cargo definition table
claimStakeDefinitions    claim-stake definition table
buildingDefinitions      building definition table
craftingHabDefinitions   crafting hab definition table
habBuildingDefinitions   hab building definition table
xpDefinitions            XP definitions
researchTreeDefinitions  research tree definitions
stimulantDefinitions     combat stimulant definitions
```

For application code, treat `Game` as configuration, not player state.

## `StarSystem` account

Important fields:

```txt
gameId           SAGE game account
systemId         unique system id
name             fixed generated Name value
region           optional region id
coordinates      map coordinates
seqId            sequence id, changed when starbase changes
connections      map of connected systems to ATLAS connection costs
celestialBodies  celestial body account addresses in this system
starbase         optional nested Starbase value
```

`StarSystem.starbase` is where starbase infrastructure appears; `StarbasePlayer` remains a separate per-player account.

## `CelestialBody` account

Important fields:

```txt
id                 celestial body id
name               fixed generated Name value
game               SAGE game account
system             containing StarSystem account
systemSeqId        containing system sequence id
lastSyncTimestamp  last starbase sync timestamp
celestialBodyType  generated body type
```

Claim stakes and mining/scanning flows often need celestial body context, so read this page before the claim-stake and mining pages.

## PDA helpers

| Helper | Seeds | Meaning |
| --- | --- | --- |
| `findStarSystemPda` | `gameId`, `systemId` | Find a star system from the game and system id. |
| `findCelestialBodyPda` | `game`, `id` | Find a celestial body from the game and celestial body id. |
| `findRegionTrackerPda` | `gameId` | Find the region tracker for a game. |
| `findRegionBorderUploadPda` | `gameId`, `regionId` | Find a staged region-border upload account. |
| `findShipDefinitionUploadPda` | `gameId`, `shipId` | Find a staged ship-definition upload account. |

```ts
import {
	findCelestialBodyPda,
	findRegionTrackerPda,
	findStarSystemPda
} from '@staratlas/dev-sage';

const [starSystemAddress] = await findStarSystemPda({
	gameId: gameAddress,
	systemId
});

const [celestialBodyAddress] = await findCelestialBodyPda({
	game: gameAddress,
	id: celestialBodyId
});

const [regionTrackerAddress] = await findRegionTrackerPda({
	gameId: gameAddress
});
```

## Read a star system and celestial body

This example reads map accounts by generated PDA. It does not sign or send a transaction.

```ts
import { createSolanaRpc } from '@solana/kit';
import {
	fetchMaybeCelestialBody,
	fetchMaybeStarSystem,
	findCelestialBodyPda,
	findStarSystemPda
} from '@staratlas/dev-sage';

const rpc = createSolanaRpc('https://testnet-rpc.z.ink');

const [starSystemAddress] = await findStarSystemPda({
	gameId: gameAddress,
	systemId
});

const starSystem = await fetchMaybeStarSystem(rpc, starSystemAddress, {
	commitment: 'confirmed'
});

if (!starSystem.exists) {
	throw new Error(`Star system not found: ${starSystemAddress}`);
}

const [celestialBodyAddress] = await findCelestialBodyPda({
	game: gameAddress,
	id: celestialBodyId
});

const celestialBody = await fetchMaybeCelestialBody(rpc, celestialBodyAddress, {
	commitment: 'confirmed'
});

console.log({
	systemName: starSystem.data.name,
	bodyCount: starSystem.data.celestialBodies.size,
	hasStarbase: starSystem.data.starbase.__option === 'Some',
	celestialBodyExists: celestialBody.exists
});
```

## Instruction families

World-data instruction builders are mostly admin/configuration flows.

| Family | Instructions | What they manage |
| --- | --- | --- |
| Game config | `initGame`, `updateGame` | Create and update the root game configuration. |
| Systems | `createStarSystem`, `updateStarSystem`, `deleteStarSystem` | Create, change, or remove star systems. |
| Celestial bodies | `registerCelestialBody`, `updateCelestialBody`, `updatePlanetTables` | Register bodies and planet-related tables. |
| Regions | `createRegion`, `updateRegion`, `removeRegion`, `createRegionTracker` | Manage region definitions. |
| Region upload | `startChunkedBorderUpload`, `appendRegionBorderUploadChunk`, `commitRegionBorderUpload`, `cancelRegionBorderUpload` | Stage large border updates before commit. |
| Ship definitions | `startShipDefinitionUpload`, `appendShipDefinitionUploadChunk`, `commitShipDefinitionUpload`, `cancelShipDefinitionUpload`, `updateShipDefinition`, `removeShipDefinition` | Stage and update ship definitions. |
| Building definitions | `updateBuildingDefinition`, `updateHabBuildingDefinition` | Update claim-stake and crafting-hab building definitions. |

## Safety notes

Reading world-data accounts is safe. Sending world-data instructions is admin-level work: it can change shared map state, game rules, ship definitions, starbase topology, or production tables.

Do not use send examples for these instructions until the authority model, writable accounts, and PTR simulations are clear.

## Related pages

- [Account Relationship Map](/sage-c4-bindings/account-relationship-map) for
  Game, StarSystem, CelestialBody, RegionTracker, and nested Starbase links
- [Starbases](/sage-c4-bindings/starbases) for shared and player-local
  starbase state
- [Extended C4 Systems](/sage-c4-bindings/extended-systems) for faction
  ownership, King Systems, regions, and territory
