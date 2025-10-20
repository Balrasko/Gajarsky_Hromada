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

          <q-scroll-area class="channels-scroll q-mt-sm">
            <q-list dense>
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

                <q-item-section>
                  <q-item-label class="text-body2 text-weight-medium">
                    #{{ channel.name }}
                    <q-badge
                      v-if="channel.hasInvite && !channel.isMember"
                      color="orange-7"
                      text-color="white"
                      label="Invite"
                      class="q-ml-sm"
                    />
                    <q-badge
                      v-if="channel.ownerId === currentUser.id"
                      color="purple-7"
                      text-color="white"
                      label="Admin"
                      class="q-ml-sm"
                    />
                  </q-item-label>
                  <q-item-label caption class="ellipsis">
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
              v-if="sortedActiveChannels.length === 0"
              class="empty-placeholder column items-center text-caption text-grey-6 q-py-xl"
            >
              <q-icon name="chat_bubble_outline" size="32px" class="q-mb-sm" />
              Žiadne kanály. Vytvorte nový cez tlačidlo alebo príkaz /join.
            </div>
          </q-scroll-area>
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
            <q-btn
              v-if="selectedChannel"
              outline
              color="secondary"
              label="Simulovať novú správu"
              icon="auto_mode"
              @click="simulateIncomingMessage(selectedChannel)"
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
                    <span class="text-caption text-grey-6">{{ message.createdAt }}</span>
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
import { uid, useQuasar } from 'quasar';
import type { UserDto } from '@vpwa/shared';
import { useRouter } from 'vue-router';

type ChannelType = 'public' | 'private';
type MemberRole = 'owner' | 'admin' | 'member';
type AppVisibilityState = 'visible' | 'hidden';

interface Message {
  id: string;
  sender: string;
  content: string;
  createdAt: string;
  addressedTo?: string | undefined;
  system?: boolean;
}

interface ChannelMember extends UserDto {
  role: MemberRole;
  draftSamples: string[];
}

interface DraftPreview {
  id: string;
  nickName: string;
  body: string;
}

interface ChannelPrototype {
  id: string;
  name: string;
  type: ChannelType;
  description: string;
  ownerId: string;
  isMember: boolean;
  hasInvite: boolean;
  pinned: boolean;
  archived: boolean;
  lastActiveDays: number;
  unread: number;
  typingMembers: string[];
  members: ChannelMember[];
  pendingInvites: string[];
  bannedMembers: string[];
  pendingKickVotes: Record<string, number>;
  messages: Message[];
}

interface CommandDefinition {
  command: string;
  usage: string;
  description: string;
}

const $q = useQuasar();
const router = useRouter();

const currentUser = reactive<UserDto>({
  id: 'u-you',
  firstName: 'Ema',
  lastName: 'Nováková',
  nickName: 'ema',
  email: 'ema@example.com',
  status: 'online',
});

const notificationSettings = reactive({
  enabled: true,
  mentionsOnly: false,
  bannersWhenHidden: true,
});

const appVisibility = ref<AppVisibilityState>('visible');

const mockUsers: ChannelMember[] = [
  {
    id: 'u-you',
    firstName: currentUser.firstName,
    lastName: currentUser.lastName,
    nickName: currentUser.nickName,
    email: currentUser.email,
    status: currentUser.status,
    role: 'owner',
    draftSamples: [
      'Práve dokončujem rekapituláciu meetingu.',
      'Práve dokončujem rekapituláciu meetingu…',
      'Práve dokončujem rekapituláciu meetingu. Pošlem to o chvíľu.',
    ],
  },
  {
    id: 'u-ada',
    firstName: 'Ada',
    lastName: 'Horváth',
    nickName: 'ada',
    email: 'ada@example.com',
    status: 'online',
    role: 'admin',
    draftSamples: [
      'Pracujem na wireframe pre onboarding.',
      'Pracujem na wireframe pre onboarding…',
      'Vyzerá to dobre, zdieľam čoskoro!',
    ],
  },
  {
    id: 'u-gab',
    firstName: 'Gabriel',
    lastName: 'Kováč',
    nickName: 'gabo',
    email: 'gabo@example.com',
    status: 'dnd',
    role: 'member',
    draftSamples: [
      'Mám návrh k API endpointom.',
      'Mám návrh k API endpointom…',
      'Mám návrh k API endpointom. Posielam hneď ako dokončím.',
    ],
  },
  {
    id: 'u-lia',
    firstName: 'Lia',
    lastName: 'Šimková',
    nickName: 'lia',
    email: 'lia@example.com',
    status: 'offline',
    role: 'member',
    draftSamples: [
      'Kontrolujem testovacie scenáre.',
      'Kontrolujem testovacie scenáre…',
      'Kontrolujem testovacie scenáre. Update odošlem.',
    ],
  },
];

const buildMessages = (channelName: string, amount: number): Message[] => {
  const sampleBodies = [
    `Nastavil som nový sprint board pre #${channelName}.`,
    `Pripomienka: dnes o 15:00 sync call.`,
    `Zdieľam poznámky z retrospektívy.`,
    `@ema môžeš skontrolovať posledný commit?`,
    `Pridala som screenshoty do wiki.`,
    `Budúci týždeň testujeme novú notifikačnú logiku.`,
  ];

  const authors: string[] = ['ada', 'gabo', 'lia', currentUser.nickName];
  const result: Message[] = [];

  for (let index = 0; index < amount; index += 1) {
    const sender = authors[index % authors.length]!;
    const addressedTo = index % 5 === 0 ? 'ema' : undefined;
    const content = sampleBodies[index % sampleBodies.length]!;
    result.push({
      id: uid(),
      sender,
      content,
      createdAt: new Date(Date.now() - index * 600000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      addressedTo,
    });
  }

  return result;
};

const channels = ref<ChannelPrototype[]>([
  {
    id: 'general',
    name: 'general',
    type: 'public',
    description: 'Firemné oznamy a celofiremná diskusia.',
    ownerId: 'u-you',
    isMember: true,
    hasInvite: false,
    pinned: true,
    archived: false,
    lastActiveDays: 1,
    unread: 0,
    typingMembers: ['ada'],
    members: mockUsers.map((member) => ({
      ...member,
      role: member.id === 'u-you' ? 'owner' : member.role,
    })),
    pendingInvites: [],
    bannedMembers: [],
    pendingKickVotes: {},
    messages: buildMessages('general', 40),
  },
  {
    id: 'design-review',
    name: 'design-review',
    type: 'private',
    description: 'Súkromná miestnosť pre dizajnové iterate.',
    ownerId: 'u-ada',
    isMember: true,
    hasInvite: false,
    pinned: false,
    archived: false,
    lastActiveDays: 5,
    unread: 3,
    typingMembers: ['gabo'],
    members: mockUsers.filter((member) => member.nickName !== 'lia').map((member) => ({
      ...member,
      role: member.id === 'u-ada' ? 'owner' : member.role,
    })),
    pendingInvites: ['lia'],
    bannedMembers: [],
    pendingKickVotes: {},
    messages: buildMessages('design-review', 25),
  },
  {
    id: 'research-lab',
    name: 'research-lab',
    type: 'public',
    description: 'Pozvánka čaká na vaše potvrdenie.',
    ownerId: 'u-lia',
    isMember: false,
    hasInvite: true,
    pinned: true,
    archived: false,
    lastActiveDays: 3,
    unread: 0,
    typingMembers: [],
    members: mockUsers.filter((member) => member.nickName !== 'gabo'),
    pendingInvites: ['ema'],
    bannedMembers: [],
    pendingKickVotes: {},
    messages: buildMessages('research-lab', 12),
  },
  {
    id: 'retro-2023',
    name: 'retro-2023',
    type: 'public',
    description: 'Kanál expiroval po 30 dňoch neaktivity.',
    ownerId: 'u-ada',
    isMember: false,
    hasInvite: false,
    pinned: false,
    archived: true,
    lastActiveDays: 46,
    unread: 0,
    typingMembers: [],
    members: [],
    pendingInvites: [],
    bannedMembers: [],
    pendingKickVotes: {},
    messages: [],
  },
]);

const offlineQueue = reactive<Record<string, Message[]>>({});

const syncMemberStatus = (userId: string, status: UserDto['status']) => {
  channels.value.forEach((channel) => {
    const member = channel.members.find((candidate) => candidate.id === userId);
    if (member) {
      member.status = status;
    }
  });
};

const selectedChannelId = ref<string | null>(
  channels.value.find((channel) => channel.isMember && !channel.archived)?.id ?? null,
);

const consoleInput = ref('');
const consoleInputRef = ref<{ focus: () => void } | null>(null);

const commandMenuOpen = ref(false);
const messageDisplayCount = ref(20);

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
    .filter((channel) => channel.isMember && !channel.archived)
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

const visibleMessages = computed(() => {
  if (!selectedChannel.value) {
    return [] as Message[];
  }

  const totalMessages = selectedChannel.value.messages.length;
  return selectedChannel.value.messages.slice(Math.max(0, totalMessages - messageDisplayCount.value));
});

const consolePlaceholder = computed(() => {
  if (!selectedChannel.value) {
    return 'Napíšte /join nazov-kanala alebo prijmite pozvánku.';
  }

  return 'Napíšte správu alebo príkaz (napr. /invite nickName)';
});

const channelItemClasses = (channel: ChannelPrototype) => ({
  'channel-item': true,
  'channel-item--active': selectedChannelId.value === channel.id,
  'channel-item--invite': channel.hasInvite && !channel.isMember,
});

const typingIndicator = (channel: ChannelPrototype) => {
  if (!channel.typingMembers.length) {
    return '';
  }

  const typingList = channel.typingMembers.map((nick) => `@${nick}`).join(', ');
  return `${typingList} práve píšu…`;
};

const channelOwnerName = (channel: ChannelPrototype) => {
  const owner = channel.members.find((member) => member.id === channel.ownerId);
  if (!owner) {
    return '@' + channelOwnerFallback(channel.ownerId);
  }
  return '@' + owner.nickName;
};

const channelOwnerFallback = (ownerId: string) => {
  const member = mockUsers.find((user) => user.id === ownerId);
  return member?.nickName ?? 'unknown';
};

const messageClasses = (message: Message) => ({
  message: true,
  'message--self': message.sender === currentUser.nickName && !message.system,
  'message--mention': message.addressedTo === currentUser.nickName,
  'message--system': !!message.system,
});

const draftTicker = ref(0);
let draftInterval: number | null = null;

const typingDrafts = computed<DraftPreview[]>(() => {
  const channel = selectedChannel.value;
  if (!channel) {
    return [];
  }

  return channel.typingMembers
    .map((nickName, index) => {
      const member = channel.members.find((candidate) => candidate.nickName === nickName);
      if (!member || member.draftSamples.length === 0) {
        return null;
      }

      const sampleIndex =
        member.draftSamples.length === 0 ? 0 : (draftTicker.value + index) % member.draftSamples.length;
      const body = member.draftSamples[sampleIndex] ?? '';

      if (!body) {
        return null;
      }

      return {
        id: `${channel.id}-${nickName}-draft-${draftTicker.value}`,
        nickName,
        body,
      };
    })
    .filter((preview): preview is DraftPreview => preview !== null);
});

const loadMoreMessages = (_index: number, done: (stop?: boolean) => void) => {
  if (!selectedChannel.value) {
    done();
    return;
  }

  if (messageDisplayCount.value >= selectedChannel.value.messages.length) {
    done();
    return;
  }

  setTimeout(() => {
    messageDisplayCount.value += 15;
    done();
  }, 400);
};

const selectChannel = (channelId: string) => {
  const channel = channels.value.find((item) => item.id === channelId);
  if (!channel) {
    return;
  }

  if (channel.hasInvite && !channel.isMember) {
    acceptInvite(channel);
  }

  selectedChannelId.value = channelId;
  channel.unread = 0;
  messageDisplayCount.value = 20;
};

const acceptInvite = (channel: ChannelPrototype) => {
  channel.isMember = true;
  channel.hasInvite = false;
  channel.unread = 0;
  selectedChannelId.value = channel.id;
  channel.typingMembers = [];

  $q.notify({
    type: 'positive',
    message: `Pripojené ku kanálu #${channel.name}.`,
  });
};

const rejectInvite = (channel: ChannelPrototype) => {
  channel.hasInvite = false;
  channel.isMember = false;
  $q.notify({
    type: 'info',
    message: `Pozvánka do kanála #${channel.name} bola odmietnutá.`,
  });
};

const leaveChannel = (channel: ChannelPrototype) => {
  if (channel.ownerId === currentUser.id) {
    closeChannel(channel);
    return;
  }

  channel.isMember = false;
  if (selectedChannelId.value === channel.id) {
    selectedChannelId.value =
      sortedActiveChannels.value.find((item) => item.id !== channel.id)?.id ?? null;
  }

  $q.notify({
    type: 'info',
    message: `Opustili ste kanál #${channel.name}.`,
  });
};

const closeChannel = (channel: ChannelPrototype) => {
  channel.archived = true;
  channel.isMember = false;
  channel.hasInvite = false;
  channel.pendingInvites = [];

  if (selectedChannelId.value === channel.id) {
    selectedChannelId.value =
      sortedActiveChannels.value.find((item) => item.id !== channel.id)?.id ?? null;
  }

  $q.notify({
    type: 'warning',
    message: `Kanál #${channel.name} bol zrušený. Názov je opäť dostupný.`,
  });
};

const reclaimChannel = (channelName: string) => {
  const sanitized = sanitizeChannelName(channelName);
  if (!sanitized) {
    $q.notify({
      type: 'negative',
      message: 'Názov kanála musí obsahovať aspoň jeden znak.',
    });
    return;
  }

  const activeExists = channels.value.some(
    (channel) => channel.name === sanitized && !channel.archived,
  );
  if (activeExists) {
    $q.notify({
      type: 'info',
      message: `Kanál #${sanitized} je už aktívny.`,
    });
    selectedChannelId.value =
      channels.value.find((channel) => channel.name === sanitized && !channel.archived)?.id ?? null;
    return;
  }

  const dormantChannel = channels.value.find(
    (channel) => channel.name === sanitized && channel.archived,
  );

  if (!dormantChannel) {
    $q.notify({
      type: 'warning',
      message: `Kanál #${sanitized} sa medzi archívmi nenašiel.`,
    });
    return;
  }

  dormantChannel.archived = false;
  dormantChannel.isMember = true;
  dormantChannel.ownerId = currentUser.id;
  dormantChannel.hasInvite = false;
  dormantChannel.pinned = false;
  dormantChannel.lastActiveDays = 0;
  dormantChannel.unread = 0;
  dormantChannel.typingMembers = [];
  dormantChannel.pendingInvites = [];
  dormantChannel.bannedMembers = [];
  dormantChannel.pendingKickVotes = {};
  dormantChannel.members = mockUsers.map((member) => ({
    ...member,
    role: member.id === currentUser.id ? 'owner' : 'member',
  }));
  dormantChannel.messages = [
    {
      id: uid(),
      sender: 'system',
      content: `Kanál #${sanitized} bol znovu aktivovaný.`,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      system: true,
    },
  ];

  selectedChannelId.value = dormantChannel.id;

  $q.notify({
    type: 'positive',
    message: `Kanál #${sanitized} bol úspešne reaktivovaný.`,
  });
};

const sendMessage = (content: string) => {
  const channel = selectedChannel.value;
  if (!channel) {
    $q.notify({
      type: 'warning',
      message: 'Najprv si vyberte kanál.',
    });
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

  const mentionMatch = trimmed.match(/@(\w+)/);
  const addressedTo = mentionMatch ? mentionMatch[1] : undefined;

  const message: Message = {
    id: uid(),
    sender: currentUser.nickName,
    content: trimmed,
    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    addressedTo,
  };

  channel.messages.push(message);
  channel.lastActiveDays = 0;
};

const handleConsoleSubmit = () => {
  const input = consoleInput.value.trim();
  if (!input) {
    return;
  }

  if (input.startsWith('/')) {
    handleCommand(input);
  } else {
    sendMessage(input);
  }

  consoleInput.value = '';
  commandMenuOpen.value = false;
};

const sanitizeChannelName = (rawName: string) =>
  rawName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_\s]/g, '')
    .replace(/\s+/g, '-');

const ensureChannel = (name: string, type: ChannelType) => {
  const sanitized = sanitizeChannelName(name);
  if (!sanitized) {
    return null;
  }

  const existing = channels.value.find((channel) => channel.name === sanitized && !channel.archived);
  if (existing) {
    return existing;
  }

  const archivedChannel = channels.value.find(
    (channel) => channel.name === sanitized && channel.archived,
  );
  if (archivedChannel) {
    archivedChannel.archived = false;
    archivedChannel.isMember = true;
    archivedChannel.ownerId = currentUser.id;
    archivedChannel.type = type;
    archivedChannel.description = 'Znovuaktivovaný cez príkaz /join.';
    archivedChannel.lastActiveDays = 0;
    archivedChannel.unread = 0;
    archivedChannel.typingMembers = [];
    archivedChannel.pendingInvites = [];
    archivedChannel.bannedMembers = [];
    archivedChannel.pendingKickVotes = {};
    archivedChannel.members = mockUsers.map((member) => ({
      ...member,
      role: member.id === currentUser.id ? 'owner' : 'member',
    }));
    archivedChannel.messages.push({
      id: uid(),
      sender: 'system',
      content: `Kanál bol znovu aktivovaný používateľom @${currentUser.nickName}.`,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      system: true,
    });
    return archivedChannel;
  }

  const newChannel: ChannelPrototype = {
    id: uid(),
    name: sanitized,
    type,
    description: 'Nový kanál vytvorený cez príkaz /join.',
    ownerId: currentUser.id,
    isMember: true,
    hasInvite: false,
    pinned: false,
    archived: false,
    lastActiveDays: 0,
    unread: 0,
    typingMembers: [],
    members: mockUsers.map((member) => ({
      ...member,
      role: member.id === currentUser.id ? 'owner' : 'member',
    })),
    pendingInvites: [],
    bannedMembers: [],
    pendingKickVotes: {},
    messages: [
      {
        id: uid(),
        sender: 'system',
        content: `Kanál #${sanitized} bol vytvorený.`,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        system: true,
      },
    ],
  };

  channels.value.push(newChannel);
  return newChannel;
};

const handleCommand = (input: string) => {
  const [command, ...rawArgs] = input.split(/\s+/);
  const args = rawArgs.filter(Boolean);

  switch (command) {
    case '/join': {
      if (args.length === 0) {
        $q.notify({
          type: 'warning',
          message: 'Použitie: /join channelName [private]',
        });
        break;
      }

      const name = args[0]!;
      const type = (args[1] === 'private' ? 'private' : 'public') as ChannelType;
      const channel = ensureChannel(name, type);

      if (!channel) {
        $q.notify({
          type: 'negative',
          message: 'Kanál musí mať platný názov.',
        });
        break;
      }

      if (channel.bannedMembers.includes(currentUser.nickName)) {
        $q.notify({
          type: 'negative',
          message: `Máte trvalý zákaz pre #${channel.name}.`,
        });
        break;
      }

      channel.isMember = true;
      channel.hasInvite = false;
      channel.unread = 0;
      selectedChannelId.value = channel.id;

      $q.notify({
        type: 'positive',
        message: `Pripojené ku kanálu #${channel.name}.`,
      });

      break;
    }

    case '/invite': {
      const channel = selectedChannel.value;
      if (!channel) {
        $q.notify({
          type: 'warning',
          message: 'Najprv vyberte kanál.',
        });
        break;
      }

      if (args.length < 1) {
        $q.notify({
          type: 'warning',
          message: 'Použitie: /invite nickName',
        });
        break;
      }

      const nickName = args[0]!;
      if (channel.type === 'private' && currentUser.id !== channel.ownerId) {
        $q.notify({
          type: 'negative',
          message: 'Pozývať do súkromného kanála môže iba správca.',
        });
        break;
      }

      if (!channel.pendingInvites.includes(nickName)) {
        channel.pendingInvites.push(nickName);
      }

      channel.hasInvite = channel.pendingInvites.some((nick) => nick === currentUser.nickName);

      $q.notify({
        type: 'positive',
        message: `Pozvánka pre @${nickName} odoslaná.`,
      });
      break;
    }

    case '/revoke': {
      const channel = selectedChannel.value;
      if (!channel) {
        $q.notify({
          type: 'warning',
          message: 'Najprv vyberte kanál.',
        });
        break;
      }

      if (args.length < 1) {
        $q.notify({
          type: 'warning',
          message: 'Použitie: /revoke nickName',
        });
        break;
      }

      const nickName = args[0]!;
      channel.pendingInvites = channel.pendingInvites.filter((item) => item !== nickName);
      channel.hasInvite = channel.pendingInvites.includes(currentUser.nickName);

      $q.notify({
        type: 'info',
        message: `Pozvánka pre @${nickName} bola zrušená.`,
      });
      break;
    }

    case '/kick': {
      const channel = selectedChannel.value;
      if (!channel) {
        $q.notify({
          type: 'warning',
          message: 'Najprv vyberte kanál.',
        });
        break;
      }

      if (args.length < 1) {
        $q.notify({
          type: 'warning',
          message: 'Použitie: /kick nickName',
        });
        break;
      }

      const targetNick = args[0]!;
      if (channel.ownerId === currentUser.id) {
        performKick(channel, targetNick, true);
        break;
      }

      performKick(channel, targetNick, false);
      break;
    }

    case '/quit': {
      const channel = selectedChannel.value;
      if (!channel) {
        $q.notify({
          type: 'warning',
          message: 'Najprv vyberte kanál.',
        });
        break;
      }

      if (channel.ownerId !== currentUser.id) {
        $q.notify({
          type: 'negative',
          message: 'Len správca môže zrušiť kanál.',
        });
        break;
      }

      closeChannel(channel);
      break;
    }

    case '/cancel': {
      const channel = selectedChannel.value;
      if (!channel) {
        $q.notify({
          type: 'warning',
          message: 'Najprv vyberte kanál.',
        });
        break;
      }

      leaveChannel(channel);
      break;
    }

    case '/list': {
      if (!selectedChannel.value) {
        $q.notify({
          type: 'warning',
          message: 'Najprv vyberte kanál.',
        });
        break;
      }

      $q.notify({
        type: 'info',
        multiLine: true,
        message: selectedChannel.value.members
          .map((member) => `@${member.nickName} (${member.status})`)
          .join(', '),
        caption: 'Členovia kanála',
        timeout: 4000,
      });
      break;
    }

    case '/help':
    default: {
      showHelp();
      break;
    }
  }
};

const performKick = (channel: ChannelPrototype, nickName: string, isAdminKick: boolean) => {
  if (channel.ownerId === currentUser.id && nickName === currentUser.nickName) {
    $q.notify({
      type: 'negative',
      message: 'Nemôžete vyhodiť sami seba.',
    });
    return;
  }

  channel.pendingKickVotes[nickName] = (channel.pendingKickVotes[nickName] ?? 0) + 1;

  if (isAdminKick || channel.pendingKickVotes[nickName] >= 3) {
    channel.members = channel.members.filter((member) => member.nickName !== nickName);
    channel.bannedMembers.push(nickName);
    delete channel.pendingKickVotes[nickName];

    $q.notify({
      type: 'warning',
      message: `@${nickName} bol odstránený z kanála.`,
    });
  } else {
    const remainingVotes = Math.max(0, 3 - channel.pendingKickVotes[nickName]);
    $q.notify({
      type: 'info',
      message: `Hlas odoslaný. Potrebné hlasy na vyhodenie: ${remainingVotes}.`,
    });
  }
};

const simulateIncomingMessage = (channel: ChannelPrototype) => {
  const candidates = channel.members.filter((member) => member.nickName !== currentUser.nickName);
  if (candidates.length === 0) {
    return;
  }

  const author = candidates[Math.floor(Math.random() * candidates.length)]!;
  const addressed = Math.random() > 0.6 ? currentUser.nickName : undefined;
  const contentPool = [
    'Práve som dokončil úlohu, prosím review.',
    '@ema môžeš sa pozrieť na posledný ticket?',
    'Aktualizoval som dokumentáciu.',
    'Prichádza nová správa do tohoto kanála!',
  ];
  const content = contentPool[Math.floor(Math.random() * contentPool.length)];

  if (!content) {
    return;
  }

  const message: Message = {
    id: uid(),
    sender: author.nickName,
    content,
    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    addressedTo: addressed,
  };

  if (currentUser.status === 'offline') {
    const queue = offlineQueue[channel.id] ?? (offlineQueue[channel.id] = []);
    queue.push(message);
    return;
  }

  channel.messages.push(message);
  channel.lastActiveDays = 0;

  if (selectedChannelId.value !== channel.id) {
    channel.unread += 1;
  }

  maybeNotify(channel, message);
};

const maybeNotify = (channel: ChannelPrototype, message: Message) => {
  if (message.sender === currentUser.nickName) {
    return;
  }

  if (!notificationSettings.enabled) {
    return;
  }

  if (notificationSettings.mentionsOnly && message.addressedTo !== currentUser.nickName) {
    return;
  }

  if (notificationSettings.bannersWhenHidden && appVisibility.value !== 'hidden') {
    return;
  }

  if (currentUser.status === 'dnd') {
    return;
  }

  $q.notify({
    icon: 'notifications',
    color: 'primary',
    message: `${message.sender} v #${channel.name}`,
    caption: message.content.slice(0, 72),
    timeout: 3000,
  });
};

const flushOfflineQueue = () => {
  Object.entries(offlineQueue).forEach(([channelId, queuedMessages]) => {
    const channel = channels.value.find((item) => item.id === channelId);
    if (!channel || queuedMessages.length === 0) {
      return;
    }

    queuedMessages.forEach((message) => {
      channel.messages.push(message);
      channel.lastActiveDays = 0;
      if (selectedChannelId.value !== channel.id) {
        channel.unread += 1;
      }
      maybeNotify(channel, message);
    });

    offlineQueue[channelId] = [];
  });
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

const confirmChannelCreation = () => {
  const { name, type, description } = createChannelDialog.form;
  const sanitized = sanitizeChannelName(name);

  if (!sanitized) {
    $q.notify({
      type: 'negative',
      message: 'Zadajte platný názov kanála.',
    });
    return;
  }

  const exists = channels.value.some((channel) => channel.name === sanitized && !channel.archived);
  if (exists) {
    $q.notify({
      type: 'negative',
      message: `Kanál #${sanitized} už existuje.`,
    });
    return;
  }

  const channel = ensureChannel(sanitized, type);
  if (!channel) {
    return;
  }

  channel.description = description || 'Nový kanál vytvorený z modálneho dialógu.';
  selectedChannelId.value = channel.id;
  createChannelDialog.open = false;
};

const logout = () => {
  $q.notify({
    type: 'info',
    message: 'Odhlásenie prebehlo (placeholder).',
  });

  router.push({ name: 'login' }).catch(() => {
    /* noop */
  });
};

onMounted(() => {
  draftInterval = window.setInterval(() => {
    draftTicker.value += 1;
  }, 1600);
});

watch(() => consoleInput.value, (value) => {
  if (!value.startsWith('/')) {
    commandMenuOpen.value = false;
    return;
  }
  commandMenuOpen.value = filteredCommands.value.length > 0;
});

watch(
  () => currentUser.status,
  (newStatus, oldStatus) => {
    const userMock = mockUsers.find((user) => user.id === currentUser.id);
    if (userMock) {
      userMock.status = newStatus;
    }

    syncMemberStatus(currentUser.id, newStatus);

    if (newStatus === 'online' && oldStatus === 'offline') {
      flushOfflineQueue();
      $q.notify({
        type: 'positive',
        message: 'Vrátili ste sa online, kanály boli synchronizované.',
      });
    }
  },
);

watch(selectedChannelId, () => {
  messageDisplayCount.value = 20;
});

onBeforeUnmount(() => {
  if (draftInterval !== null) {
    clearInterval(draftInterval);
    draftInterval = null;
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

.channels-scroll {
  flex: 1;
  min-height: 0;
}

.channel-item {
  border-radius: 12px;
  transition: background 0.2s ease;
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
