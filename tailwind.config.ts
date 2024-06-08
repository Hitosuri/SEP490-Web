import { join } from 'path';
import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import containerQueries from '@tailwindcss/container-queries';
import { skeleton } from '@skeletonlabs/tw-plugin';
import { mainTheme } from './src/main-theme';

export default {
	darkMode: 'class',
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		join(require.resolve('@skeletonlabs/skeleton'), '../**/*.{html,js,svelte,ts}')
	],
	theme: {
		extend: {
			padding: {
				'scroll-bar': 'var(--scrollbar-width, 0)',
				header: '5.5rem'
			}
		}
	},
	plugins: [
		forms,
		typography,
		containerQueries,
		skeleton({
			themes: {
				custom: [mainTheme]
			}
		})
	]
} satisfies Config;
