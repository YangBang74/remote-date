<script setup lang="ts">
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { authStore } from '@/entities/user'
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
    toast.success('Profile saved')
  } catch (e: any) {
    const message = e?.message || 'Failed to update profile'
    error.value = message
    toast.error(message)
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="profile-page max-w-xl mx-auto py-8 px-4 space-y-6">
    <h1 class="profile-page__title text-2xl font-semibold">Profile</h1>

    <form class="profile-page__form space-y-4" @submit.prevent="onSubmit">
      <div class="profile-page__field profile-page__field--avatar space-y-1">
        <label class="profile-page__label block text-sm font-medium text-muted-foreground">Avatar URL</label>
        <input
          v-model="avatarUrl"
          class="profile-page__input profile-page__input--avatar w-full border border-border rounded-md px-3 py-2 bg-background"
          type="url"
          placeholder="https://..."
        />
        <div v-if="avatarUrl" class="profile-page__avatar-preview mt-2">
          <img
            :src="avatarUrl"
            alt="Avatar preview"
            class="profile-page__avatar-image w-20 h-20 rounded-full object-cover border border-border"
          />
        </div>
      </div>

      <div class="profile-page__row profile-page__row--name grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="profile-page__field profile-page__field--first-name">
          <label class="profile-page__label block text-sm font-medium text-muted-foreground">First Name</label>
          <input
            v-model="firstName"
            class="profile-page__input profile-page__input--first-name w-full border border-border rounded-md px-3 py-2 bg-background"
            type="text"
          />
        </div>
        <div class="profile-page__field profile-page__field--last-name">
          <label class="profile-page__label block text-sm font-medium text-muted-foreground">Last Name</label>
          <input
            v-model="lastName"
            class="profile-page__input profile-page__input--last-name w-full border border-border rounded-md px-3 py-2 bg-background"
            type="text"
          />
        </div>
      </div>

      <div class="profile-page__row profile-page__row--details grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="profile-page__field profile-page__field--birth-date">
          <label class="profile-page__label block text-sm font-medium text-muted-foreground">Birth Date</label>
          <input
            v-model="birthDate"
            class="profile-page__input profile-page__input--birth-date w-full border border-border rounded-md px-3 py-2 bg-background"
            type="date"
          />
        </div>
        <div class="profile-page__field profile-page__field--sex">
          <label class="profile-page__label block text-sm font-medium text-muted-foreground">Sex</label>
          <select
            v-model="sex"
            class="profile-page__select profile-page__select--sex w-full border border-border rounded-md px-3 py-2 bg-background"
          >
            <option value="">Not specified</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div class="profile-page__actions pt-2 flex items-center gap-4">
        <button
          type="submit"
          class="profile-page__submit inline-flex items-center justify-center px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          :disabled="isSaving"
        >
          {{ isSaving ? 'Saving...' : 'Save changes' }}
        </button>

        <span v-if="success" class="profile-page__success text-sm text-emerald-500">Saved</span>
        <span v-if="error" class="profile-page__error text-sm text-destructive">{{ error }}</span>
      </div>
    </form>
  </div>
</template>
