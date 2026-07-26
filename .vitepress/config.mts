import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';

const sageSidebar = [
	{
		text: 'Start Here',
		items: [
			{ text: 'Overview', link: '/sage-c4-bindings/' },
			{ text: 'Beginner Map', link: '/sage-c4-bindings/beginner-map' },
			{ text: 'Connection', link: '/sage-c4-bindings/connection' },
			{ text: 'Installation', link: '/sage-c4-bindings/installation' },
			{ text: '@solana/kit Client', link: '/sage-c4-bindings/kit-client' },
			{ text: 'Reading Live Game State', link: '/sage-c4-bindings/reading-game-state' }
		]
	},
	{
		text: 'Foundation',
		items: [
			{ text: 'Read Identity and Faction', link: '/sage-c4-bindings/read-identity-and-faction' },
			{ text: 'Player Profile', link: '/sage-c4-bindings/player-profile' },
			{ text: 'Profile Faction', link: '/sage-c4-bindings/profile-faction' },
			{ text: 'Character and Progression', link: '/sage-c4-bindings/character-progression' }
		]
	},
	{
		text: 'Build Workflows',
		items: [
			{ text: 'Transaction Review and Diffs', link: '/sage-c4-bindings/transaction-review-and-diffs' },
			{ text: 'Fleet Creation', link: '/sage-c4-bindings/fleet-creation-workflow' },
			{ text: 'Crafting Process', link: '/sage-c4-bindings/crafting-process-workflow' },
			{ text: 'Scanning', link: '/sage-c4-bindings/scanning-workflow' },
			{ text: 'Claim Stake Placement', link: '/sage-c4-bindings/claim-stake-placement-workflow' }
		]
	},
	{
		text: 'Gameplay Domains',
		items: [
			{ text: 'SAGE Gameplay Overview', link: '/sage-c4-bindings/sage-gameplay-overview' },
			{ text: 'World Data', link: '/sage-c4-bindings/world-data' },
			{ text: 'Fleets', link: '/sage-c4-bindings/fleets' },
			{ text: 'Starbases', link: '/sage-c4-bindings/starbases' },
			{ text: 'Cargo and Currency', link: '/sage-c4-bindings/cargo-and-currency' },
			{ text: 'Mining, Scanning, and Loot', link: '/sage-c4-bindings/mining-scanning-loot' },
			{ text: 'Crafting', link: '/sage-c4-bindings/crafting' },
			{ text: 'Claim Stakes', link: '/sage-c4-bindings/claim-stakes' },
			{ text: 'Local Markets', link: '/sage-c4-bindings/local-markets' }
		]
	},
	{
		text: 'Reference',
		items: [
			{ text: 'Accounts', link: '/sage-c4-bindings/accounts' },
			{ text: 'Account Relationship Map', link: '/sage-c4-bindings/account-relationship-map' },
			{ text: 'Program Architecture', link: '/sage-c4-bindings/program-architecture' },
			{ text: 'Current Package Surface', link: '/sage-c4-bindings/current-package-surface' },
			{ text: 'Generated Types Glossary', link: '/sage-c4-bindings/generated-types-glossary' }
		]
	}
];

export default withMermaid(defineConfig({
	lang: 'en-US',
	title: 'SAGE Dev Docs',
	description: 'Developer docs for Star Atlas SAGE C4 program clients and workflows on the z.ink testnet.',
	cleanUrls: true,
	appearance: true,
	srcExclude: ['README.md', 'AGENTS.md', 'references/**'],
	head: [
		['meta', { name: 'theme-color', content: '#07111d' }],
		['meta', { property: 'og:type', content: 'website' }],
		['meta', { property: 'og:title', content: 'SAGE Dev Docs' }],
		['meta', { property: 'og:description', content: 'Developer docs for Star Atlas SAGE C4 program clients and workflows on the z.ink testnet.' }],
		['meta', { property: 'og:image', content: '/images/star-atlas-build-hero.png' }],
		['link', { rel: 'icon', href: '/images/star-atlas-build-icon.png' }]
	],
	themeConfig: {
		logo: '/images/star-atlas-build-logo.png',
		siteTitle: 'SAGE Dev Docs',
		nav: [
			{ text: 'Home', link: '/' },
			{ text: 'SAGE C4 Dev Docs', link: '/sage-c4-bindings/' },
			{ text: 'Connection', link: '/sage-c4-bindings/connection' },
			{ text: 'Star Atlas Build', link: 'https://build.staratlas.com/' }
		],
		sidebar: {
			'/sage-c4-bindings/': sageSidebar,
			'/': sageSidebar
		},
		search: {
			provider: 'local'
		},
		outline: {
			level: [2, 3],
			label: 'On this page'
		},
		docFooter: {
			prev: 'Previous',
			next: 'Next'
		},
		lastUpdated: {
			text: 'Last updated'
		},
		footer: {
			message: '',
			copyright: 'SAGE Dev Docs'
		}
	}
}));
