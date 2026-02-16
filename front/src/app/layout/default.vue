<script setup lang="ts">
import { Sidebar, Footer } from '@/widgets'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/shared/ui/sidebar'
import { RouterView } from 'vue-router'
import { ThemeToggle } from '@/shared/ui/theme-toggle'
</script>
<template>
  <SidebarProvider>
    <div class="flex min-h-screen w-full">
      <Sidebar />

      <SidebarInset>
        <header class="flex justify-between md:h-14 h-12 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger class="-ml-1" />
          <ThemeToggle />
        </header>
        <div class="flex flex-1 flex-col">
          <RouterView class="flex-1" />
          <Footer />
        </div>
      </SidebarInset>
    </div>
  </SidebarProvider>
</template>
