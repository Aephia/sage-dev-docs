<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useData } from 'vitepress';
import { getMarkdownPath } from '../markdown-path';

type Assistant = 'chatgpt' | 'claude';

const { page } = useData();
const root = ref<HTMLElement>();
const trigger = ref<HTMLButtonElement>();
const menu = ref<HTMLElement>();
const menuOpen = ref(false);
const copyState = ref<'idle' | 'copying' | 'copied' | 'failed'>('idle');
const markdownPath = computed(() => getMarkdownPath(page.value.relativePath));
const copyLabel = computed(() => {
	switch (copyState.value) {
		case 'copying':
			return 'Copying…';
		case 'copied':
			return 'Copied';
		case 'failed':
			return 'Copy failed';
		default:
			return 'Copy';
	}
});

let copyResetTimer: ReturnType<typeof setTimeout> | undefined;
let menuCloseTimer: ReturnType<typeof setTimeout> | undefined;

function menuItems(): HTMLElement[] {
	return Array.from(menu.value?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
}

function focusMenuItem(position: 'first' | 'last'): void {
	void nextTick(() => {
		const items = menuItems();
		items[position === 'first' ? 0 : items.length - 1]?.focus();
	});
}

function openMenu(focus: 'none' | 'first' | 'last' = 'none'): void {
	menuOpen.value = true;

	if (focus !== 'none') {
		focusMenuItem(focus);
	}
}

function closeMenu(restoreFocus = false): void {
	menuOpen.value = false;

	if (restoreFocus) {
		void nextTick(() => trigger.value?.focus());
	}
}

function toggleMenu(): void {
	if (menuOpen.value) {
		closeMenu();
	} else {
		openMenu('first');
	}
}

async function copyMarkdown(closeAfterCopy = false): Promise<void> {
	copyState.value = 'copying';

	try {
		const response = await fetch(markdownPath.value);

		if (!response.ok) {
			throw new Error(`Markdown request failed with ${response.status}`);
		}

		await navigator.clipboard.writeText(await response.text());
		copyState.value = 'copied';
	} catch {
		copyState.value = 'failed';
	}

	clearTimeout(copyResetTimer);
	copyResetTimer = setTimeout(() => {
		copyState.value = 'idle';
	}, 2500);

	if (closeAfterCopy && copyState.value === 'copied') {
		clearTimeout(menuCloseTimer);
		menuCloseTimer = setTimeout(() => closeMenu(true), 900);
	}
}

function openInAssistant(assistant: Assistant): void {
	const markdownUrl = new URL(markdownPath.value, window.location.origin).toString();
	const prompt = encodeURIComponent(`Read ${markdownUrl} and answer questions about the content.`);
	const target = assistant === 'chatgpt'
		? `https://chatgpt.com/?q=${prompt}`
		: `https://claude.ai/new?q=${prompt}`;

	window.open(target, '_blank', 'noopener,noreferrer');
	closeMenu(true);
}

function handleTriggerKeydown(event: KeyboardEvent): void {
	if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
		return;
	}

	event.preventDefault();
	openMenu(event.key === 'ArrowDown' ? 'first' : 'last');
}

function handleMenuKeydown(event: KeyboardEvent): void {
	const items = menuItems();
	const currentIndex = items.indexOf(document.activeElement as HTMLElement);

	switch (event.key) {
		case 'ArrowDown':
			event.preventDefault();
			items[(currentIndex + 1 + items.length) % items.length]?.focus();
			break;
		case 'ArrowUp':
			event.preventDefault();
			items[(currentIndex - 1 + items.length) % items.length]?.focus();
			break;
		case 'Home':
			event.preventDefault();
			items[0]?.focus();
			break;
		case 'End':
			event.preventDefault();
			items.at(-1)?.focus();
			break;
		case 'Escape':
			event.preventDefault();
			closeMenu(true);
			break;
	}
}

function handleDocumentPointerDown(event: PointerEvent): void {
	if (menuOpen.value && !root.value?.contains(event.target as Node)) {
		closeMenu();
	}
}

function handleDocumentKeydown(event: KeyboardEvent): void {
	if (menuOpen.value && event.key === 'Escape') {
		event.preventDefault();
		closeMenu(true);
	}
}

function handleFocusOut(): void {
	requestAnimationFrame(() => {
		if (menuOpen.value && !root.value?.contains(document.activeElement)) {
			closeMenu();
		}
	});
}

watch(markdownPath, () => closeMenu());

onMounted(() => {
	document.addEventListener('pointerdown', handleDocumentPointerDown);
	document.addEventListener('keydown', handleDocumentKeydown);
});

onUnmounted(() => {
	clearTimeout(copyResetTimer);
	clearTimeout(menuCloseTimer);
	document.removeEventListener('pointerdown', handleDocumentPointerDown);
	document.removeEventListener('keydown', handleDocumentKeydown);
});
</script>

<template>
	<nav
		ref="root"
		class="markdown-actions"
		aria-label="Page Markdown and AI actions"
		@focusout="handleFocusOut"
	>
		<div class="markdown-split-button">
			<button
				type="button"
				class="markdown-copy-button"
				aria-live="polite"
				:disabled="copyState === 'copying'"
				@click="copyMarkdown()"
			>
				<svg aria-hidden="true" viewBox="0 0 18 18">
					<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
						<path d="m10.75 6.25v-2c0-.828-.672-1.5-1.5-1.5h-1" />
						<path d="M4.25 2.75h-1c-.828 0-1.5.672-1.5 1.5v7.5c0 .828.672 1.5 1.5 1.5H7" />
						<rect x="4.5" y="1.75" width="3.5" height="2" rx=".5" fill="currentColor" fill-opacity=".2" />
						<rect x="7.25" y="6.25" width="9" height="10" rx="1.5" />
						<path d="M10.25 9.75h3m-3 3h3" />
					</g>
				</svg>
				<span>{{ copyLabel }}</span>
			</button>
			<button
				ref="trigger"
				type="button"
				class="markdown-menu-trigger"
				aria-label="More Markdown and AI options"
				aria-haspopup="menu"
				:aria-expanded="menuOpen"
				aria-controls="markdown-actions-menu"
				@click="toggleMenu"
				@keydown="handleTriggerKeydown"
			>
				<svg aria-hidden="true" viewBox="0 0 24 24">
					<path d="m6 9 6 6 6-6" />
				</svg>
			</button>
		</div>

		<Transition name="markdown-menu">
			<div
				v-if="menuOpen"
				id="markdown-actions-menu"
				ref="menu"
				class="markdown-menu"
				role="menu"
				aria-label="Markdown and AI options"
				@keydown="handleMenuKeydown"
			>
				<button role="menuitem" class="markdown-menu-item" @click="copyMarkdown(true)">
					<svg aria-hidden="true" viewBox="0 0 18 18">
						<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
							<path d="m10.75 6.25v-2c0-.828-.672-1.5-1.5-1.5h-1" />
							<path d="M4.25 2.75h-1c-.828 0-1.5.672-1.5 1.5v7.5c0 .828.672 1.5 1.5 1.5H7" />
							<rect x="4.5" y="1.75" width="3.5" height="2" rx=".5" fill="currentColor" fill-opacity=".2" />
							<rect x="7.25" y="6.25" width="9" height="10" rx="1.5" />
							<path d="M10.25 9.75h3m-3 3h3" />
						</g>
					</svg>
					<span aria-live="polite">
						<strong>{{ copyState === 'copied' ? 'Copied' : 'Copy page' }}</strong>
						<small>Copy page as Markdown for AI assistants</small>
					</span>
				</button>

				<a
					role="menuitem"
					class="markdown-menu-item"
					:href="markdownPath"
					target="_blank"
					rel="noopener"
					@click="closeMenu()"
				>
					<svg aria-hidden="true" viewBox="0 0 18 18">
						<path fill="currentColor" d="M15.25 3H2.75A2.753 2.753 0 0 0 0 5.75v6.5A2.753 2.753 0 0 0 2.75 15h12.5A2.753 2.753 0 0 0 18 12.25v-6.5A2.753 2.753 0 0 0 15.25 3ZM9.5 11.25a.75.75 0 0 1-1.5 0V8.45L6.845 9.956a.75.75 0 0 1-1.19 0L4.5 8.45v2.8a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 3.75 6h.394c.233 0 .454.109.595.294L6.25 8.267l1.511-1.973A.75.75 0 0 1 8.356 6h.394a.75.75 0 0 1 .75.75v4.5Zm6.03-1.22-1.75 1.75a.75.75 0 0 1-1.06 0l-1.75-1.75a.75.75 0 1 1 1.06-1.061l.47.47V6.75a.75.75 0 0 1 1.5 0v2.689l.47-.47a.75.75 0 1 1 1.06 1.061Z" />
					</svg>
					<span>
						<strong>View as Markdown</strong>
						<small>View this page as plain text</small>
					</span>
				</a>

				<div class="markdown-menu-divider" role="separator" />

				<button role="menuitem" class="markdown-menu-item" @click="openInAssistant('chatgpt')">
					<svg aria-hidden="true" viewBox="0 0 24 24">
						<path fill="currentColor" d="M9.205 8.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616a4.25 4.25 0 0 1 2.117-.523c2.854 0 4.662 2.212 4.662 4.566 0 .167 0 .357-.024.547l-4.71-2.759a.797.797 0 0 0-.856 0L9.205 8.658Zm10.609 8.8V12.06a.82.82 0 0 0-.429-.737l-5.97-3.473 1.95-1.118a.433.433 0 0 1 .476 0l4.543 2.617a4.67 4.67 0 0 1 2.189 3.948 4.5 4.5 0 0 1-2.76 4.163ZM7.802 12.703l-1.95-1.142a.47.47 0 0 1-.239-.428V5.899c0-2.545 1.95-4.472 4.591-4.472 1 0 1.927.333 2.712.928L8.23 5.067a.8.8 0 0 0-.428.737v6.898ZM12 15.128l-2.795-1.57v-3.33L12 8.658l2.795 1.57v3.33L12 15.128Zm1.796 7.23c-1 0-1.927-.332-2.712-.927l4.686-2.712a.8.8 0 0 0 .428-.737v-6.898l1.974 1.142a.47.47 0 0 1 .238.428v5.233c0 2.545-1.974 4.472-4.614 4.472ZM8.159 17.055l-4.544-2.617a4.67 4.67 0 0 1-2.188-3.948A4.482 4.482 0 0 1 4.21 6.327v5.423c0 .333.143.571.428.738l5.947 3.449-1.95 1.118a.432.432 0 0 1-.476 0Zm-.262 3.9c-2.688 0-4.662-2.021-4.662-4.519 0-.19.024-.38.047-.57l4.686 2.71c.286.167.571.167.856 0l5.97-3.448v2.26c0 .19-.07.333-.237.428l-4.543 2.616a4.25 4.25 0 0 1-2.117.523Zm5.899 2.83a5.947 5.947 0 0 0 5.827-4.756C22.287 18.339 24 15.84 24 13.296c0-1.665-.713-3.282-1.998-4.448.119-.5.19-.999.19-1.498 0-3.401-2.759-5.947-5.946-5.947-.642 0-1.26.095-1.88.31A5.962 5.962 0 0 0 10.205 0a5.947 5.947 0 0 0-5.827 4.757C1.713 5.447 0 7.945 0 10.49c0 1.666.713 3.283 1.998 4.448-.119.5-.19 1-.19 1.499 0 3.401 2.759 5.947 5.946 5.947.642 0 1.26-.095 1.88-.309a5.96 5.96 0 0 0 4.162 1.713Z" />
					</svg>
					<span>
						<strong>Open in ChatGPT</strong>
						<small>Ask ChatGPT about this page</small>
					</span>
				</button>

				<button role="menuitem" class="markdown-menu-item" @click="openInAssistant('claude')">
					<svg aria-hidden="true" viewBox="0 0 24 24">
						<path fill="currentColor" d="m4.709 15.955 4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 0 1-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006Z" />
					</svg>
					<span>
						<strong>Open in Claude</strong>
						<small>Ask Claude about this page</small>
					</span>
				</button>
			</div>
		</Transition>
	</nav>
</template>
