// tailwindcss-rtl אינו מספק טיפוסים — הצהרת-מודול מינימלית.
declare module 'tailwindcss-rtl' {
  import type { PluginCreator } from 'tailwindcss/types/config';
  const plugin: PluginCreator;
  export default plugin;
}
