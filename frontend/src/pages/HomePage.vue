<template>
  <q-page class="home-page row no-wrap">
    <aside class="left-sidebar column">
      <div class="left-sidebar__section column">
        <div class="section-header row items-center justify-between">
          <span>Channels</span>
          <q-btn
            dense
            flat
            round
            color="primary"
            icon="add"
            @click="promptCreateChannel"
          />
        </div>

        <q-scroll-area class="left-sidebar__scroll q-mt-sm">
          <q-list dense separator>
            <q-item
              v-for="channel in channels"
              :key="channel.id"
              clickable
              :active="isChannelActive(channel.id)"
              active-class="bg-primary text-white"
              class="rounded-borders"
              @click="selectChannel(channel)"
            >
              <q-item-section>
                <q-item-label class="text-body2"># {{ channel.name }}</q-item-label>
                <q-item-label caption class="ellipsis">
                  {{ channel.description }}
                </q-item-label>
              </q-item-section>

              <q-item-section v-if="channel.unread > 0" side>
                <q-badge color="red-5" text-color="white" :label="channel.unread" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-scroll-area>
      </div>

      <q-separator class="q-my-md" />

      <div class="left-sidebar__section column">
        <div class="section-header row items-center justify-between">
          <span>Direct Messages</span>
          <q-btn
            dense
            flat
            round
            color="primary"
            icon="refresh"
            :loading="isFetchingUsers"
            @click="loadUsers"
          />
        </div>

        <div class="left-sidebar__status q-mt-sm">
          <q-linear-progress v-if="isFetchingUsers" indeterminate color="primary" />
          <q-banner v-else-if="usersError" class="bg-negative text-white">
            {{ usersError }}
          </q-banner>
        </div>

        <q-scroll-area
          v-if="!usersError"
          class="left-sidebar__scroll q-mt-sm"
        >
          <q-list dense separator>
            <q-item
              v-for="userItem in users"
              :key="userItem.id"
              clickable
              :active="isDirectMessageActive(userItem.id)"
              active-class="bg-primary text-white"
              class="rounded-borders"
              @click="selectDirectMessage(userItem)"
            >
              <q-item-section avatar>
                <q-avatar color="primary" text-color="white">
                  {{ userInitials(userItem.nickName) }}
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-body2">{{ userItem.nickName }}</q-item-label>
                <q-item-label caption class="ellipsis">
                  {{ userItem.firstName }} {{ userItem.lastName }}
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-badge
                  rounded
                  :label="userItem.status"
                  :color="statusColor(userItem.status)"
                  class="text-uppercase text-caption"
                />
              </q-item-section>
            </q-item>
          </q-list>

          <div
            v-if="!isFetchingUsers && users.length === 0"
            class="text-caption text-grey-6 q-pa-sm"
          >
            No teammates yet. Invite someone from the Register tab.
          </div>
        </q-scroll-area>
      </div>

      <q-space />

      <q-btn
        class="logout-btn q-mt-md"
        color="negative"
        icon="logout"
        label="Log out"
        unelevated
        @click="logout"
      />
    </aside>

    <section class="chat-area column">
      <header class="chat-area__header column q-pa-lg q-pb-md">
        <div class="command-input-wrapper">
          <q-input
            ref="commandInputRef"
            class="command-input"
            v-model="commandInput"
            dense
            outlined
            clearable
            placeholder="Run a command e.g. /create-channel design-review"
            @focus="maybeOpenCommandMenu"
            @keyup.enter="handleCommand"
          >
            <template #prepend>
              <q-icon name="terminal" />
            </template>
            <template #append>
              <q-btn dense flat icon="send" @click="handleCommand" />
            </template>
          </q-input>

          <div
            v-if="commandMenuOpen && filteredCommands.length > 0"
            class="command-suggestions shadow-2"
          >
            <q-list dense bordered padding>
              <q-item
                v-for="commandOption in filteredCommands"
                :key="commandOption.command"
                clickable
                @click="selectCommand(commandOption)"
              >
                <q-item-section>
                  <q-item-label class="text-body2">
                    <span class="text-primary text-weight-medium">{{ commandOption.command }}</span>
                    <span class="text-grey-7 q-ml-xs">{{ commandOption.usage }}</span>
                  </q-item-label>
                  <q-item-label caption class="text-grey-7">
                    {{ commandOption.description }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>

        <div class="text-caption text-grey-7 q-mt-xs">
          Commands help you create channels, invite teammates, and keep things organised.
        </div>
      </header>

      <q-separator />

      <div class="chat-area__body column q-pa-lg">
        <div class="row items-center justify-between">
          <div class="text-h5">
            {{ selectedConversation ? selectedConversation.label : 'Pick a channel or DM' }}
          </div>
          <div
            v-if="selectedConversation"
            class="text-caption text-grey-6 text-uppercase"
          >
            {{ selectedConversation.type === 'channel' ? 'Channel' : 'Direct message' }}
          </div>
        </div>

        <q-scroll-area class="chat-messages q-mt-lg">
          <div
            v-if="activeMessages.length === 0"
            class="empty-state column items-center justify-center q-pa-lg text-grey-6"
          >
            <q-icon name="chat_bubble_outline" size="48px" class="q-mb-md" />
            <div class="text-subtitle1">No messages yet</div>
            <div class="text-body2 text-center">
              Start the conversation by sending a message below.
            </div>
          </div>

          <div v-else class="column q-gutter-md">
            <div
              v-for="message in activeMessages"
              :key="message.id"
              class="chat-message"
            >
              <div class="row items-baseline q-gutter-sm">
                <span class="text-weight-medium">{{ message.author }}</span>
                <span class="text-caption text-grey-6">{{ message.timestamp }}</span>
              </div>
              <div class="text-body2 q-mt-xs">{{ message.body }}</div>
            </div>
          </div>
        </q-scroll-area>
      </div>

      <q-separator />

      <footer class="chat-area__composer row items-center q-gutter-sm q-pa-lg">
        <q-input
          class="col"
          v-model="messageDraft"
          dense
          filled
          autogrow
          :disable="!selectedConversation"
          :placeholder="messagePlaceholder"
          @keyup.enter="sendMessage"
        />
        <q-btn
          color="primary"
          unelevated
          round
          icon="send"
          :disable="!selectedConversation || messageDraft.trim().length === 0"
          @click="sendMessage"
        />
      </footer>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { uid, useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import type { UserDto } from '@vpwa/shared';
import { fetchUsers } from 'src/services/api';

type ConversationType = 'channel' | 'dm';

interface Channel {
  id: string;
  name: string;
  description: string;
  unread: number;
}

interface Message {
  id: string;
  author: string;
  timestamp: string;
  body: string;
}

interface ConversationSelection {
  id: string;
  label: string;
  type: ConversationType;
}

interface CommandDefinition {
  command: string;
  usage: string;
  description: string;
}

const router = useRouter();
const $q = useQuasar();

const commandInputRef = ref<{ focus: () => void } | null>(null);
const commandInput = ref('');
const messageDraft = ref('');
const users = ref<UserDto[]>([]);
const isFetchingUsers = ref(false);
const usersError = ref('');

const channels = ref<Channel[]>([
  {
    id: 'general',
    name: 'general',
    description: 'Company-wide news and announcements',
    unread: 3,
  },
  {
    id: 'design',
    name: 'design',
    description: 'Feedback on mockups and product ideas',
    unread: 0,
  },
  {
    id: 'random',
    name: 'random',
    description: 'Share memes, podcasts, and interesting reads',
    unread: 7,
  },
]);

const channelMessages = reactive<Record<string, Message[]>>({
  general: [
    {
      id: uid(),
      author: 'Ada',
      timestamp: '09:12',
      body: 'Morning team! Standup in #general at 9:30.',
    },
    {
      id: uid(),
      author: 'Grace',
      timestamp: '09:32',
      body: 'Reminder: feature freeze starts on Friday.',
    },
  ],
  design: [
    {
      id: uid(),
      author: 'Linus',
      timestamp: '14:04',
      body: 'Latest design review slides are in the shared folder.',
    },
  ],
  random: [
    {
      id: uid(),
      author: 'Sam',
      timestamp: '19:22',
      body: 'Anyone up for a board game night this weekend?',
    },
    {
      id: uid(),
      author: 'Priya',
      timestamp: '20:05',
      body: 'Dropping a playlist for focus time 🎧',
    },
  ],
});

const directMessages = reactive<Record<string, Message[]>>({});

const selectedConversation = ref<ConversationSelection | null>(null);

const commandDefinitions: CommandDefinition[] = [
  {
    command: '/create-channel',
    usage: '<name>',
    description: 'Spin up a new channel for focused collaboration.',
  },
  {
    command: '/add-user',
    usage: '<channel> <nickname>',
    description: 'Invite a teammate into an existing channel.',
  },
  {
    command: '/remove-user',
    usage: '<channel> <nickname>',
    description: 'Remove someone from a channel (requires permission).',
  },
  {
    command: '/help',
    usage: '',
    description: 'List all available commands and how to use them.',
  },
];

const commandMenuOpen = ref(false);
const statusColor = (status: UserDto['status']) => {
  switch (status) {
    case 'online':
      return 'positive';
    case 'dnd':
      return 'negative';
    default:
      return 'grey-6';
  }
};

const formatTimestamp = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const userInitials = (nickName: string) =>
  nickName ? nickName.slice(0, 2).toUpperCase() : '??';

const isChannelActive = (channelId: string) =>
  selectedConversation.value?.type === 'channel' &&
  selectedConversation.value.id === channelId;

const isDirectMessageActive = (userId: string) =>
  selectedConversation.value?.type === 'dm' &&
  selectedConversation.value.id === userId;

const selectChannel = (channel: Channel) => {
  selectedConversation.value = {
    type: 'channel',
    id: channel.id,
    label: `# ${channel.name}`,
  };

  if (!channelMessages[channel.id]) {
    channelMessages[channel.id] = [];
  }

  if (channel.unread > 0) {
    channel.unread = 0;
  }
};

const ensureDirectMessageThread = (user: UserDto) => {
  if (!directMessages[user.id]) {
    directMessages[user.id] = [
      {
        id: uid(),
        author: user.nickName,
        timestamp: formatTimestamp(),
        body: `Say hi to ${user.nickName}!`,
      },
    ];
  }
};

const selectDirectMessage = (user: UserDto) => {
  ensureDirectMessageThread(user);

  selectedConversation.value = {
    type: 'dm',
    id: user.id,
    label: user.nickName,
  };
};

const activeMessages = computed(() => {
  if (!selectedConversation.value) {
    return [];
  }

  const { type, id } = selectedConversation.value;

  return type === 'channel'
    ? channelMessages[id] ?? []
    : directMessages[id] ?? [];
});

const messagePlaceholder = computed(() => {
  if (!selectedConversation.value) {
    return 'Select a conversation to start chatting';
  }

  return selectedConversation.value.type === 'channel'
    ? `Message ${selectedConversation.value.label}`
    : `Message ${selectedConversation.value.label}`;
});

const filteredCommands = computed(() => {
  if (!commandInput.value.startsWith('/')) {
    return [] as CommandDefinition[];
  }

  const query = commandInput.value.slice(1).trim().toLowerCase();

  if (!query) {
    return commandDefinitions;
  }

  return commandDefinitions.filter((command) =>
    `${command.command} ${command.usage}`.toLowerCase().includes(query),
  );
});

const sendMessage = () => {
  const conversation = selectedConversation.value;

  if (!conversation) {
    $q.notify({
      type: 'warning',
      message: 'Choose a channel or DM before sending a message.',
    });
    return;
  }

  const trimmed = messageDraft.value.trim();

  if (!trimmed) {
    return;
  }

  const newMessage: Message = {
    id: uid(),
    author: 'You',
    timestamp: formatTimestamp(),
    body: trimmed,
  };

  const messageBucket =
    conversation.type === 'channel'
      ? channelMessages[conversation.id] ||
        (channelMessages[conversation.id] = [])
      : directMessages[conversation.id] ||
        (directMessages[conversation.id] = []);

  messageBucket.push(newMessage);

  messageDraft.value = '';
};

const makeChannelId = (name: string) => {
  const sanitized = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_\s]/g, '')
    .replace(/\s+/g, '-');

  return sanitized || `channel-${uid()}`;
};

const promptCreateChannel = () => {
  if (!commandInput.value.startsWith('/create-channel')) {
    commandInput.value = '/create-channel ';
  }

  $q.notify({
    type: 'info',
    message: 'Type the channel name after /create-channel and hit enter.',
  });

  commandMenuOpen.value = true;
};

const handleCommand = () => {
  const command = commandInput.value.trim();

  if (!command) {
    return;
  }

  if (command.startsWith('/create-channel')) {
    const rawName = command.replace('/create-channel', '').trim();

    if (!rawName) {
      $q.notify({
        type: 'warning',
        message: 'Provide a channel name after /create-channel.',
      });
      return;
    }

    const channelId = makeChannelId(rawName);

    if (channels.value.some((channel) => channel.id === channelId)) {
      $q.notify({
        type: 'warning',
        message: `Channel #${rawName} already exists.`,
      });
      return;
    }

    const newChannel: Channel = {
      id: channelId,
      name: rawName,
      description: 'New channel created via command',
      unread: 0,
    };

    channels.value.push(newChannel);
    channelMessages[channelId] = [];
    selectChannel(newChannel);

    $q.notify({
      type: 'positive',
      message: `Channel #${rawName} created.`,
    });
  } else if (command.startsWith('/add-user')) {
    const args = command.replace('/add-user', '').trim().split(/\s+/).filter(Boolean);

    if (args.length < 2) {
      $q.notify({
        type: 'warning',
        message: 'Usage: /add-user <channel> <nickname>',
      });
      return;
    }

    const [channelRefRaw, nickName] = args;
    const channelRef = channelRefRaw ?? '';
    const channelId = makeChannelId(channelRef.replace(/^#/, ''));
    const channel = channels.value.find((item) => item.id === channelId);

    if (!channel) {
      $q.notify({
        type: 'negative',
        message: `Channel ${channelRef} not found.`,
      });
      return;
    }

    $q.notify({
      type: 'positive',
      message: `${nickName} would be added to #${channel.name}. (Not wired to backend yet.)`,
    });
  } else if (command.startsWith('/remove-user')) {
    const args = command.replace('/remove-user', '').trim().split(/\s+/).filter(Boolean);

    if (args.length < 2) {
      $q.notify({
        type: 'warning',
        message: 'Usage: /remove-user <channel> <nickname>',
      });
      return;
    }

    const [channelRefRaw, nickName] = args;
    const channelRef = channelRefRaw ?? '';
    const channelId = makeChannelId(channelRef.replace(/^#/, ''));
    const channel = channels.value.find((item) => item.id === channelId);

    if (!channel) {
      $q.notify({
        type: 'negative',
        message: `Channel ${channelRef} not found.`,
      });
      return;
    }

    $q.notify({
      type: 'info',
      message: `${nickName} would be removed from #${channel.name}. (Not wired to backend yet.)`,
    });
  } else if (command === '/help') {
    $q.notify({
      type: 'info',
      message:
        'Available commands: /create-channel, /add-user, /remove-user. Provide required parameters after each command.',
      multiLine: true,
      timeout: 5000,
    });
  } else {
    $q.notify({
      type: 'info',
      message: `Command "${command}" is not supported yet.`,
    });
  }

  commandInput.value = '';
  commandMenuOpen.value = false;
};

const selectCommand = (commandOption: CommandDefinition) => {
  commandInput.value = `${commandOption.command}${commandOption.usage ? ' ' : ''}`;
  commandMenuOpen.value = false;
  commandInputRef.value?.focus();
};

const maybeOpenCommandMenu = () => {
  if (commandInput.value.startsWith('/')) {
    commandMenuOpen.value = filteredCommands.value.length > 0;
  }
};

const logout = () => {
  // Hook actual logout logic here when backend is ready.
  router.push({ name: 'login' }).catch((error) => {
    console.error('Navigation to login failed', error);
  });
};

const loadUsers = async () => {
  isFetchingUsers.value = true;
  usersError.value = '';

  try {
    users.value = await fetchUsers();
  } catch (error) {
    usersError.value = 'Unable to load teammates. Try again later.';
    console.error('Failed to load users for direct messages', error);
  } finally {
    isFetchingUsers.value = false;
  }
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

onMounted(() => {
  void loadUsers();

  const firstChannel = channels.value[0];

  if (firstChannel) {
    selectChannel(firstChannel);
  }
});
</script>

<style scoped>
.home-page {
  width: 100%;
  height: 100%;
  background: #f5f5f5;
  overflow: hidden;
}

.left-sidebar {
  width: 320px;
  min-width: 280px;
  max-width: 340px;
  background: #ffffff;
  border-right: 1px solid #e0e0e0;
  padding: 24px 16px;
  gap: 16px;
}

.left-sidebar__section {
  flex: 1 1 0;
  min-height: 0;
}

.left-sidebar__scroll {
  flex: 1;
  min-height: 0;
}

.left-sidebar__status {
  min-height: 20px;
}

.section-header {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.logout-btn {
  align-self: stretch;
}

.chat-area {
  flex: 1;
  background: #ffffff;
}

.chat-area__header {
  gap: 8px;
}

.command-input-wrapper {
  position: relative;
}

.command-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  border-radius: 8px;
  background: #ffffff;
  z-index: 10;
}

.chat-area__body {
  flex: 1;
  min-height: 0;
}

.chat-messages {
  flex: 1;
  min-height: 240px;
}

.chat-message {
  background: #f0f0f0;
  padding: 12px;
  border-radius: 8px;
}

.empty-state {
  min-height: 240px;
}

.chat-area__composer {
  background: #ffffff;
}
</style>
