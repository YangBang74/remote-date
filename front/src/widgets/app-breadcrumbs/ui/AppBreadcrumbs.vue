<script setup lang="ts">
import { RouterLink } from "vue-router"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/ui/breadcrumb"
import { useAppBreadcrumbs } from "../model/use-app-breadcrumbs"

const { items } = useAppBreadcrumbs()
</script>

<template>
  <Breadcrumb class="app-breadcrumbs min-w-0">
    <BreadcrumbList class="app-breadcrumbs__list">
      <template v-for="(item, index) in items" :key="`${item.label}-${index}`">
        <BreadcrumbItem class="app-breadcrumbs__item">
          <BreadcrumbPage v-if="!item.to" class="app-breadcrumbs__page truncate">
            {{ item.label }}
          </BreadcrumbPage>
          <BreadcrumbLink v-else as-child class="app-breadcrumbs__link truncate">
            <RouterLink :to="item.to">{{ item.label }}</RouterLink>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator
          v-if="index < items.length - 1"
          class="app-breadcrumbs__separator"
        />
      </template>
    </BreadcrumbList>
  </Breadcrumb>
</template>
