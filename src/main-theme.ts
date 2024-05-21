import type { CustomThemeConfig } from '@skeletonlabs/tw-plugin';

export const mainTheme: CustomThemeConfig = {
	name: 'main-theme',
	properties: {
		// =~= Theme Properties =~=
		'--theme-font-family-base': `Inter`,
		'--theme-font-family-heading': `Inter`,
		'--theme-font-color-base': '0 0 0',
		'--theme-font-color-dark': '255 255 255',
		'--theme-rounded-base': '9999px',
		'--theme-rounded-container': '8px',
		'--theme-border-base': '1px',
		// =~= Theme On-X Colors =~=
		'--on-primary': '255 255 255',
		'--on-secondary': '255 255 255',
		'--on-tertiary': '255 255 255',
		'--on-success': '255 255 255',
		'--on-warning': '255 255 255',
		'--on-error': '255 255 255',
		'--on-surface': '255 255 255',
		// =~= Theme Colors  =~=
		// primary | #007bff
		'--color-primary-50': '217 235 255', // #d9ebff
		'--color-primary-100': '204 229 255', // #cce5ff
		'--color-primary-200': '191 222 255', // #bfdeff
		'--color-primary-300': '153 202 255', // #99caff
		'--color-primary-400': '77 163 255', // #4da3ff
		'--color-primary-500': '0 123 255', // #007bff
		'--color-primary-600': '0 111 230', // #006fe6
		'--color-primary-700': '0 92 191', // #005cbf
		'--color-primary-800': '0 74 153', // #004a99
		'--color-primary-900': '0 60 125', // #003c7d
		// secondary | #00b63e
		'--color-secondary-50': '217 244 226', // #d9f4e2
		'--color-secondary-100': '204 240 216', // #ccf0d8
		'--color-secondary-200': '191 237 207', // #bfedcf
		'--color-secondary-300': '153 226 178', // #99e2b2
		'--color-secondary-400': '77 204 120', // #4dcc78
		'--color-secondary-500': '0 182 62', // #00b63e
		'--color-secondary-600': '0 164 56', // #00a438
		'--color-secondary-700': '0 137 47', // #00892f
		'--color-secondary-800': '0 109 37', // #006d25
		'--color-secondary-900': '0 89 30', // #00591e
		// tertiary | #17a2b8
		'--color-tertiary-50': '220 241 244', // #dcf1f4
		'--color-tertiary-100': '209 236 241', // #d1ecf1
		'--color-tertiary-200': '197 232 237', // #c5e8ed
		'--color-tertiary-300': '162 218 227', // #a2dae3
		'--color-tertiary-400': '93 190 205', // #5dbecd
		'--color-tertiary-500': '23 162 184', // #17a2b8
		'--color-tertiary-600': '21 146 166', // #1592a6
		'--color-tertiary-700': '17 122 138', // #117a8a
		'--color-tertiary-800': '14 97 110', // #0e616e
		'--color-tertiary-900': '11 79 90', // #0b4f5a
		// success | #28a745
		'--color-success-50': '223 242 227', // #dff2e3
		'--color-success-100': '212 237 218', // #d4edda
		'--color-success-200': '201 233 209', // #c9e9d1
		'--color-success-300': '169 220 181', // #a9dcb5
		'--color-success-400': '105 193 125', // #69c17d
		'--color-success-500': '40 167 69', // #28a745
		'--color-success-600': '36 150 62', // #24963e
		'--color-success-700': '30 125 52', // #1e7d34
		'--color-success-800': '24 100 41', // #186429
		'--color-success-900': '20 82 34', // #145222
		// warning | #ff8800
		'--color-warning-50': '255 237 217', // #ffedd9
		'--color-warning-100': '255 231 204', // #ffe7cc
		'--color-warning-200': '255 225 191', // #ffe1bf
		'--color-warning-300': '255 207 153', // #ffcf99
		'--color-warning-400': '255 172 77', // #ffac4d
		'--color-warning-500': '255 136 0', // #ff8800
		'--color-warning-600': '230 122 0', // #e67a00
		'--color-warning-700': '191 102 0', // #bf6600
		'--color-warning-800': '153 82 0', // #995200
		'--color-warning-900': '125 67 0', // #7d4300
		// error | #dc3545
		'--color-error-50': '250 225 227', // #fae1e3
		'--color-error-100': '248 215 218', // #f8d7da
		'--color-error-200': '246 205 209', // #f6cdd1
		'--color-error-300': '241 174 181', // #f1aeb5
		'--color-error-400': '231 114 125', // #e7727d
		'--color-error-500': '220 53 69', // #dc3545
		'--color-error-600': '198 48 62', // #c6303e
		'--color-error-700': '165 40 52', // #a52834
		'--color-error-800': '132 32 41', // #842029
		'--color-error-900': '108 26 34', // #6c1a22
		// surface | #575966
		'--color-surface-50': '230 230 232', // #e6e6e8
		'--color-surface-100': '221 222 224', // #dddee0
		'--color-surface-200': '213 214 217', // #d5d6d9
		'--color-surface-300': '188 189 194', // #bcbdc2
		'--color-surface-400': '137 139 148', // #898b94
		'--color-surface-500': '87 89 102', // #575966
		'--color-surface-600': '78 80 92', // #4e505c
		'--color-surface-700': '65 67 77', // #41434d
		'--color-surface-800': '52 53 61', // #34353d
		'--color-surface-900': '43 44 50' // #2b2c32
	}
};
