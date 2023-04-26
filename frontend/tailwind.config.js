module.exports = {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {},
    screens: {
      'sm': '640px',
      // => @media (min-width: 640px) { ... }

      'md': '768px',
      // => @media (min-width: 768px) { ... }

      'lg': '1024px',
      // => @media (min-width: 1024px) { ... }

      'xl': '1280px',
      // => @media (min-width: 1280px) { ... }

      '2xl': '1536px',
      // => @media (min-width: 1536px) { ... }

      'm2xl': {'max': '1535px'},
      // => @media (max-width: 1535px) { ... }

      'mxl': {'max': '1279px'},
      // => @media (max-width: 1279px) { ... }

      'mlg': {'max': '1023px'},
      // => @media (max-width: 1023px) { ... }

      'mmd': {'max': '767px'},
      // => @media (max-width: 767px) { ... }

      'msm': {'max': '639px'}
      // => @media (max-width: 639px) { ... }
  }
  },
  plugins: [
    require('daisyui'),
  ],
};
