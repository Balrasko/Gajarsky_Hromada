<template>
  <q-page class="home-page q-pa-none">
    <div class="workspace-grid">
      <aside class="workspace-column sidebar">
        <section class="card user-card">
          <div class="user-card__header row items-center q-gutter-sm">
            <q-avatar size="42px" color="primary" text-color="white">
              {{ currentUserInitials }}
            </q-avatar>
            <div class="column">
              <div class="text-subtitle1 text-weight-medium">
                {{ currentUser.firstName }} {{ currentUser.lastName }}
              </div>
              <div class="text-caption text-grey-6">@{{ currentUser.nickName }}</div>
              <div class="text-caption text-grey-7">{{ currentUser.email }}</div>
            </div>
          </div>

          <q-separator class="q-my-sm" />

          <div class="user-card__status column q-gutter-xs">
            <div class="label text-caption text-grey-7">Stav používateľa</div>
            <q-btn-toggle
              v-model="currentUser.status"
              class="status-toggle"
              toggle-color="primary"
              unelevated
              :options="statusOptions"
            />
          </div>

          <q-separator class="q-my-sm" />

          <div class="user-card__notifications column q-gutter-sm">
            <div class="label text-caption text-grey-7">Notifikácie</div>
            <q-toggle
              v-model="notificationSettings.enabled"
              label="Zapnúť notifikácie"
              dense
            />
            <q-toggle
              v-model="notificationSettings.mentionsOnly"
              :disable="!notificationSettings.enabled"
              label="Iba @zmienky"
              dense
            />
            <q-toggle
              v-model="notificationSettings.bannersWhenHidden"
              label="Len keď aplikácia nie je viditeľná"
              dense
            />

            <div class="label text-caption text-grey-7 q-mt-sm">Viditeľnosť aplikácie</div>
            <q-btn-toggle
              v-model="appVisibility"
              class="visibility-toggle"
              unelevated
              toggle-color="secondary"
              :options="[
                { label: 'Visible', value: 'visible' },
                { label: 'Hidden', value: 'hidden' }
              ]"
            />
            <q-banner
              v-if="appVisibility === 'visible'"
              dense
              class="bg-grey-2 text-grey-8 q-mt-sm border-curve"
            >
              Notifikácie sa odošlú až keď zmeníte stav na Hidden.
            </q-banner>
          </div>
          <q-separator class="q-my-sm" />

          <q-btn
            color="negative"
            icon="logout"
            label="Odhlásiť sa"
            unelevated
            @click="logout"
          />
        </section>

        <section class="card channels-card column">
          <div class="section-header row items-center justify-between">
            <div>
              <div class="text-subtitle2 text-weight-medium">Kanály</div>
              <div class="text-caption text-grey-6">
                Vytvárajte, prijímajte pozvánky alebo opúšťajte miestnosti.
              </div>
            </div>
            <q-btn
              icon="add"
              color="primary"
              round
              flat
              @click="openCreateChannelDialog"
            />
          </div>

          <div
            class="channels-scroll q-mt-sm"
            :class="{ 'channels-scroll--empty': sortedActiveChannels.length === 0 }"
          >
            <q-list v-if="sortedActiveChannels.length" dense>
              <q-item
                v-for="channel in sortedActiveChannels"
                :key="channel.id"
                clickable
                :class="channelItemClasses(channel)"
                @click="selectChannel(channel.id)"
              >
                <q-item-section avatar>
                  <q-avatar size="26px" :color="channel.type === 'private' ? 'primary' : 'secondary'">
                    <q-icon :name="channel.type === 'private' ? 'lock' : 'tag'" color="white" size="18px" />
                  </q-avatar>
                </q-item-section>

                <q-item-section class="channel-item__main">
                  <q-item-label class="text-body2 text-weight-medium channel-item__title">
                    <span class="channel-item__name">#{{ channel.name }}</span>
                    <q-badge
                      v-if="channel.hasInvite && !channel.isMember"
                      color="orange-7"
                      text-color="white"
                      label="Invite"
                      class="channel-item__badge"
                    />
                    <q-badge
                      v-if="channel.ownerId === currentUser.id"
                      color="purple-7"
                      text-color="white"
                      label="Admin"
                      class="channel-item__badge"
                    />
                  </q-item-label>
                  <q-item-label caption class="channel-item__description">
                    {{ channel.description }}
                  </q-item-label>
                </q-item-section>

                <q-item-section side class="row items-center q-gutter-xs">
                  <q-badge
                    v-if="channel.unread > 0"
                    color="red-6"
                    text-color="white"
                    :label="channel.unread"
                  />

                  <q-icon
                    v-if="channel.lastActiveDays > 30"
                    name="hourglass_empty"
                    size="18px"
                    color="warning"
                  >
                    <q-tooltip>Kanál je neaktívny &gt; 30 dní - bude archivovaný</q-tooltip>
                  </q-icon>

                  <q-btn
                    dense
                    flat
                    round
                    color="grey-7"
                    icon="more_vert"
                  >
                    <q-menu cover>
                      <q-list dense style="min-width: 180px">
                        <q-item
                          v-if="channel.hasInvite && !channel.isMember"
                          clickable
                          @click.stop="acceptInvite(channel)"
                        >
                          <q-item-section>Aceptovať pozvánku</q-item-section>
                        </q-item>
                        <q-item
                          v-if="channel.hasInvite && !channel.isMember"
                          clickable
                          @click.stop="rejectInvite(channel)"
                        >
                          <q-item-section>Odmietnuť pozvánku</q-item-section>
                        </q-item>
                        <q-item
                          v-if="channel.isMember"
                          clickable
                          @click.stop="leaveChannel(channel)"
                        >
                          <q-item-section>Opustiť kanál (/cancel)</q-item-section>
                        </q-item>
                        <q-item
                          v-if="channel.ownerId === currentUser.id"
                          clickable
                          @click.stop="closeChannel(channel)"
                        >
                          <q-item-section>Zrušiť kanál (/quit)</q-item-section>
                        </q-item>
                        <q-item clickable @click.stop="selectChannel(channel.id)">
                          <q-item-section>Zobraziť detaily</q-item-section>
                        </q-item>
                      </q-list>
                    </q-menu>
                  </q-btn>
                </q-item-section>
              </q-item>
            </q-list>

            <div
              v-else
              class="empty-placeholder column items-center text-caption text-grey-6 q-py-xl"
            >
              <q-icon name="chat_bubble_outline" size="32px" class="q-mb-sm" />
              Žiadne kanály. Vytvorte nový cez tlačidlo alebo príkaz /join.
            </div>
          </div>
        </section>

        <section class="card dormant-card" v-if="dormantChannels.length">
          <div class="section-header q-mb-sm">
            <div class="text-subtitle2 text-weight-medium">Neaktívne kanály</div>
            <div class="text-caption text-grey-6">
              Tieto kanály expirovali po 30 dňoch. Môžete znovu použiť ich názvy.
            </div>
          </div>

          <q-list dense>
            <q-item v-for="channel in dormantChannels" :key="channel.id">
              <q-item-section>
                <q-item-label class="text-body2 text-weight-medium">#{{ channel.name }}</q-item-label>
                <q-item-label caption>
                  Posledná aktivita pred {{ channel.lastActiveDays }} dňami.
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn
                  dense
                  color="primary"
                  label="Reclaim"
                  outline
                  @click="reclaimChannel(channel.name)"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </section>
      </aside>

      <section class="workspace-column main">
        <header class="main-header row items-center justify-between">
          <div>
            <div class="text-h6 text-weight-medium">
              {{ selectedChannel ? '#' + selectedChannel.name : 'Vyberte si kanál' }}
            </div>
            <div class="text-caption text-grey-7" v-if="selectedChannel">
              {{ selectedChannel.description }}
              · {{ selectedChannel.type === 'private' ? 'Súkromný' : 'Verejný' }} kanál
              · Správca: {{ channelOwnerName(selectedChannel) }}
            </div>
            <div
              class="text-caption text-grey-6"
              v-else
            >
              Pridajte sa do kanála cez /join alebo prijmite pozvánku.
            </div>
          </div>
          <div class="row items-center q-gutter-sm">
            <q-badge
              v-if="selectedChannel && selectedChannel.hasInvite && !selectedChannel.isMember"
              color="orange-7"
              text-color="white"
              label="Pending invite"
            />
          </div>
        </header>

        <q-banner
          v-if="currentUser.status === 'offline'"
          inline-actions
          class="bg-grey-9 text-white q-mb-md"
        >
          Ste offline. Nové správy sú pozastavené, po návrate online sa história obnoví automaticky.
        </q-banner>

        <q-banner
          v-if="selectedChannel && selectedChannel.pendingInvites.length"
          class="bg-indigo-1 text-indigo-10 q-mb-sm"
        >
          Pending invites: {{ selectedChannel.pendingInvites.join(', ') }}.
          Pozvite členov cez /invite nickName alebo zrušte /revoke nickName.
        </q-banner>

        <div
          v-if="selectedChannel && typingIndicator(selectedChannel).length"
          class="typing-indicator row items-center q-gutter-sm q-mb-sm"
        >
          <q-icon name="edit" size="18px" color="primary" />
          <div class="text-caption">
            {{ typingIndicator(selectedChannel) }}
          </div>
        </div>

        <div
          class="messages-container"
          :class="{ 'messages-container--empty': !selectedChannel }"
        >
          <div v-if="!selectedChannel" class="empty-state column items-center justify-center">
            <q-icon name="chat" size="56px" color="grey-5" />
            <div class="text-subtitle1 q-mt-sm">Vyberte si kanál</div>
            <div class="text-body2 text-grey-6 q-mt-xs">
              Alebo vytvorte nový cez príkaz <code>/join nazov-kanala</code>.
            </div>
          </div>

          <div
            v-else
            class="messages-scroll-wrapper"
          >
            <q-infinite-scroll
              reverse
              class="messages-scroll"
              :offset="120"
              scroll-target=".messages-scroll-wrapper"
              @load="loadMoreMessages"
            >
              <transition-group name="message-fade" tag="div" class="column q-gutter-md">
                <div
                  v-for="message in visibleMessages"
                  :key="message.id"
                  :class="messageClasses(message)"
                >
                  <div class="row items-baseline q-gutter-xs">
                    <span class="text-weight-medium">
                      {{ message.system ? 'Systém' : message.sender }}
                    </span>
                    <span class="text-caption text-grey-6">{{ formatMessageTime(message.createdAt) }}</span>
                    <q-chip
                      v-if="message.addressedTo === currentUser.nickName"
                      color="primary"
                      text-color="white"
                      size="sm"
                      outline
                      dense
                    >
                      @{{ currentUser.nickName }}
                    </q-chip>
                  </div>

                  <div class="text-body2 q-mt-xs">
                    <span v-if="message.addressedTo && message.addressedTo !== currentUser.nickName" class="text-primary text-weight-medium">
                      @{{ message.addressedTo }}
                    </span>
                    {{ message.content }}
                  </div>
                </div>
              </transition-group>

              <div
                v-if="typingDrafts.length"
                class="draft-stream column q-gutter-sm q-mt-md"
              >
                <div
                  v-for="draft in typingDrafts"
                  :key="draft.id"
                  class="draft-message"
                >
                  <div class="row items-baseline q-gutter-xs">
                    <span class="text-weight-medium text-primary">@{{ draft.nickName }}</span>
                    <span class="text-caption text-grey-6">rozpísaná správa</span>
                  </div>
                  <div class="text-body2 text-grey-7 draft-message__body">
                    {{ draft.body }}
                  </div>
                </div>
              </div>

              <template #loading>
                <div class="row items-center justify-center q-my-md">
                  <q-spinner-dots color="primary" size="32px" />
                </div>
              </template>
            </q-infinite-scroll>
          </div>
        </div>

        <footer class="command-console column">
          <div class="label row items-center justify-between">
            <span>Príkazový riadok (správy aj príkazy)</span>
            <q-btn
              dense
              flat
              color="grey-7"
              icon="help_outline"
              label="/help"
              @click="showHelp"
            />
          </div>
          <div class="command-input-wrapper">
            <q-input
              ref="consoleInputRef"
              v-model="consoleInput"
              rounded
              outlined
              dense
              autofocus
              :placeholder="consolePlaceholder"
              @keyup.enter="handleConsoleSubmit"
            >
              <template #prepend>
                <q-icon name="terminal" color="primary" />
              </template>
              <template #append>
                <q-btn
                  round
                  dense
                  flat
                  icon="send"
                  color="primary"
                  @click="handleConsoleSubmit"
                />
              </template>
            </q-input>

            <div
              v-if="commandMenuOpen && filteredCommands.length"
              class="command-suggestions shadow-2"
            >
              <q-list dense bordered>
                <q-item
                  v-for="command in filteredCommands"
                  :key="command.command"
                  clickable
                  @click="autofillCommand(command)"
                >
                  <q-item-section>
                    <q-item-label class="text-body2">
                      <span class="text-primary text-weight-medium">{{ command.command }}</span>
                      <span class="text-grey-7 q-ml-xs">{{ command.usage }}</span>
                    </q-item-label>
                    <q-item-label caption class="text-grey-7">
                      {{ command.description }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </div>
        </footer>
      </section>

      <aside class="workspace-column inspector" v-if="selectedChannel">
        <section class="card inspector-card">
          <div class="section-header q-mb-sm">
            <div class="text-subtitle2 text-weight-medium">
              Členovia kanála
            </div>
            <div class="text-caption text-grey-6">
              Disponibilné aj cez príkaz <code>/list</code>.
            </div>
          </div>

          <q-list dense>
            <q-item
              v-for="member in selectedChannel.members"
              :key="member.id"
            >
              <q-item-section avatar>
                <q-avatar size="28px" color="secondary" text-color="white">
                  {{ member.nickName.slice(0, 2).toUpperCase() }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-body2 text-weight-medium">
                  {{ member.nickName }}
                  <q-badge
                    v-if="member.role !== 'member'"
                    color="purple-6"
                    text-color="white"
                    :label="member.role === 'owner' ? 'Owner' : 'Admin'"
                    class="q-ml-xs"
                    dense
                  />
                </q-item-label>
                <q-item-label caption>
                  {{ member.firstName }} {{ member.lastName }} · {{ member.status }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon
                  :name="member.status === 'online' ? 'circle' : member.status === 'dnd' ? 'do_not_disturb_on' : 'cloud_off'"
                  :color="member.status === 'online' ? 'positive' : member.status === 'dnd' ? 'negative' : 'grey-6'"
                  size="18px"
                />
              </q-item-section>
            </q-item>
          </q-list>

          <div
            v-if="selectedChannel.members.length === 0"
            class="text-caption text-grey-6 q-pa-md"
          >
            Žiadni členovia.
          </div>
        </section>

        <section class="card inspector-card q-mt-md">
          <div class="section-header q-mb-sm">
            <div class="text-subtitle2 text-weight-medium">Moderovanie</div>
            <div class="text-caption text-grey-6">
              Spravujte prístup cez príkazy /invite, /revoke, /kick.
            </div>
          </div>

          <q-list dense separator>
            <q-item>
              <q-item-section>
                <q-item-label>Aktívne pozvánky</q-item-label>
                <q-item-label caption>
                  {{ selectedChannel.pendingInvites.length ? selectedChannel.pendingInvites.join(', ') : 'Žiadne' }}
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label>Trvalé bany</q-item-label>
                <q-item-label caption>
                  {{ selectedChannel.bannedMembers.length ? selectedChannel.bannedMembers.join(', ') : 'Žiadne' }}
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label>Posledná aktivita</q-item-label>
                <q-item-label caption>
                  {{ selectedChannel.lastActiveDays }} dní dozadu
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </section>
      </aside>
    </div>

    <q-dialog v-model="createChannelDialog.open" persistent>
      <q-card style="min-width: 420px">
        <q-card-section>
          <div class="text-h6">Vytvoriť nový kanál</div>
          <div class="text-caption text-grey-7">
            Rovnaké správanie ako príkaz <code>/join channelName [private]</code>.
          </div>
        </q-card-section>

        <q-card-section class="column q-gutter-md">
          <q-input
            v-model="createChannelDialog.form.name"
            label="Názov kanála"
            dense
            outlined
            hint="použite iba malé písmená, čísla a pomlčky"
          />
          <q-select
            v-model="createChannelDialog.form.type"
            label="Typ"
            dense
            outlined
            :options="[
              { label: 'Verejný', value: 'public' },
              { label: 'Súkromný', value: 'private' }
            ]"
          />
          <q-input
            v-model="createChannelDialog.form.description"
            type="textarea"
            label="Popis"
            dense
            outlined
            autogrow
          />
        </q-card-section>

        <q-card-actions align="between">
          <q-btn flat label="Zrušiť" color="grey-7" v-close-popup />
          <q-btn color="primary" label="Vytvoriť" @click="confirmChannelCreation" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import type { ChannelDto, ChannelMemberDto, MessageDto, TypingStateDto, UserDto } from '@vpwa/shared';
import { useRouter } from 'vue-router';
import socket, { socketRequest } from 'src/services/socket';
import {
  executeCommand,
  fetchChannelMembers,
  fetchChannelMessages,
  fetchChannels,
  fetchTypingStates,
  leaveChannelRequest,
  sendChannelMessage,
  updateTypingState,
} from 'src/services/api';
import { clearCurrentUser, loadCurrentUser } from 'src/services/session';

type ChannelType = 'public' | 'private';
type AppVisibilityState = 'visible' | 'hidden';

type DraftPreview = {
  id: string;
  nickName: string;
  body: string;
};

type ChatMessage = MessageDto & {
  system?: boolean;
};

type ChannelState = ChannelDto & {
  description?: string;
  isMember: boolean;
  hasInvite: boolean;
  pinned: boolean;
  archived: boolean;
  lastActiveDays: number;
  unread: number;
  typingMembers: string[];
  typingPreviews: TypingStateDto[];
  pendingInvites: string[];
  bannedMembers: string[];
  pendingKickVotes: Record<string, number>;
  members: ChannelMemberDto[];
  messages: ChatMessage[];
  nextCursor: string | null;
  messagesLoaded: boolean;
  loadingMessages: boolean;
};

interface CommandDefinition {
  command: string;
  usage: string;
  description: string;
}

const $q = useQuasar();
const router = useRouter();

const emptyUser: UserDto = {
  id: '',
  firstName: '',
  lastName: '',
  nickName: '',
  email: '',
  status: 'online',
};

const storedUser = loadCurrentUser();
if (!storedUser) {
  void router.replace({ name: 'login' });
}

const currentUser = reactive<UserDto>({
  ...emptyUser,
  ...(storedUser ?? {}),
});

const notificationSettings = reactive({
  enabled: true,
  mentionsOnly: false,
  bannersWhenHidden: true,
});

const appVisibility = ref<AppVisibilityState>('visible');

const channels = ref<ChannelState[]>([]);
const selectedChannelId = ref<string | null>(null);
const subscribedChannels = new Set<string>();

const consoleInput = ref('');
const consoleInputRef = ref<{ focus: () => void } | null>(null);
const commandMenuOpen = ref(false);

const createChannelDialog = reactive<{
  open: boolean;
  form: {
    name: string;
    type: ChannelType;
    description: string;
  };
}>({
  open: false,
  form: {
    name: '',
    type: 'public',
    description: '',
  },
});

const commandDefinitions: CommandDefinition[] = [
  {
    command: '/join',
    usage: 'channelName [private]',
    description: 'Pridá sa do existujúceho kanála alebo vytvorí nový.',
  },
  {
    command: '/invite',
    usage: 'nickName',
    description: 'Pozve používateľa do aktuálneho kanála.',
  },
  {
    command: '/revoke',
    usage: 'nickName',
    description: 'Zruší pozvánku do súkromného kanála.',
  },
  {
    command: '/kick',
    usage: 'nickName',
    description: 'Začne proces vyhodenia člena (3 hlasy, alebo okamžite pre správcu).',
  },
  {
    command: '/quit',
    usage: '',
    description: 'Správca zruší kanál a uvoľní názov.',
  },
  {
    command: '/cancel',
    usage: '',
    description: 'Opustí aktuálny kanál (ak ide o správcu, kanál zaniká).',
  },
  {
    command: '/list',
    usage: '',
    description: 'Zobrazí zoznam členov kanála.',
  },
  {
    command: '/help',
    usage: '',
    description: 'Zobrazí dostupné príkazy.',
  },
];

const statusOptions = [
  { label: 'Online', value: 'online' },
  { label: 'DND', value: 'dnd' },
  { label: 'Offline', value: 'offline' },
];

const filteredCommands = computed(() => {
  if (!consoleInput.value.startsWith('/')) {
    return [] as CommandDefinition[];
  }

  const query = consoleInput.value.slice(1).toLowerCase();
  if (!query) {
    return commandDefinitions;
  }

  return commandDefinitions.filter((definition) =>
    `${definition.command} ${definition.usage}`.toLowerCase().includes(query),
  );
});

const sortedActiveChannels = computed(() =>
  channels.value
    .filter((channel) => (channel.isMember || channel.hasInvite) && !channel.archived)
    .sort((a, b) => {
      if (a.hasInvite !== b.hasInvite) {
        return a.hasInvite ? -1 : 1;
      }
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    }),
);

const dormantChannels = computed(() =>
  channels.value.filter((channel) => channel.archived),
);

const selectedChannel = computed(() =>
  channels.value.find((channel) => channel.id === selectedChannelId.value) ?? null,
);

const currentUserInitials = computed(() =>
  `${currentUser.firstName?.[0] ?? ''}${currentUser.lastName?.[0] ?? ''}`.toUpperCase(),
);

const visibleMessages = computed(() => selectedChannel.value?.messages ?? []);

const consolePlaceholder = computed(() => {
  if (!selectedChannel.value) {
    return 'Napíšte /join nazov-kanala alebo prijmite pozvánku.';
  }

  return 'Napíšte správu alebo príkaz (napr. /invite nickName)';
});

const channelItemClasses = (channel: ChannelState) => ({
  'channel-item': true,
  'channel-item--active': selectedChannelId.value === channel.id,
  'channel-item--invite': channel.hasInvite && !channel.isMember,
});

const typingIndicator = (channel: ChannelState) => {
  if (!channel.typingPreviews.length) {
    return '';
  }

  const typingList = channel.typingPreviews.map((state) => `@${state.nickName}`).join(', ');
  return `${typingList} práve píšu…`;
};

const channelOwnerName = (channel: ChannelState) => {
  const owner = channel.members.find((member) => member.id === channel.ownerId);
  return owner ? `@${owner.nickName}` : '@unknown';
};

const messageClasses = (message: ChatMessage) => ({
  message: true,
  'message--self': message.sender === currentUser.nickName,
  'message--mention': message.addressedTo === currentUser.nickName,
  'message--system': Boolean(message.system),
});

const typingDrafts = computed<DraftPreview[]>(() => {
  const channel = selectedChannel.value;
  if (!channel) {
    return [];
  }

  return channel.typingPreviews.map((draft) => ({
    id: `${channel.id}-${draft.userId}-${draft.updatedAt}`,
    nickName: draft.nickName,
    body: draft.contentPreview,
  }));
});

const sanitizeChannelName = (rawName: string) =>
  rawName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_\s]/g, '')
    .replace(/\s+/g, '-');

const formatMessageTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const computeLastActiveDays = (lastActivityAt: string | null) => {
  if (!lastActivityAt) {
    return 0;
  }

  const diffMs = Date.now() - Date.parse(lastActivityAt);
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
};

const mergeMessages = (channel: ChannelState, incoming: MessageDto[]) => {
  const byId = new Map(channel.messages.map((message) => [message.id, message]));
  incoming.forEach((message) => byId.set(message.id, message));
  channel.messages = Array.from(byId.values()).sort(
    (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
  );
};

const mapChannelDto = (dto: ChannelDto, existing?: ChannelState): ChannelState => ({
  ...dto,
  description: existing?.description ?? '',
  isMember: dto.membershipStatus === 'active',
  hasInvite: dto.membershipStatus === 'invited',
  pinned: existing?.pinned ?? false,
  archived: false,
  lastActiveDays: computeLastActiveDays(dto.lastActivityAt),
  unread: dto.unreadCount,
  typingMembers: existing?.typingMembers ?? [],
  typingPreviews: existing?.typingPreviews ?? [],
  pendingInvites: existing?.pendingInvites ?? [],
  bannedMembers: existing?.bannedMembers ?? [],
  pendingKickVotes: existing?.pendingKickVotes ?? {},
  members: dto.members,
  messages: existing?.messages ?? [],
  nextCursor: existing?.nextCursor ?? null,
  messagesLoaded: existing?.messagesLoaded ?? false,
  loadingMessages: false,
});

const loadChannels = async () => {
  if (!currentUser.id) {
    return;
  }

  try {
    const channelDtos = await fetchChannels(currentUser.id);
    const previous = new Map(channels.value.map((channel) => [channel.id, channel]));

    channels.value = channelDtos.map((dto) => mapChannelDto(dto, previous.get(dto.id)));

    for (const channel of channels.value.filter((channel) => channel.isMember)) {
      void ensureSubscribed(channel.id);
    }

    if (!selectedChannelId.value && channels.value.length > 0) {
      selectedChannelId.value = channels.value.find((channel) => channel.isMember)?.id ?? channels.value[0]!.id;
    }

    if (selectedChannelId.value && !channels.value.some((channel) => channel.id === selectedChannelId.value)) {
      selectedChannelId.value = channels.value.find((channel) => channel.isMember)?.id ?? channels.value[0]?.id ?? null;
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Nepodarilo sa načítať kanály.',
    });
    console.error(error);
  }
};

const loadChannelMembers = async (channel: ChannelState) => {
  if (!currentUser.id) {
    return;
  }

  try {
    const { members } = await fetchChannelMembers(channel.id, currentUser.id);
    channel.members = members;
  } catch (error) {
    console.error(error);
  }
};

const loadTypingForChannel = async (channel: ChannelState) => {
  if (!currentUser.id) {
    return;
  }

  try {
    const typing = await fetchTypingStates(channel.id, currentUser.id);
    channel.typingPreviews = typing;
    channel.typingMembers = typing.map((item) => item.nickName);
  } catch (error) {
    console.error(error);
  }
};

const refreshMessages = async (channel: ChannelState) => {
  if (!currentUser.id) {
    return;
  }

  try {
    const { messages, nextCursor } = await fetchChannelMessages(channel.id, currentUser.id);
    mergeMessages(channel, messages);
    channel.nextCursor = nextCursor;
    channel.messagesLoaded = true;
    channel.unread = 0;
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Nepodarilo sa načítať správy.',
    });
    console.error(error);
  }
};

const loadOlderMessages = async (channel: ChannelState) => {
  if (!channel.nextCursor || channel.loadingMessages || !currentUser.id) {
    return false;
  }

  channel.loadingMessages = true;
  try {
    const { messages, nextCursor } = await fetchChannelMessages(
      channel.id,
      currentUser.id,
      channel.nextCursor,
    );
    const existingIds = new Set(channel.messages.map((message) => message.id));
    const merged = [...messages.filter((message) => !existingIds.has(message.id)), ...channel.messages];
    channel.messages = merged.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
    channel.nextCursor = nextCursor;
    return !!nextCursor;
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Nepodarilo sa načítať staršie správy.',
    });
    console.error(error);
    return false;
  } finally {
    channel.loadingMessages = false;
  }
};

const loadMoreMessages = async (_index: number, done: (stop?: boolean) => void) => {
  const channel = selectedChannel.value;
  if (!channel) {
    done();
    return;
  }

  const hasMore = await loadOlderMessages(channel);
  done(!hasMore);
};

const selectChannel = async (channelId: string) => {
  const channel = channels.value.find((item) => item.id === channelId);
  if (!channel) {
    return;
  }

  if (channel.hasInvite && !channel.isMember) {
    await acceptInvite(channel);
    return;
  }

  selectedChannelId.value = channelId;
  channel.unread = 0;
  void ensureSubscribed(channelId);

  await Promise.all([refreshMessages(channel), loadChannelMembers(channel), loadTypingForChannel(channel)]);
};

const acceptInvite = async (channel: ChannelState) => {
  try {
    const result = await executeCommand(currentUser.id, `/join ${channel.name}`);
    if (result.feedback) {
      $q.notify({ type: result.success ? 'positive' : 'warning', message: result.feedback });
    }
    await loadChannels();
    selectedChannelId.value = channel.id;
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Pozvánku sa nepodarilo prijať.' });
    console.error(error);
  }
};

const rejectInvite = async (channel: ChannelState) => {
  try {
    await executeCommand(currentUser.id, '/cancel', channel.id);
    $q.notify({ type: 'info', message: `Pozvánka do #${channel.name} bola odmietnutá.` });
    await loadChannels();
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Pozvánku sa nepodarilo odmietnuť.' });
    console.error(error);
  }
};

const leaveChannel = async (channel: ChannelState) => {
  try {
    await leaveChannelRequest(channel.id, currentUser.id);
    $q.notify({ type: 'info', message: `Opustili ste kanál #${channel.name}.` });
    await loadChannels();
    if (selectedChannelId.value === channel.id) {
      selectedChannelId.value = sortedActiveChannels.value.find((item) => item.id !== channel.id)?.id ?? null;
    }
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Kanál sa nepodarilo opustiť.' });
    console.error(error);
  }
};

const closeChannel = async (channel: ChannelState) => {
  try {
    await executeCommand(currentUser.id, '/quit', channel.id);
    $q.notify({ type: 'warning', message: `Kanál #${channel.name} bol zrušený.` });
    await loadChannels();
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Kanál sa nepodarilo zrušiť.' });
    console.error(error);
  }
};

const sendMessage = async (content: string) => {
  const channel = selectedChannel.value;
  if (!channel) {
    $q.notify({
      type: 'warning',
      message: 'Najprv si vyberte kanál.',
    });
    return;
  }

  if (!channel.isMember) {
    $q.notify({ type: 'warning', message: 'Najprv prijmite pozvánku do kanála.' });
    return;
  }

  if (currentUser.status === 'offline') {
    $q.notify({
      type: 'negative',
      message: 'V offline režime nemôžete odosielať správy.',
    });
    return;
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return;
  }

  try {
    const message = await sendChannelMessage(channel.id, currentUser.id, trimmed);
    mergeMessages(channel, [message]);
    channel.lastActiveDays = 0;
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Správu sa nepodarilo odoslať.' });
    console.error(error);
  }
};

const handleConsoleSubmit = async () => {
  const input = consoleInput.value.trim();
  if (!input) {
    return;
  }

  if (input.startsWith('/')) {
    await handleCommand(input);
  } else {
    await sendMessage(input);
  }

  consoleInput.value = '';
  commandMenuOpen.value = false;
};

const handleCommand = async (input: string) => {
  try {
    const result = await executeCommand(currentUser.id, input, selectedChannelId.value ?? undefined);
    if (result.feedback) {
      $q.notify({ type: result.success ? 'positive' : 'warning', message: result.feedback });
    }

    if (result.channel) {
      await loadChannels();
      selectedChannelId.value = result.channel.id;
      const channel = channels.value.find((item) => item.id === result.channel?.id);
      if (channel) {
        await Promise.all([refreshMessages(channel), loadChannelMembers(channel)]);
      }
    } else {
      await loadChannels();
    }

    if (result.members && selectedChannel.value) {
      selectedChannel.value.members = result.members;
    }
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Príkaz sa nepodarilo spracovať.' });
    console.error(error);
  }
};

const autofillCommand = (command: CommandDefinition) => {
  consoleInput.value = `${command.command}${command.usage ? ' ' : ''}`;
  commandMenuOpen.value = false;
  consoleInputRef.value?.focus();
};

const showHelp = () => {
  $q.dialog({
    title: 'Dostupné príkazy',
    message: commandDefinitions
      .map((command) => `<strong>${command.command}</strong> ${command.usage} — ${command.description}`)
      .join('<br />'),
    html: true,
    persistent: true,
  });
};

const openCreateChannelDialog = () => {
  createChannelDialog.open = true;
  createChannelDialog.form = {
    name: '',
    type: 'public',
    description: '',
  };
};

const confirmChannelCreation = async () => {
  const { name, type, description } = createChannelDialog.form;
  const sanitized = sanitizeChannelName(name);

  if (!sanitized) {
    $q.notify({
      type: 'negative',
      message: 'Zadajte platný názov kanála.',
    });
    return;
  }

  try {
    const result = await executeCommand(
      currentUser.id,
      `/join ${sanitized}${type === 'private' ? ' private' : ''}`,
    );
    if (result.feedback) {
      $q.notify({ type: result.success ? 'positive' : 'warning', message: result.feedback });
    }

    await loadChannels();
    const channel = channels.value.find((item) => item.name === sanitized);
    if (channel) {
      channel.description = description || channel.description || '';
      selectedChannelId.value = channel.id;
    }
    createChannelDialog.open = false;
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Kanál sa nepodarilo vytvoriť.' });
    console.error(error);
  }
};

const reclaimChannel = async (channelName: string) => {
  const sanitized = sanitizeChannelName(channelName);
  if (!sanitized) {
    $q.notify({
      type: 'negative',
      message: 'Názov kanála musí obsahovať aspoň jeden znak.',
    });
    return;
  }

  try {
    await executeCommand(currentUser.id, `/join ${sanitized}`);
    await loadChannels();
    const channel = channels.value.find((item) => item.name === sanitized);
    if (channel) {
      selectedChannelId.value = channel.id;
      await refreshMessages(channel);
    }
    $q.notify({ type: 'positive', message: `Kanál #${sanitized} bol reaktivovaný.` });
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Kanál sa nepodarilo obnoviť.' });
    console.error(error);
  }
};

const logout = () => {
  clearCurrentUser();
  Object.assign(currentUser, emptyUser);
  subscribedChannels.clear();

  $q.notify({
    type: 'info',
    message: 'Boli ste odhlásený.',
  });

  router.push({ name: 'login' }).catch(() => {
    /* noop */
  });
};

let messagePollInterval: number | null = null;
let channelPollInterval: number | null = null;
let typingUpdateTimer: number | null = null;

const ensureSubscribed = async (channelId: string) => {
  if (subscribedChannels.has(channelId)) {
    return;
  }

  if (!currentUser.id) {
    return;
  }

  try {
    await socketRequest('channels:subscribe', { channelId, userId: currentUser.id });
    subscribedChannels.add(channelId);
  } catch (error) {
    console.error('Failed to subscribe to channel', channelId, error);
  }
};

const handleIncomingMessage = (payload: { message: MessageDto }) => {
  const message = payload.message;
  const channel = channels.value.find((item) => item.id === message.channelId);
  if (!channel) {
    return;
  }

  mergeMessages(channel, [message]);
  channel.lastActiveDays = 0;

  if (selectedChannelId.value !== channel.id) {
    channel.unread = (channel.unread ?? 0) + 1;
  } else {
    channel.unread = 0;
  }
};

onMounted(async () => {
  socket.on('channels:message:new', handleIncomingMessage);

  await loadChannels();
  if (selectedChannel.value) {
    await Promise.all([
      refreshMessages(selectedChannel.value),
      loadChannelMembers(selectedChannel.value),
      loadTypingForChannel(selectedChannel.value),
    ]);
  }

  messagePollInterval = window.setInterval(() => {
    const channel = selectedChannel.value;
    if (channel) {
      void refreshMessages(channel);
      void loadTypingForChannel(channel);
    }
  }, 4000);

  channelPollInterval = window.setInterval(() => {
    void loadChannels();
  }, 7000);
});

watch(() => consoleInput.value, (value) => {
  if (!value.startsWith('/')) {
    commandMenuOpen.value = false;
  } else {
    commandMenuOpen.value = filteredCommands.value.length > 0;
  }

  const channel = selectedChannel.value;
  if (!channel) {
    return;
  }

  if (!currentUser.id) {
    return;
  }

  if (typingUpdateTimer !== null) {
    window.clearTimeout(typingUpdateTimer);
  }

  typingUpdateTimer = window.setTimeout(() => {
    const content = value.startsWith('/') ? '' : value;
    void updateTypingState(channel.id, currentUser.id, content);
  }, 250);
});

watch(
  () => selectedChannelId.value,
  async (newId) => {
    if (!newId) {
      return;
    }

    const channel = channels.value.find((item) => item.id === newId);
    if (channel) {
      await Promise.all([refreshMessages(channel), loadChannelMembers(channel), loadTypingForChannel(channel)]);
    }
  },
);

watch(
  () => currentUser.status,
  async (newStatus, oldStatus) => {
    if (!newStatus || newStatus === oldStatus || !currentUser.id) {
      return;
    }

    try {
      await executeCommand(currentUser.id, `/status ${newStatus}`);
    } catch (error) {
      console.error(error);
    }
  },
);

onBeforeUnmount(() => {
  if (messagePollInterval !== null) {
    clearInterval(messagePollInterval);
    messagePollInterval = null;
  }

  if (channelPollInterval !== null) {
    clearInterval(channelPollInterval);
    channelPollInterval = null;
  }

  socket.off('channels:message:new', handleIncomingMessage);

  if (typingUpdateTimer !== null) {
    window.clearTimeout(typingUpdateTimer);
    typingUpdateTimer = null;
  }
});
</script>

<style scoped>
.home-page {
  background: #f5f6fa;
  height: 100%;
}

.workspace-grid {
  display: grid;
  grid-template-columns: 320px 1fr 320px;
  grid-gap: 16px;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
}

.workspace-column {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.sidebar {
  gap: 16px;
}

.main {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.inspector {
  gap: 16px;
}

.card {
  background: #ffffff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  display: flex;
  flex-direction: column;
}

.border-curve {
  border-radius: 12px;
}

.user-card__header {
  gap: 12px;
}

.user-card__status .status-toggle,
.user-card__notifications .visibility-toggle {
  border-radius: 999px;
  background: #f1f5f9;
}

.channels-card {
  flex: 1;
  min-height: 0;
}

.channels-card .q-item {
  align-items: flex-start;
}

.channels-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.channels-scroll--empty {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow-y: hidden;
}

.channel-item {
  border-radius: 12px;
  transition: background 0.2s ease;
}

.channel-item__main {
  min-width: 0;
}

.channel-item__title {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.channel-item__name {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.channel-item__badge {
  flex: 0 0 auto;
  margin-left: 0;
}

.channel-item__description {
  margin-top: 2px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
}

.channel-item--active {
  background: rgba(76, 110, 245, 0.12);
}

.channel-item--invite {
  border: 1px solid rgba(251, 191, 36, 0.4);
  background: rgba(251, 191, 36, 0.1);
}

.empty-placeholder {
  border: 1px dashed #d4d4d8;
  border-radius: 12px;
}

.main-header {
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 16px;
}

.messages-container {
  flex: 0 0 auto;
  max-height: clamp(320px, 55vh, 520px);
  position: relative;
}

.messages-container--empty {
  background: #f8fafc;
  border: 1px dashed #cbd5f5;
  border-radius: 12px;
}

.messages-scroll-wrapper {
  max-height: clamp(320px, 55vh, 520px);
  overflow-y: auto;
  padding-right: 12px;
}

.messages-scroll {
  min-height: 100%;
  padding-right: 4px;
}

.message {
  background: #f8fafc;
  border-radius: 12px;
  padding: 12px;
  border: 1px solid transparent;
}

.message--self {
  background: #eef2ff;
  border-color: rgba(99, 102, 241, 0.3);
}

.message--mention {
  border-color: rgba(37, 99, 235, 0.4);
  box-shadow: inset 2px 0 0 rgba(37, 99, 235, 0.35);
}

.message--system {
  background: #f3f4f6;
  font-style: italic;
}

.message-fade-enter-active,
.message-fade-leave-active {
  transition: opacity 0.2s;
}

.message-fade-enter-from,
.message-fade-leave-to {
  opacity: 0;
}

.typing-indicator {
  background: rgba(59, 130, 246, 0.08);
  border-radius: 12px;
  padding: 8px 12px;
}

.command-console {
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
  gap: 8px;
}

.command-input-wrapper {
  position: relative;
}

.command-suggestions {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 0;
  right: 0;
  border-radius: 12px;
  background: #ffffff;
  z-index: 10;
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
}

.inspector-card {
  flex: 0 0 auto;
}

.draft-stream {
  background: #f8fafc;
  border: 1px dashed #cbd5f5;
  border-radius: 12px;
  padding: 12px 16px;
}

.draft-message {
  padding: 8px 0;
}

.draft-message + .draft-message {
  border-top: 1px dashed #e2e8f0;
}

.draft-message__body {
  font-style: italic;
}

.empty-state {
  height: 100%;
  gap: 12px;
  text-align: center;
  color: #64748b;
}

@media (max-width: 1400px) {
  .workspace-grid {
    grid-template-columns: 300px 1fr;
  }

  .inspector {
    display: none;
  }
}

@media (max-width: 1100px) {
  .workspace-grid {
    grid-template-columns: 1fr;
  }

  .sidebar {
    order: 2;
  }

  .main {
    order: 1;
  }
}
</style>
