<script lang="ts" setup>
import type { ToasterProps } from "vue-sonner"
import { reactiveOmit, useColorMode } from "@vueuse/core"
import { computed } from "vue"
import {
  PhCheck,
  PhInfo,
  PhWarning,
  PhXCircle,
} from "@phosphor-icons/vue"
import { Toaster as Sonner } from "vue-sonner"
import "./sonner.css"

const props = withDefaults(defineProps<ToasterProps>(), {
  position: "bottom-right",
  closeButton: false,
  duration: 4500,
  visibleToasts: 4,
  expand: true,
  gap: 8,
  offset: "1.25rem",
})

const delegatedProps = reactiveOmit(props, "toastOptions", "theme")

const colorMode = useColorMode()
const theme = computed(() => (colorMode.value === "dark" ? "dark" : "light"))
</script>

<template>
  <Sonner
    class="toaster pointer-events-auto"
    :theme="theme"
    :toast-options="{
      unstyled: true,
      classes: {
        toast: 'sonner-toast',
        title: 'sonner-toast__title',
        description: 'sonner-toast__description',
        actionButton: 'sonner-toast__action',
        cancelButton: 'sonner-toast__cancel',
      },
    }"
    v-bind="delegatedProps"
  >
    <template #success-icon>
      <PhCheck class="sonner-toast__icon sonner-toast__icon--success" weight="bold" />
    </template>
    <template #info-icon>
      <PhInfo class="sonner-toast__icon sonner-toast__icon--info" weight="bold" />
    </template>
    <template #warning-icon>
      <PhWarning class="sonner-toast__icon sonner-toast__icon--warning" weight="bold" />
    </template>
    <template #error-icon>
      <PhXCircle class="sonner-toast__icon sonner-toast__icon--error" weight="bold" />
    </template>
    <template #loading-icon>
      <span class="sonner-toast__loader" aria-hidden="true" />
    </template>
  </Sonner>
</template>
