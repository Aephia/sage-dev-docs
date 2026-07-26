# Character and Progression

Character and progression accounts connect a Player Profile to SAGE-specific state: check-ins, XP, research, crew counts, ship/cargo counts, modifiers, and ATLAS accounting.

The foundation pages explain identity and faction. This page starts where SAGE adds game-specific progression on top of that identity.

In Star Atlas terms, `Character` is the game-specific layer of a player profile: the account that lets SAGE track progression, daily check-ins, XP, modifiers, and counts that are separate from the generic identity model.

SAGE rewards progression through activity. Experience, loyalty, and ATLAS
reward flows can involve combat encounters, repairing or upgrading friendly
starbases, and attacking enemy infrastructure. `Character` is one of the
accounts where that activity becomes player-specific state.

::: info Position in the account hierarchy
**Owned by:** SAGE program through `@staratlas/dev-sage`<br>
**Derived from:** Player Profile + Game<br>
**Meaning:** the profile's game-specific progression and accounting state<br>
**Downstream:** helps derive StarbasePlayer and participates in fleet, cargo, crafting, claim-stake, crew, research, and reward instructions
:::

`Character` is not the wallet and not the generic Player Profile. It is the
bridge between Star Atlas identity and one SAGE game instance.

## Developer use

Use this page when you need to:

- derive a SAGE character from a player profile and game
- display XP, check-in, modifier, or asset-count state
- explain why a fleet, mining, crafting, starbase, or claim-stake instruction also writes character state
- prepare daily check-in or research-related transaction reviews

## Technical model

`Character` is a PDA derived from `playerProfile` and `gameId`. It is not the wallet and not the Player Profile account, but many SAGE instructions write it because gameplay changes progression, counts, crew, or accounting state.

PTR traces confirm this relationship: fleet cargo, mining, crafting, claim-stake, and disband flows often write `Character` alongside the main domain account.

## Generated anchors

Character and progression account and instruction helpers live in `@staratlas/dev-sage`.

```ts
import {
	fetchMaybeCharacter,
	findCharacterPda,
	getDailyCheckInInstructionAsync
} from '@staratlas/dev-sage';
```

## Accounts and types

| Generated symbol | Kind | Beginner meaning |
| --- | --- | --- |
| `Character` | account | SAGE-specific player state for one profile in one game. |
| `CheckInStreakInfo` | type | Daily check-in streak data nested in `Character`. |
| `XpInfo` | type | XP state nested in `Character`. |
| `CharacterAssetCounts` | type | Counts of assets associated with the character. |
| `CharacterModifiers` | type | Active modifiers applied to the character. |
| `ResearchNode` | type | Research-tree node definition. |
| `ResearchTreeDefinitions` | type | Research tree definitions nested in `Game`. |
| `DailyCheckInConfig` | type | Daily check-in tuning nested in game/XP config. |

## `Character` account

Important fields:

```txt
playerProfile       Player Profile account
gameId              SAGE game account
bump                PDA bump
checkInInfo         daily check-in streak state
xpInfo              XP state
atlas               ATLAS accounting value
counts              character asset counts
pilotXpBudget       pilot XP budget/accounting state
characterModifiers  active modifiers
```

`Character` is derived from a profile and game. Many SAGE instructions can derive it automatically when given `profileValidationProfile` and `game`, but application code should still understand what account is being touched.

## PDA helper

| Helper | Seeds | Meaning |
| --- | --- | --- |
| `findCharacterPda` | `playerProfile`, `gameId` | Find a SAGE character for one player profile in one game. |

```ts
import { findCharacterPda } from '@staratlas/dev-sage';

const [characterAddress] = await findCharacterPda({
	playerProfile: profileAddress,
	gameId: gameAddress
});
```

## Read a character

This example reads a character by PDA. It does not sign or send a transaction.

```ts
import { createSolanaRpc } from '@solana/kit';
import {
	fetchMaybeCharacter,
	findCharacterPda
} from '@staratlas/dev-sage';

const rpc = createSolanaRpc('https://testnet-rpc.z.ink');

const [characterAddress] = await findCharacterPda({
	playerProfile: profileAddress,
	gameId: gameAddress
});

const character = await fetchMaybeCharacter(rpc, characterAddress, {
	commitment: 'confirmed'
});

if (!character.exists) {
	throw new Error(`Character not found: ${characterAddress}`);
}

console.log({
	profile: character.data.playerProfile,
	gameId: character.data.gameId,
	atlas: character.data.atlas,
	checkInInfo: character.data.checkInInfo,
	xpInfo: character.data.xpInfo
});
```

## Instruction families

| Family | Instructions | What they manage |
| --- | --- | --- |
| Character setup | `registerCharacter` | Create or initialize SAGE character state for a profile/game. |
| Crew movement | `addCrewToGame`, `removeCrewFromGame`, `devAddCrew` | Add or remove crew from SAGE game state. |
| Crew progression | `awardCrewActivityXp`, `levelUpCrew`, `migrateCrewMember`, `markCrewGarrison`, `mintNpcCrewCapacity` | Update crew XP, levels, migration state, garrison state, or NPC capacity. |
| Daily check-in | `dailyCheckIn` | Mutate check-in streak/progression state. |
| XP config | `updateXpCheckInConfig`, `updateXpThresholds` | Admin/configuration for check-in and XP thresholds. |
| Reward and loyalty accounting | `claimLoyaltyAtlas`, `settleLoyaltyContribution`, `sweepExpiredLoyaltyAtlasBank`, `advanceAtlasRewardEpoch`, `rollAtlasRewardEpoch` | Claim or settle loyalty and ATLAS reward state. |
| Research | `updateResearchTreeNodes`, `unlockResearchNode` | Manage research definitions and unlock player research. |
| Rentals | `addRental`, `changeRental`, `invalidateRental` | Manage rental-like progression/accounting state. |

## Instruction example: daily check-in

This example builds a `dailyCheckIn` instruction for review. It still needs transaction summary and simulation before a wallet prompt.

```ts
import { getDailyCheckInInstructionAsync } from '@staratlas/dev-sage';

// These values must come from wallet/profile state and SAGE character discovery.
const instruction = await getDailyCheckInInstructionAsync({
	profileValidationSigner: signer,
	profileValidationProfile: profileAddress,
	game: gameAddress,
	character: characterAddress,
	keyIndex: 0,
	restoreStreak: false,
	expectedRestoreCost: 0n
});

console.log(instruction.programAddress);
```

Before sending a progression transaction, show:

- which wallet signs
- which Player Profile key index authorizes the action
- which character account changes
- whether XP, streak, ATLAS, research, crew, or modifiers change
- which accounts become writable
- what simulation returns

## Safety notes

Reading character and progression state is safe. Sending progression instructions can change player state, unlock research, change crew counts, or mutate reward/accounting values.

Keep user-facing flows explicit about account effects. Progression state looks harmless until it changes shared strategic limits or reward eligibility.

## Related pages

- [Read Identity and Faction](/sage-c4-bindings/read-identity-and-faction) for
  the Profile and Profile Faction layers above Character
- [Account Relationship Map](/sage-c4-bindings/account-relationship-map) for
  Character and StarbasePlayer derivation
- [Extended C4 Systems](/sage-c4-bindings/extended-systems) for crew, research,
  loyalty, missions, and quests
