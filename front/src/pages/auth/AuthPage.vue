<script setup lang="ts">
import { ref } from "vue";
import { Login, Register } from "@/features/auth";

const activeTab = ref<"login" | "register">("login");
</script>

<template>
  <div class="auth-page flex items-center justify-center h-full">
    <Login
      v-if="activeTab === 'login'"
      class="auth-page__form auth-page__form--login"
      @register="activeTab = 'register'"
    />
    <Register
      v-if="activeTab === 'register'"
      class="auth-page__form auth-page__form--register"
      @login="activeTab = 'login'"
    />
  </div>
</template>
