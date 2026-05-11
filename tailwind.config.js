/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './_layouts/**/*.html',
    './_includes/**/*.html',
    './_chapters/*.md',
    './_landing/*.md',
    './pages/**/*.{html,md}',
    './*.{html,md}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#ede6d4',
        ink: '#121212',
        clay: '#d6cdb7',
        mist: '#525252',
        accent: '#3d4b40',
      },
      fontFamily: {
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        prose: '65ch',
      },
      keyframes: {
        drift: {
          '0%, 100%': { transform: 'translate(0,0)' },
          '50%': { transform: 'translate(1%, -1%)' },
        },
        'page-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        reveal: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        drift: 'drift 25s ease-in-out infinite',
        'page-in': 'page-in 1.4s cubic-bezier(0.16,1,0.3,1) both',
        reveal: 'reveal 0.8s cubic-bezier(0.16,1,0.3,1) both',
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': theme('colors.ink'),
            '--tw-prose-headings': theme('colors.ink'),
            '--tw-prose-lead': theme('colors.mist'),
            '--tw-prose-links': theme('colors.accent'),
            '--tw-prose-bold': theme('colors.ink'),
            '--tw-prose-counters': theme('colors.mist'),
            '--tw-prose-bullets': theme('colors.clay'),
            '--tw-prose-hr': theme('colors.clay'),
            '--tw-prose-quotes': theme('colors.ink'),
            '--tw-prose-quote-borders': theme('colors.accent'),
            '--tw-prose-captions': theme('colors.mist'),
            '--tw-prose-code': theme('colors.ink'),
            '--tw-prose-pre-code': theme('colors.canvas'),
            '--tw-prose-pre-bg': theme('colors.ink'),
            '--tw-prose-th-borders': theme('colors.clay'),
            '--tw-prose-td-borders': theme('colors.clay'),
            fontFamily: theme('fontFamily.sans').join(', '),
            h1: { fontFamily: theme('fontFamily.display').join(', '), fontWeight: '300' },
            h2: { fontFamily: theme('fontFamily.display').join(', '), fontWeight: '400' },
            h3: { fontFamily: theme('fontFamily.display').join(', '), fontWeight: '500' },
            h4: { fontFamily: theme('fontFamily.display').join(', '), fontWeight: '600' },
            a: { textUnderlineOffset: '0.15em' },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
