<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import type { ChatMessage } from '@/shared/api/chat.types'
import { Plus } from 'lucide-vue-next'

type UiChatMessage = ChatMessage & {
  isOwn?: boolean
  imageUrl?: string
}

const props = defineProps<{
  messages: UiChatMessage[]
  newMessage: string
  loading?: boolean
  currentUserName?: string | null
}>()

const emit = defineEmits<{
  (e: 'update:newMessage', value: string): void
  (e: 'send'): void
  (e: 'playTrack', url: string): void
  (e: 'sendFile', file: File): void
}>()

const sortedMessages = computed(() =>
  [...props.messages].sort((a, b) => a.time - b.time)
)

const messagesContainer = ref<HTMLElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const scrollToBottom = () => {
  const el = messagesContainer.value
  if (!el) return
  el.scrollTop = el.scrollHeight
}

const openFileDialog = () => {
  fileInput.value?.click()
}

watch(
  sortedMessages,
  async () => {
    await nextTick()
    scrollToBottom()
  },
  { deep: true }
)
</script>

<template>
  <Card class="h-full flex flex-col gap-2">
    <CardHeader class="pb-3">
      <CardTitle class="text-base">Chat</CardTitle>
    </CardHeader>
    <CardContent class="flex-1 flex flex-col gap-2 pt-0">
      <!-- Messages -->
      <div
        ref="messagesContainer"
        class="flex-1 overflow-y-auto border rounded-md p-2 space-y-2 text-sm bg-muted/30 h-full max-h-80! md:max-h-96!"
      >
        <div
          v-if="!sortedMessages.length && !loading"
          class="text-xs text-muted-foreground text-center mt-4"
        >
          No messages yet. Start the conversation!
        </div>

        <div
          v-for="(msg, idx) in sortedMessages"
          :key="idx"
          class="flex flex-col max-w-[85%]"
          :class="
            msg.author && props.currentUserName && msg.author === props.currentUserName
              ? 'ml-auto items-end'
              : 'mr-auto items-start'
          "
        >

          <div
            class="px-3 py-2 rounded-2xl text-sm wrap-break-word"
            :class="
              msg.author && props.currentUserName && msg.author === props.currentUserName
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-background border rounded-bl-sm'
            "
          >
          <div class="text-[11px] text-muted-foreground mb-0.5">
            {{ msg.author }}
          </div>
            <p>{{ msg.text }}</p>

            <button
              v-if="msg.trackUrl"
              class="mt-1 inline-flex items-center gap-1 text-xs text-blue-500 hover:underline"
              type="button"
              @click="emit('playTrack', msg.trackUrl!)"
            >
              ▶ Play track
            </button>

            <div
              v-if="msg.imageUrl"
              class="mt-2 max-w-[220px] rounded-lg overflow-hidden border cursor-pointer"
            >
              <img
                :src="msg.imageUrl"
                alt="attachment"
                class="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="flex items-center gap-2 pt-1">
        <input
          :value="newMessage"
          type="text"
          class="flex-1 px-3 py-2 border rounded-md text-sm"
          placeholder="Message, link to track, or image URL"
          @input="emit('update:newMessage', ($event.target as HTMLInputElement).value)"
          @keyup.enter="emit('send')"
        />
        <Button
          size="icon"
          variant="outline"
          class="hidden sm:inline-flex"
          @click="openFileDialog"
        >
          <Plus />
        </Button>
        <Button size="sm" @click="emit('send')">
          Send
        </Button>
      </div>
      <input
        ref="fileInput"
        type="file"
        accept="image/*,audio/*"
        class="hidden"
        @change="
          (e) => {
            const input = e.target as HTMLInputElement
            const file = input.files?.[0]
            if (file) {
              emit('sendFile', file)
            }
            if (input) {
              input.value = ''
            }
          }
        "
      />
    </CardContent>
  </Card>
</template>

