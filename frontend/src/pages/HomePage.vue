<template>
  <q-page v-if="user" class="home-page row no-wrap">
    <aside class="sidebar column">
      <div class="sidebar__header row items-center justify-between q-mb-sm">
        <span class="text-caption text-uppercase text-weight-medium">Channels</span>
        <q-btn
          dense
          flat
          round
          icon="add"
          color="primary"
          :disable="channelsLoading"
          @click="openCreateChannelDialog"
        />
      </div>

      <q-scroll-area class="sidebar__channels" :class="{ 'is-loading': channelsLoading }">
        <div v-if="channelsLoading" class="column items-center justify-center q-pa-md">
          <q-spinner size="24px" color="primary" />
        </div>

        <q-list v-else padding>
          <q-item
            v-for="channel in sortedChannels"
            :key="channel.id"
            clickable
            v-ripple
            :active="channel.id === selectedChannelId"
            active-class="bg-primary text-white"
            :class="{
              'channel--highlighted': channel.highlightedUntil,
              'channel--invited': channel.membershipStatus === 'invited'
            }"
            @click="selectChannel(channel.id)"
          >
            <q-item-section>
              <q-item-label class="text-body2 text-weight-medium">
                # {{ channel.name }}
              </q-item-label>
              <q-item-label caption>
                {{ channel.type === 'private' ? 'Private' : 'Public' }}
                <span v-if="channel.membershipStatus === 'invited'"> · invited</span>
              </q-item-label>
            </q-item-section>

            <q-item-section side top>
              <div class="column items-end q-gutter-xs">
                <q-badge
                  v-if="channel.membershipStatus === 'invited'"
                  color="orange-6"
                  text-color="white"
                  label="INVITED"
                  dense
                />
                <q-badge
                  v-else-if="channel.unreadCount > 0"
                  color="red-5"
                  text-color="white"
                  :label="channel.unreadCount"
                  dense
                />
                <div class="row items-center q-gutter-sm">
                  <q-btn
                    round
                    dense
                    flat
                    icon="group"
                    @click.stop="() => showMembers(channel)"
                  />
                  <q-btn
                    round
                    dense
                    flat
                    icon="logout"
                    @click.stop="() => leaveChannelViaMenu(channel)"
                  />
                </div>
              </div>
            </q-item-section>
          </q-item>
          <div v-if="sortedChannels.length === 0" class="text-caption text-grey-7 q-pa-md">
            No channels yet. Create one or ask a teammate to invite you.
          </div>
        </q-list>
      </q-scroll-area>

      <div class="sidebar__preferences column q-gutter-sm q-mt-lg">
        <q-select
          v-model="desiredStatus"
          :options="statusOptions"
          dense
          outlined
          emit-value
          map-options
          label="Presence"
        />

        <q-toggle
          v-model="mentionsOnlyPreference"
          label="Notify on mentions only"
          color="primary"
        />

        <q-btn
          dense
          flat
          icon="notifications"
          :color="notificationsEnabled ? 'primary' : 'grey-6'"
          :label="notificationsEnabled ? 'Notifications enabled' : 'Enable notifications'"
          @click="enableNotifications"
        />
      </div>

      <q-space />

      <q-btn
        class="q-mt-md"
        label="Log out"
        color="negative"
        icon="logout"
        unelevated
        @click="logout"
      />
    </aside>

    <section class="chat-area column">
      <div class="command-panel column q-pa-md">
        <q-input
          ref="commandInputRef"
          v-model="commandInput"
          dense
          outlined
          clearable
          placeholder="Run a command e.g. /join design private"
          @keyup.enter="runCommand"
        >
          <template #prepend>
            <q-icon name="terminal" />
          </template>
          <template #append>
            <q-btn flat dense icon="send" @click="runCommand" />
          </template>
        </q-input>

        <div
          v-if="commandMenuOpen && filteredCommands.length > 0"
          class="command-suggestions shadow-2"
        >
          <q-list dense bordered padding>
            <q-item
              v-for="option in filteredCommands"
              :key="option.command"
              clickable
              v-ripple
              @click="applyCommandSuggestion(option)"
            >
              <q-item-section>
                <q-item-label class="text-body2">
                  <span class="text-primary text-weight-medium">{{ option.command }}</span>
                  <span class="text-grey-7 q-ml-xs">{{ option.usage }}</span>
                </q-item-label>
                <q-item-label caption>{{ option.description }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </div>

      <q-separator />

      <div v-if="currentChannel" class="channel-header row items-center justify-between q-pa-md">
        <div class="column">
          <div class="text-h5 row items-center q-gutter-sm">
            <span># {{ currentChannel.name }}</span>
            <q-badge
              v-if="currentChannel.type === 'private'"
              color="grey-7"
              text-color="white"
              label="Private"
              dense
              rounded
            />
            <q-badge
              v-if="currentChannel.membershipStatus === 'invited'"
              color="orange-6"
              text-color="white"
              label="Pending invite"
              dense
              rounded
            />
          </div>
          <div class="text-caption text-grey-7">
            {{ currentChannel.members.length }} members · Owner: {{ ownerNickname }}
          </div>
        </div>

        <div class="typing-indicator row items-center q-gutter-xs">
          <q-chip
            v-for="typing in typingStates"
            :key="typing.userId"
            dense
            color="primary"
            text-color="white"
            clickable
            @click="openTypingPreview(typing)"
          >
            {{ typing.nickName }} is typing
          </q-chip>
          <div v-if="typingStates.length === 0" class="text-caption text-grey-7">
            {{ typingSummary }}
          </div>
        </div>
      </div>

      <div v-else class="column flex-center q-pa-xl text-grey-7">
        <q-icon name="chat_bubble_outline" size="48px" class="q-mb-md" />
        <div class="text-subtitle1">Select a channel to get started.</div>
      </div>

      <div v-if="currentChannel" class="chat-body column q-pa-md">
        <div
          ref="messagesContainerRef"
          class="messages-container column"
          @scroll.passive="handleMessageScroll"
        >
          <div v-if="messagesLoading" class="column items-center justify-center q-my-lg">
            <q-spinner color="primary" size="32px" />
          </div>

          <template v-else>
            <div
              v-if="messageNextCursor"
              class="text-caption text-grey-6 q-mb-md text-center cursor-pointer"
              @click="loadOlderMessages"
            >
              Load older messages
            </div>

            <div
              v-for="message in messages"
              :key="message.id"
              class="message-entry q-pa-sm q-mb-sm"
              :class="{
                'message-entry--mention': message.addressedTo === user.nickName,
                'message-entry--self': message.senderId === user.id
              }"
            >
              <div class="row items-baseline q-gutter-sm">
                <span class="text-weight-medium">{{ message.sender }}</span>
                <span class="text-caption text-grey-6">{{ formatTimestamp(message.createdAt) }}</span>
              </div>
              <div class="text-body2 q-mt-xs">
                <span v-if="message.addressedTo" class="text-primary text-weight-medium">
                  @{{ message.addressedTo }}
                </span>
                <span v-html="renderMessage(message.content)"></span>
              </div>
            </div>

            <div v-if="messages.length === 0" class="text-caption text-grey-6 text-center q-py-lg">
              Conversation is empty. Be the first one to send a message.
            </div>
          </template>
        </div>
      </div>

      <q-separator v-if="currentChannel" />

      <footer v-if="currentChannel" class="composer row items-center q-gutter-sm q-pa-md">
        <q-input
          class="col"
          v-model="messageDraft"
          dense
          filled
          autogrow
          placeholder="Message #{{ currentChannel.name }}"
          :disable="user.status === 'offline'"
          @keyup.enter="sendCurrentMessage"
        />
        <q-btn
          color="primary"
          unelevated
          round
          icon="send"
          :disable="messageDraft.trim().length === 0 || user.status === 'offline'"
          @click="sendCurrentMessage"
        />
      </footer>
    </section>
  </q-page>

  <q-page v-else class="home-page column items-center justify-center">
    <q-icon name="lock" size="48px" class="q-mb-md" color="primary" />
    <div class="text-h5 q-mb-sm">You need to be signed in</div>
    <div class="text-body2 text-grey-7 q-mb-lg">Access to channels is available after login.</div>
    <q-btn color="primary" label="Go to login" @click="goToLogin" />
  </q-page>

  <q-dialog v-model="createChannelDialog.open">
    <q-card style="min-width: 360px">
      <q-card-section>
        <div class="text-h6">Create channel</div>
        <div class="text-caption text-grey-7">Use /join under the hood to spin up a channel.</div>
      </q-card-section>
      <q-card-section class="column q-gutter-md">
        <q-input v-model="createChannelDialog.name" label="Channel name" dense outlined />
        <q-option-group
          v-model="createChannelDialog.type"
          :options="[
            { label: 'Public', value: 'public' },
            { label: 'Private', value: 'private' }
          ]"
          type="radio"
          dense
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Cancel" @click="closeCreateChannelDialog" />
        <q-btn
          label="Create"
          color="primary"
          :loading="createChannelDialog.loading"
          @click="createChannel"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="membersDialog.open">
    <q-card style="min-width: 320px; max-width: 420px">
      <q-card-section>
        <div class="text-h6">Channel members</div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-list bordered separator>
          <q-item v-for="member in membersDialog.members" :key="member.id">
            <q-item-section>
              <q-item-label class="text-body2">{{ member.nickName }}</q-item-label>
              <q-item-label caption>{{ member.firstName }} {{ member.lastName }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-badge
                color="primary"
                text-color="white"
                :label="member.role"
                class="text-uppercase"
              />
            </q-item-section>
          </q-item>
        </q-list>
        <div v-if="membersDialog.members.length === 0" class="text-caption text-grey-7 q-pt-sm">
          No members loaded.
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Close" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="typingPreviewDialog.open">
    <q-card style="min-width: 320px; max-width: 420px">
      <q-card-section>
        <div class="text-h6">{{ typingPreviewDialog.nickName }} is drafting</div>
      </q-card-section>
      <q-card-section>
        <q-banner dense class="bg-grey-3">
          <pre class="typing-preview">{{ typingPreviewDialog.content }}</pre>
        </q-banner>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Close" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import type {
  ChannelDto,
  ChannelMemberDto,
  CommandResultDto,
  MessageDto,
  TypingStateDto
} from '@vpwa/shared';

import {
  executeCommand,
  fetchChannels,
  fetchMessages,
  fetchTypingStates,
  leaveChannel,
  logoutUser,
  sendMessage,
  updateTypingState
} from 'src/services/api';
import { useSession } from 'src/services/session';

interface CommandOption {
  command: string;
  usage: string;
  description: string;
  requiresChannel?: boolean;
}

const commandPalette: CommandOption[] = [
  {
    command: '/join',
    usage: 'channel [private]',
    description: 'Join or create a channel (append "private" for private channels).'
  },
  {
    command: '/invite',
    usage: 'nickName',
    description: 'Invite a teammate to the active channel.',
    requiresChannel: true
  },
  {
    command: '/revoke',
    usage: 'nickName',
    description: 'Revoke access for a user in a private channel.',
    requiresChannel: true
  },
  {
    command: '/kick',
    usage: 'nickName',
    description: 'Vote to kick a member from the active public channel.',
    requiresChannel: true
  },
  {
    command: '/quit',
    usage: '',
    description: 'Close the current channel (owner only).',
    requiresChannel: true
  },
  {
    command: '/cancel',
    usage: '',
    description: 'Leave the active channel.',
    requiresChannel: true
  },
  {
    command: '/list',
    usage: '',
    description: 'List channel members.',
    requiresChannel: true
  },
  {
    command: '/status',
    usage: 'online|dnd|offline',
    description: 'Update your presence status.'
  },
  {
    command: '/notify',
    usage: 'all|mentions',
    description: 'Control when desktop notifications are sent.'
  },
  {
    command: '/help',
    usage: '',
    description: 'Display available commands.'
  }
];

const router = useRouter();
const $q = useQuasar();
const { user, setUser } = useSession();

const channels = ref<ChannelDto[]>([]);
const channelsLoading = ref(false);
const selectedChannelId = ref<string | null>(null);

const commandInput = ref('');
const commandInputRef = ref<{ focus: () => void } | null>(null);
const commandMenuOpen = ref(false);

const filteredCommands = computed(() => {
  if (!commandInput.value.startsWith('/')) {
    return [] as CommandOption[];
  }

  const query = commandInput.value.slice(1).toLowerCase();

  if (!query) {
    return commandPalette;
  }

  return commandPalette.filter((option) =>
    `${option.command} ${option.usage}`.toLowerCase().includes(query)
  );
});

const messages = ref<MessageDto[]>([]);
const messagesLoading = ref(false);
const messageNextCursor = ref<string | null>(null);
const loadingOlderMessages = ref(false);
const messagesContainerRef = ref<HTMLDivElement | null>(null);

const messageDraft = ref('');
const typingStates = ref<TypingStateDto[]>([]);

const typingPreviewDialog = reactive({
  open: false,
  content: '',
  nickName: ''
});

const membersDialog = reactive({
  open: false,
  members: [] as ChannelMemberDto[]
});

const createChannelDialog = reactive({
  open: false,
  name: '',
  type: 'public' as 'public' | 'private',
  loading: false
});

const statusOptions = [
  { label: 'Online', value: 'online' },
  { label: 'Do Not Disturb', value: 'dnd' },
  { label: 'Offline', value: 'offline' }
];

const desiredStatus = ref<'online' | 'dnd' | 'offline'>('online');
const mentionsOnlyPreference = ref(false);
let statusSyncing = false;
let notificationSyncing = false;

const notificationsSupported = typeof window !== 'undefined' && 'Notification' in window;

const sortedChannels = computed(() => {
  const sorted = [...channels.value];

  sorted.sort((a, b) => {
    const highlightA = a.highlightedUntil ? Date.parse(a.highlightedUntil) : 0;
    const highlightB = b.highlightedUntil ? Date.parse(b.highlightedUntil) : 0;

    if (highlightA !== highlightB) {
      return highlightB - highlightA;
    }

    const invitedA = a.membershipStatus === 'invited' ? 1 : 0;
    const invitedB = b.membershipStatus === 'invited' ? 1 : 0;

    if (invitedA !== invitedB) {
      return invitedB - invitedA;
    }

    const activityA = a.lastActivityAt ? Date.parse(a.lastActivityAt) : 0;
    const activityB = b.lastActivityAt ? Date.parse(b.lastActivityAt) : 0;

    return activityB - activityA;
  });

  return sorted;
});

const currentChannel = computed(() => {
  if (!selectedChannelId.value) {
    return null;
  }

  return channels.value.find((channel) => channel.id === selectedChannelId.value) ?? null;
});

const ownerNickname = computed(() => {
  if (!currentChannel.value) {
    return '';
  }

  const owner = currentChannel.value.members.find((member) => member.id === currentChannel.value?.ownerId);
  return owner ? owner.nickName : 'unknown';
});

const typingSummary = computed(() => {
  if (!currentChannel.value) {
    return '';
  }

  return `${currentChannel.value.members.length} people in the channel`;
});

const notificationsEnabled = computed(() => notificationsSupported && Notification.permission === 'granted');

const isAppVisible = ref(true);
let stopVisibilityListener: (() => void) | null = null;
let typingDebounce: number | undefined;
let typingPollHandle: number | undefined;
let messagePollHandle: number | undefined;

const registerVisibilityListener = () => {
  if (typeof document === 'undefined') {
    return;
  }

  if (stopVisibilityListener) {
    stopVisibilityListener();
  }

  const handler = () => {
    const visible = document.visibilityState !== 'hidden';
    isAppVisible.value = visible;

    if (visible) {
      void refreshLatestMessages();
    }
  };

  document.addEventListener('visibilitychange', handler);
  isAppVisible.value = document.visibilityState !== 'hidden';

  stopVisibilityListener = () => {
    document.removeEventListener('visibilitychange', handler);
  };
};

const goToLogin = () => {
  void router.push({ name: 'login' });
};

const openCreateChannelDialog = () => {
  createChannelDialog.open = true;
};

const closeCreateChannelDialog = () => {
  createChannelDialog.open = false;
  createChannelDialog.name = '';
  createChannelDialog.type = 'public';
};

const upsertChannel = (channel: ChannelDto) => {
  const index = channels.value.findIndex((item) => item.id === channel.id);

  if (index >= 0) {
    channels.value.splice(index, 1, channel);
  } else {
    channels.value.unshift(channel);
  }
};

const loadChannels = async () => {
  if (!user.value) {
    return;
  }

  channelsLoading.value = true;

  try {
    const result = await fetchChannels(user.value.id);
    channels.value = result;

    if (!selectedChannelId.value && channels.value.length > 0) {
      const firstChannel = channels.value[0];
      if (firstChannel) {
        await selectChannel(firstChannel.id);
      }
    } else if (
      selectedChannelId.value &&
      !channels.value.some((channel) => channel.id === selectedChannelId.value)
    ) {
      selectedChannelId.value = null;
      messages.value = [];
      messageNextCursor.value = null;

      if (channels.value.length > 0) {
        const fallbackChannel = channels.value[0];
        if (fallbackChannel) {
          await selectChannel(fallbackChannel.id);
        }
      }
    }
  } catch (error) {
    console.error('Failed to load channels', error);
    $q.notify({ type: 'negative', message: 'Failed to load channels.' });
  } finally {
    channelsLoading.value = false;
  }
};

const formatTimestamp = (value: string) => {
  const date = new Date(value);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const renderMessage = (content: string) => {
  return content
    .replace(/\n/g, '<br />')
    .replace(/(https?:\/\/[\w./%#?=&-]+)/g, '<a href="$1" target="_blank">$1</a>');
};

const scrollMessagesToBottom = (smooth = false) => {
  void nextTick(() => {
    const container = messagesContainerRef.value;

    if (!container) {
      return;
    }

    if (smooth) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    } else {
      container.scrollTop = container.scrollHeight;
    }
  });
};

const loadInitialMessages = async () => {
  if (!user.value || !currentChannel.value) {
    return;
  }

  messagesLoading.value = true;

  try {
    const { messages: fetched, nextCursor } = await fetchMessages(user.value.id, currentChannel.value.id);
    messages.value = fetched;
    messageNextCursor.value = nextCursor;
    scrollMessagesToBottom();
  } catch (error) {
    console.error('Failed to load messages', error);
    $q.notify({ type: 'negative', message: 'Unable to load messages.' });
  } finally {
    messagesLoading.value = false;
  }
};

const loadOlderMessages = async () => {
  if (!user.value || !currentChannel.value || !messageNextCursor.value || loadingOlderMessages.value) {
    return;
  }

  loadingOlderMessages.value = true;

  try {
    const container = messagesContainerRef.value;
    const previousScrollHeight = container?.scrollHeight ?? 0;
    const previousScrollTop = container?.scrollTop ?? 0;

    const { messages: fetched, nextCursor } = await fetchMessages(
      user.value.id,
      currentChannel.value.id,
      messageNextCursor.value
    );

    const existingIds = new Set(messages.value.map((item) => item.id));
    const filtered = fetched.filter((message) => !existingIds.has(message.id));

    messages.value = [...filtered, ...messages.value];
    messageNextCursor.value = nextCursor;

    void nextTick(() => {
      if (container) {
        const newScrollHeight = container.scrollHeight;
        container.scrollTop = previousScrollTop + (newScrollHeight - previousScrollHeight);
      }
    });
  } catch (error) {
    console.error('Failed to load older messages', error);
    $q.notify({ type: 'negative', message: 'Unable to load older messages.' });
  } finally {
    loadingOlderMessages.value = false;
  }
};

const handleMessageScroll = () => {
  const container = messagesContainerRef.value;

  if (!container || !messageNextCursor.value || loadingOlderMessages.value) {
    return;
  }

  if (container.scrollTop <= 48) {
    void loadOlderMessages();
  }
};

const refreshLatestMessages = async () => {
  if (!user.value || !currentChannel.value) {
    return;
  }

  try {
    const { messages: fetched } = await fetchMessages(user.value.id, currentChannel.value.id, undefined, 20);
    const knownIds = new Set(messages.value.map((message) => message.id));
    const incoming = fetched.filter((message) => !knownIds.has(message.id));

    if (incoming.length > 0) {
      messages.value = [...messages.value, ...incoming];
      scrollMessagesToBottom(true);
      notifyAboutMessages(incoming);
    }
  } catch (error) {
    console.error('Failed to refresh messages', error);
  }
};

const notifyAboutMessages = (incoming: MessageDto[]) => {
  if (
    !notificationsSupported ||
    !user.value ||
    isAppVisible.value ||
    user.value.status === 'offline' ||
    Notification.permission !== 'granted'
  ) {
    return;
  }

  incoming.forEach((message) => {
    if (message.senderId === user.value?.id) {
      return;
    }

    if (user.value?.status === 'dnd') {
      return;
    }

    if (user.value?.notifyMentionsOnly && message.addressedTo !== user.value?.nickName) {
      return;
    }

    const channelName = currentChannel.value?.name ?? 'Channel';
    const preview = message.content.length > 120 ? `${message.content.slice(0, 117)}...` : message.content;

    new Notification(`#${channelName}`, {
      body: `${message.sender}: ${preview}`
    });
  });
};

const stopTypingPolling = () => {
  if (typingPollHandle) {
    window.clearInterval(typingPollHandle);
    typingPollHandle = undefined;
  }
};

const stopMessagePolling = () => {
  if (messagePollHandle) {
    window.clearInterval(messagePollHandle);
    messagePollHandle = undefined;
  }
};

const startTypingPolling = () => {
  stopTypingPolling();

  if (!user.value || !currentChannel.value || user.value.status === 'offline') {
    return;
  }

  const pollTyping = async () => {
    if (!user.value || !currentChannel.value) {
      return;
    }

    try {
      typingStates.value = await fetchTypingStates(user.value.id, currentChannel.value.id);
    } catch (error) {
      console.error('Failed to fetch typing states', error);
    }
  };

  typingPollHandle = window.setInterval(() => {
    void pollTyping();
  }, 1500);
};

const refreshTypingStates = async () => {
  if (!user.value || !currentChannel.value) {
    typingStates.value = [];
    return;
  }

  try {
    typingStates.value = await fetchTypingStates(user.value.id, currentChannel.value.id);
  } catch (error) {
    console.error('Failed to refresh typing states', error);
  }
};

const startMessagePolling = () => {
  stopMessagePolling();

  if (!user.value || !currentChannel.value || user.value.status === 'offline') {
    return;
  }

  messagePollHandle = window.setInterval(() => {
    void refreshLatestMessages();
  }, 3000);
};

const restartPollers = () => {
  stopTypingPolling();
  stopMessagePolling();
  startTypingPolling();
  startMessagePolling();
};

const selectChannel = async (channelId: string) => {
  if (!user.value) {
    return;
  }

  if (selectedChannelId.value === channelId) {
    await refreshLatestMessages();
    return;
  }

  if (selectedChannelId.value) {
    try {
      await updateTypingState(user.value.id, selectedChannelId.value, '');
    } catch (error) {
      console.warn('Failed to clear typing state on channel switch', error);
    }
  }

  selectedChannelId.value = channelId;
  messageDraft.value = '';
  messages.value = [];
  messageNextCursor.value = null;

  await loadInitialMessages();
  await refreshTypingStates();
  restartPollers();
  scrollMessagesToBottom();
};

const sendCurrentMessage = async () => {
  if (!user.value || !currentChannel.value) {
    return;
  }

  const trimmed = messageDraft.value.trim();

  if (!trimmed) {
    return;
  }

  try {
    const message = await sendMessage(user.value.id, currentChannel.value.id, trimmed);
    messages.value = [...messages.value, message];
    messageDraft.value = '';
    await updateTypingState(user.value.id, currentChannel.value.id, '');
    scrollMessagesToBottom(true);
    void loadChannels();
  } catch (error) {
    console.error('Failed to send message', error);
    $q.notify({ type: 'negative', message: 'Unable to send message.' });
  }
};

const showMembers = async (channel: ChannelDto) => {
  if (!user.value) {
    return;
  }

  try {
    const result = await executeCommand(user.value.id, '/list', channel.id);
    processCommandResult(result);
  } catch (error) {
    console.error('Failed to list members', error);
    $q.notify({ type: 'negative', message: 'Unable to load members.' });
  }
};

const leaveChannelViaMenu = async (channel: ChannelDto) => {
  if (!user.value) {
    return;
  }

  try {
    await leaveChannel(user.value.id, channel.id);
    $q.notify({ type: 'positive', message: `Left #${channel.name}` });
    await loadChannels();
  } catch (error) {
    console.error('Failed to leave channel', error);
    $q.notify({ type: 'negative', message: 'Unable to update membership.' });
  }
};

const runCommand = async () => {
  if (!user.value) {
    return;
  }

  const trimmed = commandInput.value.trim();

  if (!trimmed) {
    return;
  }

  const selected = filteredCommands.value.find((option) =>
    trimmed.startsWith(option.command)
  );

  if (selected?.requiresChannel && !currentChannel.value) {
    $q.notify({ type: 'warning', message: 'Select a channel before running this command.' });
    return;
  }

  try {
    const result = await executeCommand(user.value.id, trimmed, currentChannel.value?.id);
    processCommandResult(result);
    commandInput.value = '';
    commandMenuOpen.value = false;
    await loadChannels();
  } catch (error) {
    console.error('Command failed', error);
    $q.notify({ type: 'negative', message: 'Command failed. Check syntax and permissions.' });
  }
};

const processCommandResult = (result: CommandResultDto) => {
  if (result.channel) {
    upsertChannel(result.channel);
    if (result.channel.id === currentChannel.value?.id) {
      void refreshLatestMessages();
    }
  }

  if (result.members) {
    membersDialog.members = result.members;
    membersDialog.open = true;
  }

  const type = result.success ? 'positive' : 'warning';
  $q.notify({ type, message: result.feedback });
};

const applyCommandSuggestion = (option: CommandOption) => {
  commandInput.value = `${option.command} ${option.usage}`.trim() + ' ';
  commandMenuOpen.value = false;
  void nextTick(() => {
    commandInputRef.value?.focus();
  });
};

const requestStatusChange = async (status: 'online' | 'dnd' | 'offline') => {
  if (!user.value) {
    return;
  }

  try {
    await executeCommand(user.value.id, `/status ${status}`);
    setUser({ ...user.value, status });
    if (status === 'offline') {
      stopTypingPolling();
      stopMessagePolling();
    } else {
      restartPollers();
    }
  } catch (error) {
    console.error('Unable to update status', error);
    $q.notify({ type: 'negative', message: 'Failed to change status.' });
    desiredStatus.value = user.value.status;
  }
};

const requestNotificationPreference = async (mentionsOnly: boolean) => {
  if (!user.value) {
    return;
  }

  try {
    const command = mentionsOnly ? '/notify mentions' : '/notify all';
    await executeCommand(user.value.id, command);
    setUser({ ...user.value, notifyMentionsOnly: mentionsOnly });
  } catch (error) {
    console.error('Unable to update notification preference', error);
    $q.notify({ type: 'negative', message: 'Failed to update notifications.' });
    mentionsOnlyPreference.value = user.value.notifyMentionsOnly;
  }
};

const enableNotifications = async () => {
  if (!notificationsSupported) {
    $q.notify({ type: 'warning', message: 'This browser does not support notifications.' });
    return;
  }

  if (Notification.permission === 'granted') {
    $q.notify({ type: 'info', message: 'Notifications are already enabled.' });
    return;
  }

  if (Notification.permission === 'denied') {
    $q.notify({ type: 'warning', message: 'Notifications were denied in the browser settings.' });
    return;
  }

  const permission = await Notification.requestPermission();

  if (permission === 'granted') {
    $q.notify({ type: 'positive', message: 'Notifications enabled.' });
  }
};

const logout = async () => {
  if (!user.value) {
    return;
  }

  try {
    await logoutUser(user.value.id);
  } catch (error) {
    console.warn('Logout request failed', error);
  }

  stopTypingPolling();
  stopMessagePolling();
  setUser(null);
  channels.value = [];
  messages.value = [];
  selectedChannelId.value = null;
  void router.push({ name: 'login' });
};

const openTypingPreview = (typing: TypingStateDto) => {
  typingPreviewDialog.nickName = typing.nickName;
  typingPreviewDialog.content = typing.contentPreview;
  typingPreviewDialog.open = true;
};

const createChannel = async () => {
  if (!user.value) {
    return;
  }

  const channelName = createChannelDialog.name.trim();

  if (!channelName) {
    $q.notify({ type: 'warning', message: 'Enter a channel name.' });
    return;
  }

  createChannelDialog.loading = true;

  try {
    const suffix = createChannelDialog.type === 'private' ? ' private' : '';
    const result = await executeCommand(user.value.id, `/join ${channelName}${suffix}`);
    processCommandResult(result);

    if (result.channel) {
      await loadChannels();
      await selectChannel(result.channel.id);
    }

    closeCreateChannelDialog();
  } catch (error) {
    console.error('Failed to create channel', error);
    $q.notify({ type: 'negative', message: 'Unable to create channel.' });
  } finally {
    createChannelDialog.loading = false;
  }
};

const updateTypingDraft = (value: string) => {
  if (!user.value || !currentChannel.value) {
    return;
  }

  if (typingDebounce) {
    window.clearTimeout(typingDebounce);
  }

  typingDebounce = window.setTimeout(() => {
    void updateTypingState(user.value!.id, currentChannel.value!.id, value);
  }, 300);
};

watch(commandInput, (value) => {
  const shouldOpen = value.startsWith('/') && filteredCommands.value.length > 0;
  commandMenuOpen.value = shouldOpen;
});

watch(filteredCommands, (commands) => {
  if (commandInput.value.startsWith('/')) {
    commandMenuOpen.value = commands.length > 0;
  }
});

watch(messageDraft, (value) => {
  updateTypingDraft(value);
});

watch(
  () => user.value?.status ?? null,
  (status) => {
    if (!status) {
      return;
    }

    statusSyncing = true;
    desiredStatus.value = status;

    void nextTick(() => {
      statusSyncing = false;
    });

    if (status === 'offline') {
      stopTypingPolling();
      stopMessagePolling();
    } else {
      restartPollers();
    }
  },
  { immediate: true }
);

watch(
  () => user.value?.notifyMentionsOnly ?? false,
  (mentionsOnly) => {
    notificationSyncing = true;
    mentionsOnlyPreference.value = mentionsOnly;
    void nextTick(() => {
      notificationSyncing = false;
    });
  },
  { immediate: true }
);

watch(desiredStatus, (status, previous) => {
  if (!user.value || status === previous || statusSyncing) {
    return;
  }

  void requestStatusChange(status);
});

watch(mentionsOnlyPreference, (value, previous) => {
  if (!user.value || value === previous || notificationSyncing) {
    return;
  }

  void requestNotificationPreference(value);
});

watch(
  user,
  (current) => {
    if (current) {
      void loadChannels();
    } else {
      channels.value = [];
      messages.value = [];
      selectedChannelId.value = null;
    }
  },
  { immediate: true }
);

onMounted(() => {
  registerVisibilityListener();
});

onBeforeUnmount(() => {
  stopTypingPolling();
  stopMessagePolling();
  if (stopVisibilityListener) {
    stopVisibilityListener();
    stopVisibilityListener = null;
  }
});
</script>

<style scoped>
.home-page {
  width: 100%;
  height: 100%;
}

.sidebar {
  width: 320px;
  min-width: 280px;
  max-width: 340px;
  background: #fafafa;
  border-right: 1px solid #e0e0e0;
  padding: 24px 16px;
  gap: 16px;
}

.sidebar__channels {
  flex: 1;
  min-height: 0;
}

.sidebar__channels.is-loading {
  display: flex;
}

.sidebar__preferences {
  border-top: 1px solid #e0e0e0;
  padding-top: 16px;
}

.channel--highlighted {
  background: rgba(25, 118, 210, 0.08);
}

.channel--invited {
  border-left: 4px solid #fb8c00;
}

.chat-area {
  flex: 1;
  background: #ffffff;
}

.command-panel {
  position: relative;
  gap: 8px;
}

.command-suggestions {
  position: absolute;
  top: 58px;
  left: 16px;
  right: 16px;
  border-radius: 8px;
  z-index: 5;
  background: #ffffff;
}

.channel-header {
  border-bottom: 1px solid #f0f0f0;
}

.typing-indicator {
  min-height: 24px;
}

.chat-body {
  flex: 1;
  min-height: 0;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  border-radius: 8px;
  background: #f9f9f9;
  padding: 16px;
}

.message-entry {
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #ececec;
}

.message-entry--self {
  border-left: 4px solid #1976d2;
}

.message-entry--mention {
  border-left: 4px solid #e53935;
  box-shadow: 0 0 0 1px rgba(229, 57, 53, 0.1);
}

.composer {
  background: #ffffff;
}

.typing-preview {
  white-space: pre-wrap;
  font-family: inherit;
}
</style>
