<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted } from 'vue';
import { useData } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { useMermaidZoom } from 'vitepress-mermaid-zoom';
import 'vitepress-mermaid-zoom/style.css';

const { page } = useData();
const pagePath = computed(() => page.value.relativePath);

useMermaidZoom(pagePath);

let diagramObserver: MutationObserver | undefined;
let keyboardActivatedDiagram: HTMLElement | undefined;

function labelZoomableDiagrams(): void {
	document.querySelectorAll<HTMLElement>('.mermaid[data-zoomable]').forEach((diagram) => {
		diagram.tabIndex = 0;
		diagram.setAttribute('role', 'button');
		diagram.setAttribute('aria-label', 'Open diagram in fullscreen');
	});
}

function handleDiagramKeydown(event: KeyboardEvent): void {
	if (event.key === 'Escape') {
		queueMicrotask(restoreKeyboardDiagramFocus);
		return;
	}

	if (event.key !== 'Enter' && event.key !== ' ') {
		return;
	}

	const target = event.target;

	if (!(target instanceof HTMLElement) || !target.matches('.mermaid[data-zoomable]')) {
		return;
	}

	event.preventDefault();
	keyboardActivatedDiagram = target;
	target.click();
}

function restoreKeyboardDiagramFocus(): void {
	if (
		!keyboardActivatedDiagram ||
		document.querySelector('.mermaid-zoom-backdrop.active')
	) {
		return;
	}

	keyboardActivatedDiagram.focus();
	keyboardActivatedDiagram = undefined;
}

onMounted(() => {
	void nextTick(labelZoomableDiagrams);

	diagramObserver = new MutationObserver(labelZoomableDiagrams);
	diagramObserver.observe(document.body, { childList: true, subtree: true });
	document.addEventListener('keydown', handleDiagramKeydown);
});

onUnmounted(() => {
	diagramObserver?.disconnect();
	document.removeEventListener('keydown', handleDiagramKeydown);
});
</script>

<template>
	<DefaultTheme.Layout />
</template>
