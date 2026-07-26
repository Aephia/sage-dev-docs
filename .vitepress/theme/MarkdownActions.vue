<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue';
import { useData } from 'vitepress';
import { getMarkdownPath } from '../markdown-path';

const { page } = useData();
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
			return 'Copy Markdown';
	}
});

let resetTimer: ReturnType<typeof setTimeout> | undefined;

async function copyMarkdown(): Promise<void> {
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

	clearTimeout(resetTimer);
	resetTimer = setTimeout(() => {
		copyState.value = 'idle';
	}, 2500);
}

onUnmounted(() => {
	clearTimeout(resetTimer);
});
</script>

<template>
	<nav class="markdown-actions" aria-label="Page Markdown">
		<a :href="markdownPath" target="_blank" rel="noopener">
			View Markdown
		</a>
		<button
			type="button"
			aria-live="polite"
			:disabled="copyState === 'copying'"
			@click="copyMarkdown"
		>
			{{ copyLabel }}
		</button>
	</nav>
</template>
