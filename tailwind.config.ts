import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  plugins: [],
  theme: {
    extend: {
      animation: {
        'move-bottom-up': 'move-bottom-up 3s linear forwards',
        'slide-in-bottom': 'slide-in-bottom 0.3s ease forwards',
        'slide-in-left': 'slide-in-left 0.3s ease forwards',
        'slide-out-left': 'slide-out-left 0.3s ease forwards',
      },
      backgroundColor: {
        'black-75': 'rgba(0, 0, 0, 0.75)',
      },
      backgroundImage: {
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      colors: {
        'black-87': 'rgba(0, 0, 0, 0.87)',
        'custom-gray': '#1F1F1F',
      },
      fontFamily: {
        googleSans: ['Google Sans', 'Google Sans Text', 'Roboto', 'Arial', 'sans-serif'],
      },
      fontSize: {
        '1.5xl': ['22px', '30px'],
        '4.5xl': ['44px', '1'],
      },
      keyframes: {
        'move-bottom-up': {
          '0%': {
            opacity: '1',
            transform: 'translateY(100%)',
          },

          '100%': {
            opacity: '0',
            transform: 'translateY(-520%)',
          },
          '70%': {
            opacity: '1',
            transform: 'translateY(-355%)',
          },
          '80%': {
            opacity: '0.8',
            transform: 'translateY(-420%)',
          },
        },

        'slide-in-bottom': {
          '0%': {
            transform: 'scaleY(0)',
          },
          '100%': {
            transform: 'scaleY(1)',
          },
        },

        'slide-in-left': {
          '0%': {
            transform: 'scaleX(0)',
          },
          '100%': {
            transform: 'scaleX(1)',
          },
        },

        'slide-out-left': {
          '0%': {
            transform: 'scaleX(1)',
          },
          '100%': {
            transform: 'scaleX(0)',
          },
        },
      },
      screens: { '2xl': { max: '1535px' }, lg: { max: '1023px' }, md: { max: '800px' }, sm: { max: '480px' }, 'sm-md': { max: '600px' }, xl: { max: '1279px' }, },
      transformOrigin: {
        'top-right': '100% 0%',
      },
      width: {
        'deviceSelectBox-sm': 'calc(100vw - 160px) !important',
        'deviceSelectBox-sm-md': 'calc(100vw - 320px)',
        'settingContent-md': 'calc(100vw - 112px)',
      },
    },
  },
};
export default config;
