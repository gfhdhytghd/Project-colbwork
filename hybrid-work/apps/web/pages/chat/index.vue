<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter, useRoute } from '#imports';
import { useApi } from '~/utils/api';
import { useSession } from '~/stores/session';

interface ThreadParticipant {
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
}

interface ThreadMessage {
  id: string;
  body: string;
  createdAt: string;
  attachments?: any;
  sender: {
    id: string;
    name: string;
    email: string;
  };
}

interface ThreadSummary {
  id: string;
  type: 'DM' | 'GROUP';
  participants: ThreadParticipant[];
  messages: ThreadMessage[];
  createdAt: string;
}

interface UserSummary {
  id: string;
  name: string;
  email: string;
}

type VisibilityOption = 'PUBLIC' | 'FREEBUSY' | 'PRIVATE';
type ScheduleRequestStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'EXPIRED';

interface CalendarRequestAttachment {
  kind: 'calendar-request';
  requestId: string;
  targetUserId: string;
  title: string;
  startsAt?: string | null;
  endsAt?: string | null;
  location?: string | null;
  visibility?: VisibilityOption;
}

interface ScheduleRequestDTO {
  id: string;
  requester: UserSummary;
  targetUser: UserSummary;
  status: ScheduleRequestStatus;
  createdAt: string;
  decidedAt?: string | null;
}

const api = useApi();
const router = useRouter();
const route = useRoute();
const session = useSession();

const threads = ref<ThreadSummary[]>([]);
const messages = ref<ThreadMessage[]>([]);
const colleagues = ref<UserSummary[]>([]);
const selectedThreadId = ref<string | null>(null);
const messageDraft = ref('');
const isSending = ref(false);
const loadingThreads = ref(false);
const loadingMessages = ref(false);
const activeBlocks = ref<Record<string, { kind: 'REST' | 'FOCUS' | 'OOO' }>>({});
const presenceByUser = ref<Record<string, { location: 'OFFICE' | 'REMOTE'; deskLabel?: string }>>({});
const requestsById = ref<Record<string, ScheduleRequestDTO>>({});

const currentUser = computed(() => {
  if (!session.me) return null;
  const match = colleagues.value.find((user) => user.id === session.me?.['id']);
  return match ?? (session.me as UserSummary);
});

const currentThread = computed(() =>
  threads.value.find((thread) => thread.id === selectedThreadId.value) ?? null,
);

const availableRecipients = computed(() =>
  colleagues.value.filter((user) => user.id !== currentUser.value?.id),
);

const statusIcon = (kind: 'REST' | 'FOCUS' | 'OOO') => (kind === 'REST' ? '💤' : kind === 'FOCUS' ? '🎯' : '🚪');
const statusLabel = (kind: 'REST' | 'FOCUS' | 'OOO') => (kind === 'REST' ? 'Rest' : kind === 'FOCUS' ? 'Focus' : 'Out of office');

const threadTitle = (thread: ThreadSummary) => {
  if (thread.type === 'GROUP') return 'Group conversation';
  const viewerEmail = session.me?.['email'];
  const others = thread.participants
    .map((participant) => participant.user)
    .filter((participant) => !viewerEmail || participant.email !== viewerEmail);
  return others.length ? others.map((participant) => participant.name).join(', ') : 'Direct message';
};

const participantLine = (thread: ThreadSummary) => thread.participants.map((participant) => participant.user.name).join(', ');

function formatTimestamp(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

function formatDate(iso?: string | null) {
  if (!iso) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

async function loadUsers() {
  colleagues.value = (await api.get('/users')).data as UserSummary[];
}

async function loadThreads(selectId?: string) {
  loadingThreads.value = true;
  try {
    threads.value = (await api.get('/threads')).data as ThreadSummary[];
    const qThread = (route.query.thread as string | undefined) ?? undefined;
    if (qThread && threads.value.some((t) => t.id === qThread)) {
      selectedThreadId.value = qThread;
    } else if (selectId) {
      selectedThreadId.value = selectId;
    } else if (!selectedThreadId.value && threads.value.length) {
      selectedThreadId.value = threads.value[0].id;
    }
  } finally {
    loadingThreads.value = false;
  }
}

async function loadMessages(threadId: string) {
  loadingMessages.value = true;
  try {
    messages.value = (await api.get(`/threads/${threadId}/messages`)).data as ThreadMessage[];
  } finally {
    loadingMessages.value = false;
  }
}

async function refreshRequestMap() {
  const [incoming, outgoing] = await Promise.all([
    api.get('/calendar/requests', { params: { scope: 'incoming' } }),
    api.get('/calendar/requests', { params: { scope: 'outgoing' } }),
  ]);
  const map: Record<string, ScheduleRequestDTO> = {};
  for (const r of incoming.data as ScheduleRequestDTO[]) map[r.id] = r;
  for (const r of outgoing.data as ScheduleRequestDTO[]) map[r.id] = r;
  requestsById.value = map;
}

async function refreshActiveBlocks() {
  const others = new Set<string>();
  for (const t of threads.value) {
    if (t.type !== 'DM') continue;
    for (const p of t.participants) {
      const uid = p.user.id;
      if (uid && uid !== currentUser.value?.id) others.add(uid);
    }
  }
  if (!others.size) {
    activeBlocks.value = {};
    return;
  }
  const params = new URLSearchParams({ userIds: Array.from(others).join(',') });
  const { data } = await api.get(`/calendar/active-blocks?${params.toString()}`);
  const map: Record<string, { kind: 'REST' | 'FOCUS' | 'OOO' }> = {};
  for (const b of data as any[]) map[b.ownerId] = { kind: b.kind };
  activeBlocks.value = map;
}

async function refreshPresence() {
  const others = new Set<string>();
  for (const t of threads.value) {
    if (t.type !== 'DM') continue;
    for (const p of t.participants) {
      const uid = p.user.id;
      if (uid && uid !== currentUser.value?.id) others.add(uid);
    }
  }
  if (!others.size) {
    presenceByUser.value = {};
    return;
  }
  const params = new URLSearchParams({ userIds: Array.from(others).join(',') });
  const { data } = await api.get(`/presence/users?${params.toString()}`);
  const map: Record<string, { location: 'OFFICE' | 'REMOTE'; deskLabel?: string }> = {};
  for (const p of data as any[]) {
    map[p.userId] = {
      location: p.location as any,
      deskLabel: p.desk ? `${p.desk.floorId}-${p.desk.label}` : undefined,
    };
  }
  presenceByUser.value = map;
}

async function ensureMessages() {
  if (!selectedThreadId.value) {
    messages.value = [];
    return;
  }
  await loadMessages(selectedThreadId.value);
  await Promise.all([refreshRequestMap(), refreshActiveBlocks(), refreshPresence()]);
}

async function handleSend() {
  if (!selectedThreadId.value || !messageDraft.value.trim()) return;
  isSending.value = true;
  try {
    const { data } = await api.post(`/threads/${selectedThreadId.value}/messages`, {
      body: messageDraft.value.trim(),
    });
    messages.value = [...messages.value, data as ThreadMessage];
    messageDraft.value = '';
    await loadThreads(selectedThreadId.value);
    await refreshRequestMap();
  } finally {
    isSending.value = false;
  }
}

async function startConversation(userId: string) {
  const { data } = await api.post('/threads', { type: 'DM', participantIds: [userId] });
  const thread = data as ThreadSummary;
  await loadThreads(thread.id);
  await ensureMessages();
}

function isCalendarRequest(msg: ThreadMessage): msg is ThreadMessage & { attachments: CalendarRequestAttachment } {
  return !!msg.attachments && (msg.attachments as any).kind === 'calendar-request';
}

async function handleApprove(requestId: string) {
  await api.patch(`/calendar/requests/${requestId}`, { status: 'APPROVED' });
  await refreshRequestMap();
}

async function handleDecline(requestId: string) {
  await api.patch(`/calendar/requests/${requestId}`, { status: 'DECLINED' });
  await refreshRequestMap();
}

onMounted(async () => {
  await loadUsers();
  await loadThreads();
  await ensureMessages();
  const iv = setInterval(() => {
    refreshActiveBlocks();
    refreshPresence();
  }, 60000);
  onUnmounted(() => clearInterval(iv));
});

watch(selectedThreadId, async (next, prev) => {
  if (next && next !== prev) await ensureMessages();
});

watch(
  () => session.me?.['id'],
  async (next, prev) => {
    if (!next || next === prev) return;
    threads.value = [];
    messages.value = [];
    selectedThreadId.value = null;
    await loadUsers();
    await loadThreads();
    await ensureMessages();
  },
);
</script>

<template>
  <div class="flex flex-1 min-h-0 h-full">
    <aside class="w-[300px] border-r border-gray-200 bg-white overflow-y-auto min-h-0 h-full">
      <div class="flex items-center justify-between px-4 py-3 text-xs uppercase tracking-wide text-gray-500">
        <span>Threads</span>
        <span v-if="loadingThreads" class="text-[10px] text-gray-400">Loading…</span>
      </div>
      <ul class="space-y-1 px-2">
        <li v-for="thread in threads" :key="thread.id">
          <button
            class="w-full rounded px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-100"
            :class="{ 'bg-gray-100': thread.id === selectedThreadId }"
            @click="selectedThreadId = thread.id"
          >
            <div class="flex flex-col">
              <span class="font-medium text-gray-900">{{ threadTitle(thread) }}</span>
              <span v-if="thread.type === 'DM'" class="text-[11px] text-gray-500">
                <template v-for="participant in thread.participants" :key="participant.user.id">
                  <template v-if="participant.user.id !== currentUser?.id">
                    <template v-if="activeBlocks[participant.user.id]">
                      <span>{{ statusIcon(activeBlocks[participant.user.id].kind) }} {{ statusLabel(activeBlocks[participant.user.id].kind) }}</span>
                      <span> · </span>
                    </template>
                    <span>
                      at
                      {{
                        presenceByUser[participant.user.id]?.location === 'OFFICE' && presenceByUser[participant.user.id]?.deskLabel
                          ? presenceByUser[participant.user.id]?.deskLabel
                          : 'home'
                      }}
                    </span>
                  </template>
                </template>
              </span>
              <span class="truncate text-xs text-gray-500">
                {{ thread.messages[0]?.sender?.name ?? 'No messages yet' }}
                <template v-if="thread.messages[0]"> · {{ thread.messages[0]?.body }}</template>
              </span>
            </div>
          </button>
        </li>
      </ul>

      <div class="mt-6 border-t border-gray-200 px-4 pt-4">
        <h3 class="mb-2 text-xs uppercase tracking-wide text-gray-500">Start new chat</h3>
        <div class="flex flex-col gap-2">
          <button
            v-for="person in availableRecipients"
            :key="person.id"
            class="rounded border border-gray-200 px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-100"
            @click="startConversation(person.id)">
            Message {{ person.name }}
          </button>
        </div>
      </div>
    </aside>

    <section class="flex flex-1 min-h-0 h-full flex-col bg-white overflow-hidden">
      <header class="border-b border-gray-200 px-6 py-4 shrink-0">
        <h2 class="text-lg font-semibold text-gray-900">
          {{ currentThread ? threadTitle(currentThread) : 'Select a thread' }}
        </h2>
        <p v-if="currentThread" class="text-sm text-gray-500">
          {{ participantLine(currentThread) }}
        </p>
      </header>

      <div class="flex-1 overflow-y-auto min-h-0 px-6 py-4">
        <div v-if="!currentThread" class="text-gray-500">Choose a conversation or start a new one.</div>
        <div v-else-if="loadingMessages" class="text-gray-500">Loading messages…</div>

        <ul v-else class="space-y-4">
          <li v-for="message in messages" :key="message.id" class="flex flex-col gap-2">
            <div>
              <span class="text-sm font-medium" :class="message.sender.id === currentUser?.id ? 'text-emerald-700' : 'text-gray-800'">
                {{ message.sender.name }}
              </span>
              <span class="ml-2 text-xs text-gray-500">{{ formatTimestamp(message.createdAt) }}</span>
            </div>

            <template v-if="isCalendarRequest(message)">
              <div class="rounded border border-gray-200 bg-white p-3">
                <div class="text-sm font-medium text-gray-900">Calendar request: {{ message.attachments.title }}</div>
                <div class="text-xs text-gray-500">
                  {{ formatDate(message.attachments.startsAt) }}
                  <template v-if="message.attachments.endsAt"> – {{ formatDate(message.attachments.endsAt) }}</template>
                </div>
                <div v-if="message.attachments.location" class="mt-1 text-xs text-gray-500">
                  Location: {{ message.attachments.location }}
                </div>
                <div class="mt-2 flex flex-wrap gap-2">
                  <button class="rounded border border-gray-300 bg-white px-2 py-1 text-xs" @click="routerPushCalendar(message.attachments.targetUserId)">
                    View in Calendar
                  </button>
                  <template
                    v-if="requestsById[message.attachments.requestId]?.status === 'PENDING' &&
                      requestsById[message.attachments.requestId]?.targetUser.id === currentUser?.id"
                  >
                    <button class="rounded bg-emerald-500 px-2 py-1 text-xs font-medium text-emerald-950" @click="handleApprove(message.attachments.requestId)">
                      Approve
                    </button>
                    <button class="rounded bg-gray-200 px-2 py-1 text-xs" @click="handleDecline(message.attachments.requestId)">
                      Decline
                    </button>
                  </template>
                  <span v-else class="text-xs text-gray-500">
                    Status: {{ requestsById[message.attachments.requestId]?.status || 'PENDING' }}
                  </span>
                </div>
              </div>
            </template>

            <p v-else class="whitespace-pre-line text-gray-900">{{ message.body }}</p>
          </li>
        </ul>
      </div>

      <footer class="border-t border-gray-200 bg-white px-6 py-4 shrink-0">
        <form class="flex gap-3" @submit.prevent="handleSend">
          <input
            v-model="messageDraft"
            class="flex-1 rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-emerald-400 focus:outline-none"
            placeholder="Type a message"
            :disabled="!currentThread"
          />
          <button
            class="rounded bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950 disabled:cursor-not-allowed disabled:bg-emerald-300"
            type="submit"
            :disabled="!currentThread || !messageDraft.trim() || isSending"
          >
            {{ isSending ? 'Sending…' : 'Send' }}
          </button>
        </form>
      </footer>
    </section>
  </div>
</template>
