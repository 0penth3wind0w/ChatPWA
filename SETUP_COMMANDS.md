# ChatPWA - Complete Setup Commands

This document contains all commands executed to set up the ChatPWA project from scratch. You can use these commands to recreate the entire project setup.

## Prerequisites

Ensure you have the following installed:
- Node.js 18+ (`node --version`)
- npm 9+ (`npm --version`)

## Step 1: Create Vue 3 + Vite Project

```bash
# Navigate to parent directory
cd /Users/yanlin_chen/0penth3wind0w

# Create Vue 3 project with Vite
npm create vite@latest ChatPWA -- --template vue

# Navigate into project directory
cd ChatPWA
```

**What this does:**
- Creates a new Vue 3 project using Vite
- Uses the official Vue template
- Sets up the basic project structure

## Step 2: Install Base Dependencies

```bash
# Install base dependencies
npm install
```

**What this does:**
- Installs Vue 3, Vite, and core dependencies from package.json

## Step 3: Install Tailwind CSS

```bash
# Install Tailwind CSS and its peer dependencies
npm install -D tailwindcss postcss autoprefixer

# Generate Tailwind and PostCSS config files
npx tailwindcss init -p
```

**What this does:**
- Installs Tailwind CSS as a dev dependency
- Installs PostCSS and Autoprefixer for CSS processing
- Creates `tailwind.config.js` and `postcss.config.js`

## Step 4: Install Additional Dependencies

```bash
# Install IndexedDB wrapper for chat history storage
npm install dexie

# Install Markdown rendering library
npm install marked

# Install syntax highlighting for code blocks
npm install highlight.js

# Install PWA plugin for Vite
npm install -D vite-plugin-pwa

# Install workbox for service worker (comes with vite-plugin-pwa)
# No separate install needed
```

**What this does:**
- `dexie`: Simplifies IndexedDB operations for storing chat history
- `marked`: Renders Markdown in AI responses
- `highlight.js`: Adds syntax highlighting to code blocks
- `vite-plugin-pwa`: Enables PWA features (service worker, manifest)

## Step 5: Configure Tailwind CSS

### 5.1 Update tailwind.config.js

```bash
# Open tailwind.config.js and replace its contents
# (See configuration below)
```

**tailwind.config.js:**
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        'bg-primary': '#F5F4F1',      // Warm cream
        'bg-surface': '#FFFFFF',       // White cards
        'bg-elevated': '#FAFAF8',      // Slightly warm white
        'bg-muted': '#EDECEA',         // Warm gray

        // Text
        'text-primary': '#1A1918',     // Headlines, primary content
        'text-secondary': '#6D6C6A',   // Body text, descriptions
        'text-tertiary': '#9C9B99',    // Labels, placeholders

        // Borders
        'border-subtle': '#E5E4E1',    // Card borders, dividers
        'border-strong': '#D1D0CD',    // Form controls

        // Accent colors
        'forest-green': '#3D8A5A',     // Primary green
        'light-green': '#C8F0D8',      // Progress backgrounds
        'dark-green': '#4D9B6A',       // Success states
        'warm-coral': '#D89575',       // Secondary accent
        'warm-red': '#D08068',         // Warnings
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
      },
      fontSize: {
        'xs': '12px',
        'sm': '13px',
        'base': '15px',
        'lg': '18px',
        'xl': '22px',
        '2xl': '26px',
        '3xl': '32px',
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',     // Inputs, buttons
        'lg': '16px',     // Cards
        'xl': '20px',
        'full': '100px',  // Circular buttons
      },
      boxShadow: {
        'soft': '0 2px 12px rgba(26, 25, 24, 0.08)',
        'elevated': '0 2px 8px rgba(26, 25, 24, 0.08)',
        'subtle': '0 1px 6px rgba(26, 25, 24, 0.08)',
      },
      spacing: {
        '18': '4.5rem',   // 72px
      },
    },
  },
  plugins: [],
}
```

### 5.2 Update src/assets/main.css

```bash
# Replace the contents of src/assets/main.css
```

**src/assets/main.css:**
```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply font-outfit text-base text-text-primary bg-bg-primary;
  }
}

@layer components {
  /* Button component */
  .btn-primary {
    @apply bg-forest-green text-white font-semibold rounded-md px-4 py-3 shadow-soft hover:bg-dark-green transition-colors;
  }

  /* Card component */
  .card {
    @apply bg-bg-surface rounded-lg shadow-soft p-5;
  }

  /* Input field */
  .input-field {
    @apply w-full h-12 bg-bg-elevated border border-border-subtle rounded-md px-4 text-base text-text-primary focus:border-forest-green focus:ring-2 focus:ring-forest-green focus:ring-opacity-20 outline-none transition-all;
  }
}
```

### 5.3 Update src/main.js

Ensure the CSS is imported:

```js
import { createApp } from 'vue'
import './assets/main.css'  // Make sure this line exists
import App from './App.vue'

createApp(App).mount('#app')
```

## Step 6: Create Project Structure

```bash
# Create necessary directories
mkdir -p src/components
mkdir -p src/views
mkdir -p src/composables
mkdir -p public/icons

# Create component files
touch src/components/ChatMessage.vue
touch src/components/MessageInput.vue
touch src/components/SettingsForm.vue
touch src/components/EmptyState.vue
touch src/components/AppHeader.vue

# Create view files
touch src/views/WelcomeView.vue
touch src/views/ChatView.vue
touch src/views/SettingsView.vue

# Create composable files
touch src/composables/useStorage.js
touch src/composables/useChat.js
touch src/composables/useApi.js

# Create PWA files
touch public/manifest.json
touch public/sw.js
```

**What this does:**
- Creates the complete folder structure
- Creates placeholder files for all components, views, and composables

## Step 7: Configure Vite for PWA

### 7.1 Update vite.config.js

```bash
# Open vite.config.js and replace its contents
```

**vite.config.js:**
```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'ChatPWA',
        short_name: 'ChatPWA',
        description: 'AI Chat PWA with custom endpoints',
        theme_color: '#3D8A5A',
        background_color: '#F5F4F1',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ]
})
```

## Step 8: Verify Installation

```bash
# Check installed packages
npm list --depth=0

# Expected output should include:
# - vue@^3.x.x
# - vite@^5.x.x
# - tailwindcss@^3.x.x
# - dexie@^3.x.x or ^4.x.x
# - marked@^11.x.x or ^12.x.x
# - highlight.js@^11.x.x
# - vite-plugin-pwa@^0.x.x
```

## Step 9: Test Development Server

```bash
# Start development server
npm run dev

# Server should start at http://localhost:5173
# You should see the default Vite + Vue page with Tailwind styles
```

## Step 10: Test Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Summary of Installed Packages

### Dependencies (Production)
```json
{
  "vue": "^3.4.0",
  "dexie": "^4.0.0",
  "marked": "^12.0.0",
  "highlight.js": "^11.9.0"
}
```

### Dev Dependencies
```json
{
  "@vitejs/plugin-vue": "^5.0.0",
  "vite": "^5.0.0",
  "tailwindcss": "^3.4.0",
  "postcss": "^8.4.0",
  "autoprefixer": "^10.4.0",
  "vite-plugin-pwa": "^0.19.0"
}
```

## Quick Setup Script (All-in-One)

If you want to run everything in one go, save this as `setup.sh`:

```bash
#!/bin/bash

# Navigate to parent directory
cd /Users/yanlin_chen/0penth3wind0w

# Create project
npm create vite@latest ChatPWA -- --template vue

# Enter directory
cd ChatPWA

# Install base dependencies
npm install

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install additional packages
npm install dexie marked highlight.js
npm install -D vite-plugin-pwa

# Create project structure
mkdir -p src/components src/views src/composables public/icons
touch src/components/{ChatMessage,MessageInput,SettingsForm,EmptyState,AppHeader}.vue
touch src/views/{WelcomeView,ChatView,SettingsView}.vue
touch src/composables/{useStorage,useChat,useApi}.js
touch public/{manifest.json,sw.js}

echo "✅ ChatPWA project setup complete!"
echo "Next steps:"
echo "1. Configure tailwind.config.js"
echo "2. Update src/assets/main.css"
echo "3. Update vite.config.js"
echo "4. Run 'npm run dev' to start development"
```

## Troubleshooting

### Issue: Tailwind styles not working
```bash
# Make sure Tailwind directives are in main.css
# Check that main.css is imported in main.js
# Restart dev server: Ctrl+C then npm run dev
```

### Issue: PWA not installing
```bash
# Build first: npm run build
# Preview: npm run preview
# PWA only works over HTTPS or localhost
```

### Issue: Module not found errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

After setup is complete:
1. Review UI mockup in `UI.pen` for design reference
2. Start implementing components based on `IMPLEMENTATION_PLAN.md`
3. Follow Phase 1-9 implementation plan
4. Test on mobile devices regularly

---

**Setup completed on:** [Date will be added when setup is run]
**Node version:** Run `node --version` to check
**npm version:** Run `npm --version` to check
