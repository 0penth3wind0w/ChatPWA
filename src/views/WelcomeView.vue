<script setup>
const emit = defineEmits(['navigate'])

const handleGetStarted = () => {
  emit('navigate', 'settings')
}
</script>

<template>
  <div class="min-h-screen w-full flex flex-col bg-bg-primary">
    <!-- Status Bar (iOS-style) -->
    <div class="flex items-center justify-between w-full h-[62px] px-6">
      <span class="text-[17px] font-semibold">9:41</span>
      <div class="flex items-center gap-1.5">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M2 11h5v2H2zm15 0h5v2h-5zm-6 6h2v5h-2zm0-13h2v5h-2zM4.222 5.636l1.414-1.414 3.536 3.536-1.414 1.414zm15.556 12.728l-1.414 1.414-3.536-3.536 1.414-1.414zm-12.02-1.414l-3.536 3.536-1.414-1.414 3.536-3.536zM19.778 7.05l-1.414-1.414-3.536 3.536 1.414 1.414z"/>
        </svg>
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
        </svg>
        <svg class="w-6 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/>
        </svg>
      </div>
    </div>

    <!-- Content Wrapper -->
    <div class="flex-1 flex flex-col items-center px-6 pt-15 gap-10">
      <!-- Logo -->
      <div class="w-20 h-20 bg-forest-green rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(61,138,90,0.25)]">
        <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
        </svg>
      </div>

      <!-- Welcome Content -->
      <div class="flex flex-col items-center gap-3 w-full">
        <h1 class="text-3xl font-bold text-text-primary -tracking-wide text-center">
          Welcome to ChatPWA
        </h1>
        <p class="text-base text-text-secondary text-center leading-relaxed max-w-[280px]">
          Connect to any AI model with your custom API endpoint
        </p>
      </div>

      <!-- Features Card -->
      <div class="card w-full">
        <!-- Feature 1 -->
        <div class="flex items-start gap-4 w-full">
          <div class="w-10 h-10 bg-light-green rounded-full flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-forest-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <div class="flex flex-col gap-1 flex-1">
            <p class="text-base font-semibold text-text-primary">
              Custom API Endpoints
            </p>
            <p class="text-sm text-text-tertiary leading-relaxed">
              Use any AI provider or self-hosted model
            </p>
          </div>
        </div>

        <div class="w-full h-px bg-border-subtle my-5"></div>

        <!-- Feature 2 -->
        <div class="flex items-start gap-4 w-full">
          <div class="w-10 h-10 bg-light-green rounded-full flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-forest-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <div class="flex flex-col gap-1 flex-1">
            <p class="text-base font-semibold text-text-primary">
              Secure & Private
            </p>
            <p class="text-sm text-text-tertiary leading-relaxed">
              Your data stays on your device
            </p>
          </div>
        </div>

        <div class="w-full h-px bg-border-subtle my-5"></div>

        <!-- Feature 3 -->
        <div class="flex items-start gap-4 w-full">
          <div class="w-10 h-10 bg-light-green rounded-full flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-forest-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
          </div>
          <div class="flex flex-col gap-1 flex-1">
            <p class="text-base font-semibold text-text-primary">
              Works Offline
            </p>
            <p class="text-sm text-text-tertiary leading-relaxed">
              Install as a PWA for offline access
            </p>
          </div>
        </div>
      </div>

      <!-- Get Started Button -->
      <button
        @click="handleGetStarted"
        class="btn-primary w-full h-13 shadow-elevated"
      >
        Get Started
      </button>
    </div>
  </div>
</template>
