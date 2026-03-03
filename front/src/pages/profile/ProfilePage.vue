<script setup lang="ts">
import { computed, ref } from 'vue'
import { authStore } from '@/shared/store/auth.store'
import { authAPI } from '@/shared/api/auth.api'

const user = computed(() => authStore.user.value)

const firstName = ref(user.value?.firstName ?? '')
const lastName = ref(user.value?.lastName ?? '')
const birthDate = ref(user.value?.birthDate ?? '')
const sex = ref<'male' | 'female' | 'other' | ''>((user.value?.sex as any) ?? '')
const avatarUrl = ref(user.value?.avatarUrl ?? '')

const isSaving = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

const onSubmit = async () => {
  if (!user.value) return

  isSaving.value = true
  error.value = null
  success.value = false

  try {
    const updated = await authAPI.updateProfile({
      firstName: firstName.value || undefined,
      lastName: lastName.value || undefined,
      birthDate: birthDate.value || undefined,
      sex: (sex.value as any) || undefined,
      avatarUrl: avatarUrl.value || undefined,
    })

    authStore.setUser(updated)
    success.value = true
  } catch (e: any) {
    error.value = e?.message || 'Failed to update profile'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="max-w-xl mx-auto py-8 px-4 space-y-6">
    <h1 class="text-2xl font-semibold">Profile</h1>

    <form class="space-y-4" @submit.prevent="onSubmit">
      <div class="space-y-1">
        <label class="block text-sm font-medium text-muted-foreground">Avatar URL</label>
        <input
          v-model="avatarUrl"
          type="url"
          class="w-full border border-border rounded-md px-3 py-2 bg-background"
          placeholder="https://..."
        />
        <div v-if="avatarUrl" class="mt-2">
          <img
            :src="avatarUrl"
            alt="Avatar preview"
            class="w-20 h-20 rounded-full object-cover border border-border"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-muted-foreground">First Name</label>
          <input
            v-model="firstName"
            type="text"
            class="w-full border border-border rounded-md px-3 py-2 bg-background"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-muted-foreground">Last Name</label>
          <input
            v-model="lastName"
            type="text"
            class="w-full border border-border rounded-md px-3 py-2 bg-background"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-muted-foreground">Birth Date</label>
          <input
            v-model="birthDate"
            type="date"
            class="w-full border border-border rounded-md px-3 py-2 bg-background"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-muted-foreground">Sex</label>
          <select
            v-model="sex"
            class="w-full border border-border rounded-md px-3 py-2 bg-background"
          >
            <option value="">Not specified</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div class="pt-2 flex items-center gap-4">
        <button
          type="submit"
          class="inline-flex items-center justify-center px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          :disabled="isSaving"
        >
          {{ isSaving ? 'Saving...' : 'Save changes' }}
        </button>

        <span v-if="success" class="text-sm text-emerald-500">Saved</span>
        <span v-if="error" class="text-sm text-destructive">{{ error }}</span>
      </div>
    </form>
  </div>
</template>
