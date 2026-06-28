<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { PhCaretRight } from "@phosphor-icons/vue"
import { cn } from "@/shared/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <li
    role="presentation"
    aria-hidden="true"
    :class="cn('[&>svg]:size-3.5', props.class)"
  >
    <slot>
      <PhCaretRight />
    </slot>
  </li>
</template>
