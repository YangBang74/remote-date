<script setup lang="ts">
import { computed } from "vue";
import { useRoute, RouterLink } from "vue-router";
import {
  Home,
  BarChart,
  Settings,
  Users,
  MessageCircle,
} from "lucide-vue-next";
import YouTubeIcon from "@/shared/ui/icons/YouTubeIcon.vue";
import SoundCloudIcon from "@/shared/ui/icons/SoundCloudIcon.vue";
import { cn } from "@/shared/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/shared/ui/sidebar";
import { Avatar, AvatarImage, AvatarFallback } from "@/shared/ui/avatar";
import { authStore } from "@/shared/store/auth.store";

const { state } = useSidebar();
const route = useRoute();

const isCollapsed = computed(() => state.value === "collapsed");

const navButtonClass =
  "rounded-lg text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground data-[active=true]:bg-foreground/[0.07] data-[active=true]:text-foreground data-[active=true]:font-medium data-[active=true]:shadow-none group-data-[collapsible=icon]:justify-center";

function isNavActive(url: string): boolean {
  const path = route.path;

  if (url === "/") return path === "/";
  if (url === "/youtube")
    return path === "/youtube" || path.startsWith("/room/");
  if (url === "/soundcloud")
    return path === "/soundcloud" || path.startsWith("/sound-room/");

  return path === url || path.startsWith(`${url}/`);
}

const user = authStore.user;

const displayName = computed(() => {
  if (!user.value) return "Guest";
  if (user.value.firstName && user.value.lastName) {
    return `${user.value.firstName} ${user.value.lastName}`;
  }
  return user.value.email;
});

const avatarInitials = computed(() => {
  if (!user.value) return "G";
  if (user.value.firstName && user.value.lastName) {
    return `${user.value.firstName[0]}${user.value.lastName[0]}`.toUpperCase();
  }
  return user.value.email?.[0]?.toUpperCase() || "";
});

const mainItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "YouTube", url: "/youtube", icon: YouTubeIcon },
  { title: "SoundCloud", url: "/soundcloud", icon: SoundCloudIcon },
];

const secondaryItems = [
  { title: "Friends", url: "/friends", icon: Users },
  { title: "Messages", url: "/messages", icon: MessageCircle },
  { title: "Statistics", url: "/statistics", icon: BarChart },
  { title: "Settings", url: "/settings", icon: Settings },
];
</script>

<template>
  <Sidebar
    collapsible="icon"
    variant="sidebar"
    class="border-none bg-transparent shadow-none"
  >
    <div
      class="flex h-full min-w-0 flex-col overflow-x-hidden"
      :class="isCollapsed && 'sidebar-collapsed'"
    >
      <SidebarHeader
        :class="
          cn('border-0', isCollapsed ? 'items-center px-0 py-3' : 'px-3 py-4')
        "
      >
        <RouterLink
          to="/"
          :class="
            cn(
              'flex items-center rounded-lg text-foreground transition-opacity hover:opacity-80',
              isCollapsed ? 'justify-center' : 'gap-2.5 px-1 py-1',
            )
          "
        >
          <span
            :class="
              cn(
                'flex shrink-0 items-center justify-center rounded-lg bg-foreground font-semibold tracking-tight text-background',
                isCollapsed ? 'size-9 text-xs' : 'size-8 text-[11px]',
              )
            "
          >
            R
          </span>
          <span
            v-if="!isCollapsed"
            class="truncate text-sm font-semibold tracking-tight"
          >
            Remote
          </span>
        </RouterLink>
      </SidebarHeader>

      <SidebarContent
        :class="isCollapsed ? 'gap-1 overflow-x-hidden px-1.5' : 'gap-0 px-2'"
      >
        <SidebarGroup class="py-0">
          <SidebarGroupContent class="overflow-x-hidden">
            <SidebarMenu :class="isCollapsed ? 'gap-1.5' : 'gap-1'">
              <SidebarMenuItem v-for="item in mainItems" :key="item.title">
                <SidebarMenuButton
                  as-child
                  :tooltip="item.title"
                  :is-active="isNavActive(item.url)"
                  :class="navButtonClass"
                >
                  <RouterLink
                    :to="item.url"
                    :class="
                      cn(
                        'flex items-center',
                        isCollapsed ? 'justify-center' : 'gap-2',
                      )
                    "
                  >
                    <component
                      :is="item.icon"
                      class="size-[18px] shrink-0 opacity-80"
                    />
                    <span v-if="!isCollapsed">{{ item.title }}</span>
                  </RouterLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator v-if="!isCollapsed" class="my-3 bg-border/60" />

        <SidebarGroup class="py-0">
          <SidebarGroupContent>
            <SidebarMenu :class="isCollapsed ? 'gap-1.5' : 'gap-1'">
              <SidebarMenuItem v-for="item in secondaryItems" :key="item.title">
                <SidebarMenuButton
                  as-child
                  :tooltip="item.title"
                  :is-active="isNavActive(item.url)"
                  :class="navButtonClass"
                >
                  <RouterLink
                    :to="item.url"
                    :class="
                      cn(
                        'flex items-center',
                        isCollapsed ? 'justify-center' : 'gap-2',
                      )
                    "
                  >
                    <component
                      :is="item.icon"
                      class="size-[18px] shrink-0 opacity-70"
                    />
                    <span v-if="!isCollapsed">{{ item.title }}</span>
                  </RouterLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter
        :class="
          isCollapsed ? 'border-0 overflow-x-hidden p-1.5' : 'border-0 p-2 pt-0'
        "
      >
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              as-child
              tooltip="Profile"
              :is-active="isNavActive('/profile')"
              :class="navButtonClass"
            >
              <RouterLink
                to="/profile"
                :class="
                  cn(
                    'flex items-center',
                    isCollapsed ? 'justify-center' : 'gap-2.5',
                  )
                "
              >
                <Avatar :class="isCollapsed ? 'size-9' : 'size-7'">
                  <AvatarImage :src="user?.avatarUrl || ''" />
                  <AvatarFallback
                    class="bg-foreground/10 text-[11px] font-medium text-foreground"
                  >
                    {{ avatarInitials }}
                  </AvatarFallback>
                </Avatar>
                <div
                  v-if="!isCollapsed"
                  class="min-w-0 flex-1 text-left leading-tight"
                >
                  <p class="truncate text-sm font-medium text-foreground">
                    {{ displayName }}
                  </p>
                  <p class="truncate text-xs text-muted-foreground">
                    {{ user?.email }}
                  </p>
                </div>
              </RouterLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </div>
  </Sidebar>
</template>

<style scoped>
.sidebar-collapsed :deep([data-sidebar="menu-button"]) {
  width: 2.5rem;
  height: 2.5rem;
  min-width: 2.5rem;
  padding: 0;
  margin-inline: auto;
}

.sidebar-collapsed :deep([data-sidebar="menu-item"]) {
  display: flex;
  justify-content: center;
  overflow: hidden;
}

.sidebar-collapsed :deep([data-sidebar="menu"]) {
  overflow-x: hidden;
}
</style>
