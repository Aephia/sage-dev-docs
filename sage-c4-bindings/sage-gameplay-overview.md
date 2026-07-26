# SAGE Gameplay Overview

SAGE C4 is a major expansion and update of the Star Atlas strategy game.

For beginners: SAGE C4 is where the game world lives on-chain. The other foundation programs explain who the player is and which faction they belong to.

## Strategic Game Layer

SAGE C4 is built around fleets, faction conflict, starbases, navigation, resources, crafting, progression, and territorial economics. In practical developer terms, it is the game layer that turns a Player Profile and Profile Faction into visible player actions.

The classic SAGE loop moves players away from passive emissions and toward player-driven activity: gather resources, burn inputs, craft outputs, move goods, defend infrastructure, and make choices that affect faction and local economy state. C4 expands that loop on the z.ink testnet; the generated clients let developers inspect the accounts and instructions behind the browser game.

The newer generated areas belong to the same strategic loop: loyalty and ATLAS
rewards are tied to active faction-supporting play, crew is a real gameplay
access and utility layer, and C4 territory is organized around regions, King
Systems, Core Systems, safe and border state, and faction-controlled warp
lanes.

## Program role

`@staratlas/dev-sage` manages the main game state:

- game and world configuration
- star systems, regions, celestial bodies, and starbases
- player fleets and fleet state
- movement through subwarp, warp lanes, and coordinates
- cargo pods, resource movement, and inventory-like flows
- mining, scanning, and loot
- crafting recipes, habs, and crafting processes
- claim-stake instances and planetary production loops
- local markets
- faction ownership/economics, missions, quests, encounter pools, loyalty rewards, crew rosters, outlaw flags, territory yield, starbase upgrades, combat, repair, respawn, research, and daily check-ins

## Game Concept to Program Surface

| Game concept | C4 program surface |
| --- | --- |
| Player identity and authority | `@staratlas/dev-player-profile`, `Profile`, `PlayerName`, profile keys, roles, permission bytes |
| Faction alignment | `@staratlas/dev-profile-faction`, `ProfileFactionAccount`, `Faction` |
| Galia map and systems | `Game`, `StarSystem`, `RegionTracker`, `CelestialBody` |
| Fleets and movement | `Fleet`, `FleetState`, `startSubwarp`, `stopSubwarp`, `warpLane`, `warpToCoordinate` |
| Starbases and faction infrastructure | nested `Starbase`, `StarbasePlayer`, `StarbaseUpgradeProcess` |
| Resources and localized inventory | `CargoPod`, `CargoDefinitionsCache`, fleet cargo pods, starbase-player cargo, local-market cargo |
| Crafting and habs | `Recipe`, `CraftingHabInstance`, `CraftingProcess` |
| Claim stakes and land operations | `ClaimStakeInstance`, claim-stake placement, rent, buildings, production, fleet transfer |
| Local markets and trade | `LocalMarket`, `OrderBookSide`, `OrderInfo`, bid/ask builders |
| Scanning and loot | `ScanPattern`, `ScanPatternNoiseMapUpload`, `Loot`, `scan`, `retrieveLoot` |
| Combat, repair, and respawn | `attackFleet`, `attackStarbase`, repair builders, respawn completion builders, reward registry/config/epoch/contribution accounts |
| Encounters and rewards | `EncounterPool`, `EncounterCommit`, `AtlasRewardConfig`, `LoyaltyEpoch`, `resolveCombatRewards`, `claimLoyaltyAtlas` |
| Faction economics and territory | `FactionAccount`, `FactionStanding`, `FactionMarket`, `FactionOwnership`, `claimTerritoryYield`, faction-market trade builders |
| Missions and quests | `MissionProcess`, `QuestProcess`, mission start/settle/abort builders, quest start/complete/cancel builders |
| Council rank, XP, research, check-ins | `Character`, `XpInfo`, `ResearchTreeDefinitions`, `dailyCheckIn`, research unlock/config builders |

## Foundation dependencies

SAGE gameplay accounts do not replace the foundation programs:

| Layer | Program | What it manages |
| --- | --- | --- |
| Identity | Player Profile | Profile authority, keys, names, roles, and permissions |
| Faction | Profile Faction | Faction selected by a profile |
| Gameplay | SAGE | Fleets, world state, economy loops, progression, and combat |

When a SAGE page mentions a player, profile, or faction, link back to the foundation pages instead of redefining those concepts.

## Gameplay Domains

These domains connect game concepts to generated accounts:

### Fleets

Fleet accounts are a good first SAGE domain because they visibly connect profile identity, faction, ships, cargo, fuel, movement, and combat state.

Generated anchors:

- account: `Fleet`
- PDA helper: `findFleetPda`
- examples: `fetchMaybeFleet`, `fetchAllMaybeFleet`

Workflow: [Fleet Creation Workflow](/sage-c4-bindings/fleet-creation-workflow)

### Starbases

Starbases are important places for storage, crafting, movement, repairs, upgrades, and faction conflict.

Generated anchors:

- account: `StarbasePlayer`
- account: `StarbaseUpgradeProcess`
- instructions around starbase attack, repair, upgrade, and player registration

### Crafting

Crafting connects resources, recipes, habs, crew-like constraints, and production timers.

Generated anchors:

- account: `Recipe`
- account: `CraftingHabInstance`
- account: `CraftingProcess`
- instructions around starting, stopping, closing, and managing crafting processes

Page: [Crafting](/sage-c4-bindings/crafting)

Workflow: [Crafting Process Workflow](/sage-c4-bindings/crafting-process-workflow)

### Claim stakes

Claim stakes are the land and planetary-production layer.

Generated anchors:

- account: `ClaimStakeInstance`
- instructions around stake creation, updates, rent, resource extraction, and fleet transfer

Page: [Claim Stakes](/sage-c4-bindings/claim-stakes)

Workflow: [Claim Stake Placement Workflow](/sage-c4-bindings/claim-stake-placement-workflow)

### Local markets

Local markets connect starbase location, cargo types, ATLAS-denominated order books, and player escrow.

Generated anchors:

- account: `LocalMarket`
- PDA helper: `findLocalMarketPda`
- instructions around market creation, close, order placement, cancellation, and cleanup

Page: [Local Markets](/sage-c4-bindings/local-markets)

### World data

World data covers game configuration, star systems, celestial bodies, regions, and staging accounts for large definition updates.

Generated anchors:

- account: `Game`
- account: `StarSystem`
- account: `CelestialBody`
- account: `RegionTracker`
- upload accounts: `RegionBorderUpload`, `ShipDefinitionUpload`

Page: [World Data](/sage-c4-bindings/world-data)

### Mining, scanning, and loot

Mining and scanning connect fleet activity, scan patterns, loot tables, coordinates, and generated loot accounts.

Generated anchors:

- account: `ScanPattern`
- account: `ScanPatternNoiseMapUpload`
- account: `Loot`
- instructions around mining, scanning, retrieving loot, and scan-pattern admin

Page: [Mining, Scanning, and Loot](/sage-c4-bindings/mining-scanning-loot)

Workflow: [Scanning Workflow](/sage-c4-bindings/scanning-workflow)

### Cargo and currency

Cargo and currency are shared accounting surfaces used by fleets, starbases, markets, crafting, claim stakes, and admin vault flows.

Generated anchors:

- account: `CargoDefinitionsCache`
- account: `CurrencyConfigCache`
- types: `CargoPod`, `SingleCargo`, `CargoType`, `Resources`, `Currencies`

Page: [Cargo and Currency](/sage-c4-bindings/cargo-and-currency)

### Character and progression

Character and progression covers SAGE-specific player state: check-ins, XP, research, rentals, crew, and modifiers.

Generated anchors:

- account: `Character`
- PDA helper: `findCharacterPda`
- instructions around registration, daily check-in, XP, research, crew, and rentals

Page: [Character and Progression](/sage-c4-bindings/character-progression)

### Extended systems

Crew rosters, faction territory, encounters, combat rewards, loyalty,
missions, quests, and research extend the same Profile → Character → Game
hierarchy. They are grouped separately because several flows still need live
PTR verification before they can support complete send examples.

Page: [Extended C4 Systems](/sage-c4-bindings/extended-systems)

## Page Pattern

For every gameplay domain page:

1. Start with the relevant game concept.
2. List the generated accounts and instructions.
3. Show one read-only account example.
4. Only then add state-changing examples with signer, account, and simulation notes.
