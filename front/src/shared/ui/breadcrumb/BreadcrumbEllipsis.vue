<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { PhDotsThree } from "@phosphor-icons/vue"
import { cn } from "@/shared/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <span
    role="presentation"
    aria-hidden="true"
    :class="cn('flex size-9 items-center justify-center', props.class)"
  >
    <PhDotsThree class="size-4" />
    <span class="sr-only">More</span>
  </span>
</template>
