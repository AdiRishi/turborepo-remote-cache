import { defineComponents } from 'blume';

import HomeHero from './components/HomeHero.astro';
import HomeSection from './components/HomeSection.astro';
import HomeSpecs from './components/HomeSpecs.astro';
import HomeStack from './components/HomeStack.astro';

export default defineComponents({
  mdx: {
    HomeHero,
    HomeSection,
    HomeSpecs,
    HomeStack,
  },
});
