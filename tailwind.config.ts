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
				'scroll-bar-dynamic': 'var(--scrollbar-width, 0)'
			},
			spacing: {
				'scroll-bar': '0.5rem',
				header: '5.5rem',
				'side-bar': '18rem'
			},
			backgroundColor: ({ colors }) => ({
				'schedule-pending': colors.orange[100],
				'schedule-confirmed': colors.green[100],
				'schedule-done': colors.violet[100],
				'schedule-cancel': colors.neutral[200]
			}),
			borderColor: ({ colors }) => ({
				'schedule-pending': colors.orange[400],
				'schedule-confirmed': colors.green[400],
				'schedule-done': colors.violet[400],
				'schedule-cancel': colors.neutral[400]
			}),
			textColor: ({ colors }) => ({
				'schedule-pending': colors.orange[600],
				'schedule-confirmed': colors.green[600],
				'schedule-done': colors.violet[600],
				'schedule-cancel': colors.neutral[600]
			})
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
