# C4 SAGE — Reading Game State

> **For community developers.** This guide gives you everything needed to query on-chain game state for the Star Atlas C4 (SAGE F2P) program — addresses, RPC endpoints, account discriminators, field layouts, and working code examples using live Nemesis Engine fleets (Jorvik & Relic Baron) as reference.
>
> **Scope:** this guide covers the **C4 deployment** — the public PTR (Public Test Realm) — only. The HYE private dev server and the crew-dev deployment are documented separately in [`sage-hye-dev-server.md`](sage-hye-dev-server.md) and [`sage-crew-dev-deployment.md`](sage-crew-dev-deployment.md).

---

## 1. Connection Details

| Parameter | Value |
|---|---|
| **RPC Endpoint** | `https://rpc1.z.ink` |
| **Network** | Dedicated z.ink chain (Solana-based SVM chain — **not** Solana mainnet; genesis hash `6qaAozzun2WV83PRDgqf79WXtbqfnezKB3demjxXV5EY`) |
| **Recommended commitment** | `confirmed` (for reads) / `processed` (for sub-second freshness) |
| **Transaction confirmation** | `confirmed` |

### Quick connectivity check

```bash
curl -s -X POST https://rpc1.z.ink \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth","params":[]}' | jq
```

---

## 2. Program Addresses

C4's SAGE program is a `star_frame` rewrite that consolidates cargo, XP/points, and combat into the game program itself. Faction *membership*, however, is **not** fully consolidated — C4 runs its own Profile Faction program (listed below) plus dedicated faction accounts (`FactionConfig`, `FactionRelationTracker`, …). The public **mainnet** SAGE, Player Profile, Profile Faction, and Points program IDs do **not** exist on this chain — never use mainnet addresses here.

C4 — the **public PTR** — is one of three separate deployments of the SAGE program on this chain, each under its own program ID (the others are a private dev server and a crew-dev branch; see the companion docs linked above). Nemesis-engine config still carries stale "phase1/2/3" registry keys for these — they are historical labels, not deployment roles; identify a deployment by its program ID.

| Program | Address | Purpose |
|---|---|---|
| **SAGE — C4 (public PTR)** | `C4SAgeKLgb3pTLWhVr6NRwWyYFuTR7ZeSXFrzoLwfMzF` | Core game logic — fleets, starbases, movement, combat, mining |
| **C4 Profile** | `C4PRoFNroxxzdgeCoM31LJjYRg7kT6ymogSTAT99iD1u` | Player profile accounts |
| **C4 Profile Faction** | `C4FACQA1PpNRKrjQ2862ABNR42DTz7EzGj1uhTNFASwP` | Faction membership on profiles |

> **Important:** All fleet, starbase, and game-logic accounts for an instance are owned by *that deployment's* SAGE program ID. A `getProgramAccounts` query against the C4 program will never return HYE or Crew accounts — always pass the target deployment's program address explicitly, including in SDK calls.

---

## 3. C4 Game Instance Addresses

All queries in this guide target the C4 deployment's program ID. Within the program you can additionally filter by `gameId` (memcmp at offset 10).

### C4 (Public PTR)

| Field | Value |
|---|---|
| **Program ID** | `C4SAgeKLgb3pTLWhVr6NRwWyYFuTR7ZeSXFrzoLwfMzF` |
| **Game Account** | `EKEj47SzaCjPM3m4T4vRXrrsVtkEmiNgPMMFye3AkXj4` |
| **Fleet Account Size** | 695–1,253 bytes observed at capture (extensible — filter by discriminator, not size) |
| **C4 Profile Program** | `C4PRoFNroxxzdgeCoM31LJjYRg7kT6ymogSTAT99iD1u` |

#### NPC Fleet Profiles (C4)

The **Nemesis Engine runs continuously in the background of C4**, operating NPC fleets for the Jorvik and Relic Baron factions. These are the player-profile accounts that own those fleets — **stable, known addresses you can query at any time** to get real, live example data. Think of them as a guaranteed "known wallet/profile" for developing and testing your queries: the individual fleet accounts under them churn (see §8), but the profiles themselves persist and always own active fleets.

| Faction | Profile Address | MinorFactionId |
|---|---|---|
| **Jorvik (JOR)** | `B8PCrai4bqyoR5VAcjFnLixQXejVNReNw6JunbeEACLj` | 4 |
| **Relic Barons (RLB)** | `DNJu1dC8sZFWDNtA2dhH2CPYaNzn556jRdqEmZbzWiq9` | 5 |

> **About the "MinorFactionId" numbers:** these IDs (4 = Jorvik, 5 = Relic Barons; 6–8 exist on other deployments) are dynamic **on-chain** `MinorFactionId` values from the faction registry (also mirrored in nemesis-engine config). They are distinct from the fleet's 1-byte `faction` field, which uses the fixed enum `0 = Unaligned, 1 = MUD, 2 = ONI, 3 = Ustur` — fleets owned by NPC profiles read `0` (Unaligned) there, and the fleet's `npcFactionId` (u16) currently reads `0` on all live fleets.

### Helper Accounts (C4)

| Account                            | Address                                        |
|------------------------------------|------------------------------------------------|
| Faction Relation Tracker (FRT) PDA | `E6X4yidKzV3NW559hrpJDwEmNiRpreXeYjzpZvG7J4n3` |

---

## 4. Account Types & Discriminators

Every SAGE account starts with an **8-byte discriminator** at offset `0`. This is how you distinguish a Fleet from a Starbase from a Game account when scanning the program. Use it as a `memcmp` filter in `getProgramAccounts`.

| Account Type | Discriminator (hex) | Discriminator (base58) |
|---|---|---|
| **Fleet** | `6dcffb306a0288a3` | `KNKT54ytpWW` |
| **Game** | `1b5aa67d4a647912` | `5aNQXizG8jB` |
| **StarbasePlayer** | `c0ea905648130563` | `ZGXhzS6juQW` |
| **CelestialBody** | `b9251d7a0ed88e6d` | `Xy922tyvVh6` |
| **Character** | `8c73a524f1996654` | `QVZMSrEA6j5` |
| **StarSystem** | `cf207b0909fbdda9` | `bePdXVNeenk` |
| **RegionTracker** | `171d1bdf479800e1` | `4sET8pW57x4` |
| **FactionConfig** | `340cfea68f357c37` | `9hxYJKNnXp2` |
| **FactionOwnership** | `50c73351876463e3` | `EWeeHyLbPDL` |
| **LoyaltyContribution** | `80c61e873a4394a2` | `NYGZ8NuB5e1` |
| **CargoDefinitionsCache** | `f8f77509cb1e1f92` | `ieHiRVzMnM7` |
| **CurrencyConfigCache** | `e7cb8e6cd2ea07bf` | `fmhngiKjzmt` |

> **How to compute these yourself:** The discriminator is `sha256("account:<AccountName>")[0:8]`. For example, `sha256("account:Fleet")` → first 8 bytes = `6dcffb306a0288a3`.

---

## 5. Querying Fleets (JSON-RPC)

### 5.1 List all fleets

Filter by the Fleet discriminator at offset 0. **Do not** filter by `dataSize` alone — fleet accounts are extensible and vary in size (695–1,253 bytes observed on the C4 deployment at capture — a point-in-time range, not a bound). The discriminator is stable.

```bash
curl -s -X POST https://rpc1.z.ink \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getProgramAccounts",
    "params": [
      "C4SAgeKLgb3pTLWhVr6NRwWyYFuTR7ZeSXFrzoLwfMzF",
      {
        "encoding": "base64",
        "commitment": "confirmed",
        "filters": [
          { "memcmp": { "offset": 0, "bytes": "KNKT54ytpWW" } }
        ]
      }
    ]
  }' | jq '.result | length'
```

> **Snapshot (2026-07-22, ~slot 39,410,000):** 839 fleet accounts on the C4-deployment program — 84 Jorvik, 34 Relic Baron. **These numbers churn continuously**: Nemesis closes and recreates NPC fleets as part of normal operation, and the Jorvik count had moved from 84 to 146 within hours of this capture. Treat any count as point-in-time only. To scope to one game instance explicitly, add a `gameId` filter: `{ "memcmp": { "offset": 10, "bytes": "<GAME_ACCOUNT>" } }`.

### 5.2 List fleets for a specific faction/profile

Filter by the Fleet discriminator (offset 0) **and** the owner-profile address (offset **42**). The owner profile is a 32-byte public key stored at bytes 42–73 (offsets 8–9 hold a version byte and the PDA bump, followed by the 32-byte `gameId` at offset 10).

The profile address is already base58, so pass it directly as the filter's `bytes` value:

```bash
# Jorvik fleets (C4 deployment)
curl -s -X POST https://rpc1.z.ink \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getProgramAccounts",
    "params": [
      "C4SAgeKLgb3pTLWhVr6NRwWyYFuTR7ZeSXFrzoLwfMzF",
      {
        "encoding": "base64",
        "commitment": "confirmed",
        "filters": [
          { "memcmp": { "offset": 0, "bytes": "KNKT54ytpWW" } },
          { "memcmp": { "offset": 42, "bytes": "B8PCrai4bqyoR5VAcjFnLixQXejVNReNw6JunbeEACLj" } }
        ]
      }
    ]
  }' | jq '.result | length'
```

> Returns the current Jorvik fleet count (84 at capture, 146 hours later — see the churn warning in §8). Swap in `DNJu1dC8sZFWDNtA2dhH2CPYaNzn556jRdqEmZbzWiq9` for Relic Barons.

### 5.3 Get a single fleet by address

NPC fleet addresses are ephemeral (see §8) — grab a current one first by appending `| jq -r '.result[0].pubkey'` to the §5.2 query, then:

```bash
curl -s -X POST https://rpc1.z.ink \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getAccountInfo",
    "params": [
      "<FLEET_ADDRESS>",
      { "encoding": "base64", "commitment": "confirmed" }
    ]
  }' | jq
```

---

## 6. Decoding Fleet Accounts

### 6.1 Raw byte layout (annotated)

A fleet account from Jorvik's `JOR:mk88` fleet, captured 2026-07-22 (the account has since been closed by Nemesis churn, but the layout is current for the C4/HYE deployments). Offsets are **decimal** and fields are not 8-byte aligned:

```
0000:  6d cf fb 30 6a 02 88 a3   ← Discriminator: "Fleet" (6dcffb306a0288a3)
0008:  00                        ← version (u8)
0009:  ff                        ← bump (u8 — the PDA bump seed, here 255)
0010:  c5 d3 e7 51 46 0a 16 31   ← gameId (32 bytes, offsets 10–41)
       66 35 60 7a f2 56 4b 0b
       0a 1e 71 72 90 41 62 f4
       60 0a 38 db 45 26 52 87     = EKEj47Sz… (C4 game account)
0042:  96 79 0a a0 bf 38 82 3f   ← ownerProfile (32 bytes, offsets 42–73)
       c6 22 30 b6 80 0a 23 a7
       fe 19 84 0e de 19 8f f7
       4e 7c b0 45 17 aa 59 5c     = B8PCrai4… (Jorvik NPC profile)
0074:  00 00 … (32 bytes)        ← subProfile (all-zero = none)
0106:  96 79 0a a0 … (32 bytes)  ← subProfileInvalidator
0138:  00                        ← faction (0 = Unaligned; on-chain enum 0–3)
0139:  00 00                     ← npcFactionId (u16 — currently 0 on all live fleets)
0141:  4a 4f 52 3a 6d 6b 38 38   ← fleetLabel ("JOR:mk88", 64 bytes, zero-padded UTF-8)
       … (label continues through offset 204)
```

Beyond the label, the layout is **versioned** — the remainder holds `shipCounts`, the warp/scan cooldown timestamps (i64), `ShipStats`, the `ap`/`sp`/`hp`/`pendingHp` combat stats (u32), `location` (2× I8F56), the fuel/ammo/cargo pods, and the `state` union (`Idle | Docked | MoveWarp | MoveSubwarp | MineAsteroid | Respawn | Destroyed | ClaimStakeTransfer`), but the exact order and offsets vary by account version. Don't hand-parse past the label; use `getFleetDecoder()`.

> **Other deployments:** this layout is current for C4 (and the HYE dev server). The crew-dev deployment uses an older layout — see [`sage-crew-dev-deployment.md`](sage-crew-dev-deployment.md). The memcmp-safe offsets 0/10/42 are identical across all deployments.

### 6.2 Key field offsets

| Offset | Size | Field | Notes |
|---|---|---|---|
| 0 | 8 | Discriminator | `6dcffb306a0288a3` for Fleet |
| 8 | 1 | `version` | Account schema version |
| 9 | 1 | `bump` | PDA bump seed |
| 10 | 32 | `gameId` | Address of the Game account — memcmp here to scope by instance |
| 42 | 32 | `ownerProfile` | The player/faction profile that owns this fleet — memcmp here to filter by owner |
| 74 | 32 | `subProfile` | Optional delegate profile (all-zero = none) |
| 106 | 32 | `subProfileInvalidator` | Key that can invalidate the sub-profile |
| 138 | 1 | `faction` | On-chain faction enum (0=Unaligned, 1=MUD, 2=ONI, 3=Ustur) |
| 139 | 2 | `npcFactionId` | u16 faction-registry id; currently 0 on all live fleets (absent on the crew-dev deployment — see [`sage-crew-dev-deployment.md`](sage-crew-dev-deployment.md)) |
| 141 | 64 | `fleetLabel` | Zero-padded UTF-8 label (e.g. `JOR:mk88`) |
| 205+ | varies | *(versioned tail)* | `shipCounts`, cooldown timestamps (i64), `ShipStats`, `ap`/`sp`/`hp`/`pendingHp` (u32), `location` (2× I8F56), fuel/ammo/cargo pods, `state` union — order and offsets vary by account version; use the SDK decoder |

> **Only offsets 0, 10, and 42 are safe to use in `memcmp` filters.** For everything else, use the SDK decoder (`getFleetDecoder()`) — mid-struct offsets can shift between account versions.
>
> **Important:** C4 uses **float coordinates** for fleet positions (`location: [x, y]`), not an integer sector grid. The type is `I8F56` — fixed-point with 8 integer bits and 56 fractional bits. To convert: `Number(raw) / 2**56`. The sector grid is a best-effort integer rounding of these coordinates.

### 6.3 Fleet state variants

The `state` field is a tagged union. The variant name tells you what the fleet is doing:

| State | Description | Key Fields (inside `state.fields[0]`) |
|---|---|---|
| `Idle` | Stationary, ready for orders | *(none — position is the top-level `location` field)* |
| `Docked` | Docked at a starbase | starbase docking info |
| `MoveWarp` | Warping | `to`, `warpStart`, `warpFinish` — **no origin field**; the departure point is the fleet's `location` |
| `MoveSubwarp` | Sub-warp transit | `journey: { from, to, departureTime, duration }` (arrival = `departureTime + duration`), plus `totalFuelExpenditure`, `totalXpToAward` |
| `MineAsteroid` | Mining a resource | `asteroid` (celestial body address), `resources`, `regionXpModifier` |
| `Respawn` | Being reconstructed | `start`, `end`, `wasInLowRiskZone` |
| `Destroyed` | Destroyed, awaiting respawn/cleanup | — |
| `ClaimStakeTransfer` | Claim-stake transfer in progress | `planet`, `claimStake`, `end`, `load`, `unload` |

> **Decoded shape:** the SDK uses codama tuple encoding, so the payload sits under `state.fields[0]`, e.g. `fleet.state.fields[0].warpFinish` or `fleet.state.fields[0].journey.duration`. A live example: `{"__kind":"MoveSubwarp","fields":[{"journey":{"from":[…],"to":[7,7],"departureTime":"1784743604","duration":920.24},"totalFuelExpenditure":158.7,"totalXpToAward":29.7}]}` — note the fixed-point values only *look* like numbers in JSON; they decode as `FixedPoint` objects (see §9).

---

## 7. Fleet PDA Derivation

Fleet accounts are PDAs derived from the SAGE program. To compute a fleet's address from its label:

**Seeds:**
1. `b"Fleet"` (5 bytes)
2. Game account (32 bytes)
3. Owner profile (32 bytes)
4. Fleet label part 1 (first 32 bytes of the zero-padded 64-byte label)
5. Fleet label part 2 (bytes 32–64 of the zero-padded 64-byte label)

```python
# Python example (using solana-py / solders)
from solders.pubkey import Pubkey

SAGE_PROGRAM = Pubkey.from_string("C4SAgeKLgb3pTLWhVr6NRwWyYFuTR7ZeSXFrzoLwfMzF")
GAME = Pubkey.from_string("EKEj47SzaCjPM3m4T4vRXrrsVtkEmiNgPMMFye3AkXj4")
OWNER = Pubkey.from_string("B8PCrai4bqyoR5VAcjFnLixQXejVNReNw6JunbeEACLj")

label = b"JOR:mk88"
label_padded = label.ljust(64, b'\x00')  # zero-pad to 64 bytes

fleet_pda, _ = Pubkey.find_program_address(
    [
        b"Fleet",
        bytes(GAME),
        bytes(OWNER),
        label_padded[:32],
        label_padded[32:64],
    ],
    SAGE_PROGRAM,
)
print(f"Fleet PDA: {fleet_pda}")
```

---

## 8. Live Examples — Nemesis Engine Fleets

The Nemesis Engine runs continuously on C4, and its Jorvik and Relic Baron fleets exist precisely so you have **real on-chain data to practice against**. The reliable way in is always the same: start from the NPC profile addresses in §3 (stable, always live) and query their fleets with §5.2. Below is what that returned when this guide was captured (2026-07-22, ~slot 39,410,000).

> **⚠️ Individual fleet accounts churn constantly.** Nemesis closes and recreates fleets as part of normal operation — all three example addresses below were closed within hours of capture, and the Jorvik fleet count moved from 84 to 146 the same day. So don't bookmark fleet addresses; bookmark the **profiles** and fetch fresh fleets from them each time.

### Example 1: Jorvik wolf-pack fleet (historical snapshot)

| Field | Value |
|---|---|
| **Address** | `GRHiRcjtTQMcudw5toL9LBtUztAFYHAnJGAKWNDoaFht` |
| **Label** | `JOR:mk88` |
| **Owner** | Jorvik (`B8PCrai4bqyoR5VAcjFnLixQXejVNReNw6JunbeEACLj`) |
| **Faction** | 0 (Unaligned — Jorvik NPC profile) |
| **Location** | `[3.608, 2.378]` |
| **HP / AP / SP** | 165 / 15 / 120 |
| **State** | `Idle` |
| **Ships** | 5 × xxSmall (Volaris-class fighters) |

### Example 2: Relic Baron raider (historical snapshot)

| Field | Value |
|---|---|
| **Address** | `6bcErB2Cykb2J9LnEvgWwJACfaRoqiMpqyQoYCRX8yX8` |
| **Label** | `RLB:pgeg` |
| **Owner** | Relic Barons (`DNJu1dC8sZFWDNtA2dhH2CPYaNzn556jRdqEmZbzWiq9`) |
| **Faction** | 0 |
| **Location** | `[5.452, 4.225]` |
| **HP / AP / SP** | 99 / 0 / 39 |
| **State** | `Idle` |
| **Ships** | 3 × xxSmall |

### Example 3: Jorvik fleet at origin (historical snapshot)

| Field | Value |
|---|---|
| **Address** | `9opSVaE5CnTyYHDneFvUpoTjXGWf3xuT3r23Twpu1eMX` |
| **Label** | `JOR:0wi3` |
| **Location** | `[-0.136, 0.341]` |
| **HP / AP / SP** | 165 / 15 / 120 |
| **State** | `Idle` |
| **Ships** | 5 × xxSmall |

### Fleet count summary (C4 deployment, snapshot at capture)

| Owner | Fleet Count |
|---|---|
| Jorvik (JOR) | **84** |
| Relic Barons (RLB) | **34** |
| Other factions / players | ~721 |
| **Total** | **839** |

---

## 9. Using the SDK (@staratlas/dev-sage)

The easiest way to decode accounts is with Star Atlas's official kit-based SDK. This is what the Nemesis Engine and fc-app use internally.

### Installation

```bash
# The C4 SAGE SDK — codama/kit generated, not the old Anchor IDL
npm install @staratlas/dev-sage @solana/web3.js @solana/kit
```

> **Package version** (as of 2026-07-22): `@staratlas/dev-sage` `0.52.0`. (Don't confuse it with `@staratlas/sage`, which is the separate legacy Anchor SDK for public mainnet — it does not decode C4 accounts.)
>
> **Deployment compatibility:** 0.52.0 decodes every live C4 fleet. If you target the HYE dev server or the crew-dev deployment instead, see [`sage-hye-dev-server.md`](sage-hye-dev-server.md) / [`sage-crew-dev-deployment.md`](sage-crew-dev-deployment.md) — the crew-dev deployment uses an older account layout that current decoders mostly fail on. Always pass the target deployment's program address explicitly rather than relying on SDK defaults.

### TypeScript: fetch and decode all fleets

```typescript
import { Connection, PublicKey } from '@solana/web3.js';
import { getBase58Decoder } from '@solana/kit';
import {
  getFleetDecoder,
  getFleetDiscriminatorBytes,
} from '@staratlas/dev-sage';

const RPC = 'https://rpc1.z.ink';
const SAGE_PROGRAM = 'C4SAgeKLgb3pTLWhVr6NRwWyYFuTR7ZeSXFrzoLwfMzF';
const GAME = 'EKEj47SzaCjPM3m4T4vRXrrsVtkEmiNgPMMFye3AkXj4';

const conn = new Connection(RPC, 'confirmed');

// 1. Get the fleet discriminator as base58 for the memcmp filter
const discBytes = getFleetDiscriminatorBytes();
const discBase58 = getBase58Decoder().decode(discBytes);
// → "KNKT54ytpWW"

// 2. Fetch all fleet accounts
const accounts = await conn.getProgramAccounts(
  new PublicKey(SAGE_PROGRAM),
  {
    commitment: 'confirmed',
    filters: [
      { memcmp: { offset: 0, bytes: discBase58 } },
      { memcmp: { offset: 10, bytes: GAME } }, // scope to one game instance
    ],
  },
);

// 3. Decode each fleet. Fixed-point fields (location, journey coords, durations)
// decode as FixedPoint objects ({ raw, fractionalBits }, with a .toNumber()
// method). They JSON-stringify as numbers but string-concatenate under `+`,
// so ALWAYS convert with toFloat()/.toNumber() before doing math.
const decoder = getFleetDecoder();
const toFloat = (v: any): number => {
  if (typeof v === 'number') return v;
  if (typeof v === 'bigint') return Number(v) / 2 ** 56;
  if (v?.raw !== undefined && v?.fractionalBits !== undefined) {
    return Number(v.raw) / 2 ** v.fractionalBits;
  }
  return Number(v) || 0;
};

for (const acc of accounts) {
  const fleet = decoder.decode(new Uint8Array(acc.account.data));

  const location = Array.isArray(fleet.location)
    ? [toFloat(fleet.location[0]), toFloat(fleet.location[1])]
    : [0, 0];

  const stateKind = (fleet.state as any)?.__kind ?? 'unknown';

  console.log({
    address: acc.pubkey.toBase58(),
    label: fleet.fleetLabel,
    ownerProfile: fleet.ownerProfile,
    faction: fleet.faction,
    location,
    hp: fleet.hp,
    ap: fleet.ap,
    sp: fleet.sp,
    state: stateKind,
    shipCounts: fleet.shipCounts,
  });
}
```

### TypeScript: decode a single fleet

```typescript
const fleetAddress = '<a current fleet address — see §5.2/§5.3>';
const accountInfo = await conn.getAccountInfo(
  new PublicKey(fleetAddress),
  'confirmed',
);

if (!accountInfo) {
  console.log('Fleet not found');
  process.exit(1);
}

const decoder = getFleetDecoder();
const fleet = decoder.decode(new Uint8Array(accountInfo.data));

console.log(fleet.fleetLabel);     // "JOR:mk88"
console.log(fleet.hp);             // 165
console.log(fleet.state);          // { __kind: 'Idle', fields: [[]] } — empty payload; position is fleet.location
```

---

## 10. Solana CLI Examples

### Inspect a fleet account (raw)

```bash
# Substitute a current fleet address (see §5.2/§5.3 — NPC fleet addresses churn)
solana account <FLEET_ADDRESS> \
  --url https://rpc1.z.ink
```

### Inspect the Game account

```bash
solana account EKEj47SzaCjPM3m4T4vRXrrsVtkEmiNgPMMFye3AkXj4 \
  --url https://rpc1.z.ink
```

The Game account is large (~2.5 MB) — it holds game-wide configuration such as cargo types, ship/unit definitions, research trees, and settings. Star systems and planets are **not** inside it: they live in separate accounts (`StarSystem`, `CelestialBody`, …) owned by the same program. Starbase data is embedded in `StarSystem`; `StarbasePlayer` holds a *player's* per-starbase state, not the starbase itself.

---

## 11. Common Queries

### "How many fleets does each faction have?"

Filter by owner profile and count results:

```bash
for PROFILE in \
  "B8PCrai4bqyoR5VAcjFnLixQXejVNReNw6JunbeEACLj:Jorvik" \
  "DNJu1dC8sZFWDNtA2dhH2CPYaNzn556jRdqEmZbzWiq9:RelicBarons"; do
  ADDR=$(echo $PROFILE | cut -d: -f1)
  NAME=$(echo $PROFILE | cut -d: -f2)
  COUNT=$(curl -s -X POST https://rpc1.z.ink \
    -H "Content-Type: application/json" \
    -d "{
      \"jsonrpc\":\"2.0\",\"id\":1,
      \"method\":\"getProgramAccounts\",
      \"params\":[\"C4SAgeKLgb3pTLWhVr6NRwWyYFuTR7ZeSXFrzoLwfMzF\",{
        \"encoding\":\"base64\",\"commitment\":\"confirmed\",
        \"filters\":[
          {\"memcmp\":{\"offset\":0,\"bytes\":\"KNKT54ytpWW\"}},
          {\"memcmp\":{\"offset\":42,\"bytes\":\"$ADDR\"}}
        ]
      }]
    }" | jq '.result | length')
  echo "$NAME: $COUNT fleets"
done
```

### "Which fleets are in combat / mining / moving?"

Decode each fleet's `state` field and check `__kind`:

```typescript
// `accounts` and `decoder` from §9
const fleets = accounts.map(a => decoder.decode(new Uint8Array(a.account.data)));
const mining = fleets.filter(f => f.state?.__kind === 'MineAsteroid');
const warping = fleets.filter(f => f.state?.__kind === 'MoveWarp');
const idle = fleets.filter(f => f.state?.__kind === 'Idle');
console.log(`Mining: ${mining.length}, Warping: ${warping.length}, Idle: ${idle.length}`);
```

### "Where is a fleet right now?"

For `Idle` / `Docked` / `MineAsteroid` / `Respawn` fleets, the top-level `location` field is the current position. For movers, the two states behave **differently**:

- **`MoveWarp`:** `fleet.location` remains the departure point until completion (there is no origin field in the state payload). Timestamp interpolation is visual only.
- **`MoveSubwarp`:** `fleet.location` is the **last settled on-chain position and may advance during transit** — the program settles progress incrementally and caps effective progress by remaining fuel (`max(settledProgress, min(timeProgress, fuelProgress))`). An underfunded fleet is physically behind (or short of) what pure timestamp math suggests.

The decoded payload sits under `state.fields[0]` (and under `fields[0].journey` for subwarp). The example below gives a timestamp-based **visual estimate assuming sufficient fuel**; an authoritative projection must also account for settled progress and the fleet's remaining fuel, matching the program's `progress_with_fuel` / `project_at` logic:

```typescript
function estimatedDisplayLocationAssumingSufficientFuel(fleet: any): [number, number] {
  // Fixed-point fields decode as FixedPoint objects — convert with toFloat() (§9)
  // or .toNumber() before any arithmetic, or `+` silently produces string
  // concatenation (e.g. "39.99-0.37").
  const here: [number, number] = [toFloat(fleet.location[0]), toFloat(fleet.location[1])];
  const now = Date.now() / 1000;
  const payload = fleet.state?.fields?.[0]; // codama tuple encoding
  switch (fleet.state?.__kind) {
    case 'MoveWarp': {
      const { to, warpStart, warpFinish } = payload;
      const progress = Math.min(1, Math.max(0, (now - Number(warpStart)) / (Number(warpFinish) - Number(warpStart))));
      return [
        here[0] + (toFloat(to[0]) - here[0]) * progress,
        here[1] + (toFloat(to[1]) - here[1]) * progress,
      ];
    }
    case 'MoveSubwarp': {
      const { from, to, departureTime, duration } = payload.journey;
      const progress = Math.min(1, Math.max(0, (now - Number(departureTime)) / toFloat(duration)));
      return [
        toFloat(from[0]) + (toFloat(to[0]) - toFloat(from[0])) * progress,
        toFloat(from[1]) + (toFloat(to[1]) - toFloat(from[1])) * progress,
      ];
    }
    default:
      return here; // Idle, Docked, MineAsteroid, Respawn, ...
  }
}
```

---

## 12. Reference: SDK Exports

The `@staratlas/dev-sage` package provides discriminator getters for all 40+ account types. To get a list:

```typescript
import * as Sage from '@staratlas/dev-sage';

const allDiscriminators = Object.keys(Sage)
  .filter(k => k.startsWith('get') && k.endsWith('DiscriminatorBytes'))
  .map(name => {
    const bytes = (Sage as any)[name]();
    return {
      accountType: name.replace('get', '').replace('DiscriminatorBytes', ''),
      hex: Buffer.from(bytes).toString('hex'),
    };
  });
```

> **Caveats:** this name-based sweep also matches **instruction** discriminator getters (`get<InstructionName>DiscriminatorBytes`), so filter the results against the account-type list; and not every account type ships a `find<Name>Pda()` helper.

Each account type also has a `get<Name>Decoder()` function for decoding raw bytes, and most PDA-based account types have a `find<Name>Pda()` function for deriving addresses.

---

## Appendix: Address Quick Reference

```
# Programs (C4 public PTR — for the dev deployments see sage-hye-dev-server.md / sage-crew-dev-deployment.md)
SAGE_PROGRAM_C4=C4SAgeKLgb3pTLWhVr6NRwWyYFuTR7ZeSXFrzoLwfMzF     # public PTR
C4_PROFILE_PROGRAM=C4PRoFNroxxzdgeCoM31LJjYRg7kT6ymogSTAT99iD1u
C4_PROFILE_FACTION_PROGRAM=C4FACQA1PpNRKrjQ2862ABNR42DTz7EzGj1uhTNFASwP

# Game instance
GAME_C4=EKEj47SzaCjPM3m4T4vRXrrsVtkEmiNgPMMFye3AkXj4

# NPC Fleet profiles (C4 deployment)
JOR_PROFILE=B8PCrai4bqyoR5VAcjFnLixQXejVNReNw6JunbeEACLj
RLB_PROFILE=DNJu1dC8sZFWDNtA2dhH2CPYaNzn556jRdqEmZbzWiq9

# Sample fleet addresses are deliberately omitted — NPC fleets churn; fetch live ones (see §5.2)

# RPC
RPC=https://rpc1.z.ink
```

---

*Document generated July 2026; verified 2026-07-22 against the live chain (slot ~39,410,774), `@staratlas/dev-sage` 0.52.0, and the Programs source. Fleet counts, sample addresses, and sample data are point-in-time snapshots — NPC fleet accounts churn constantly; query the RPC for current state.*
