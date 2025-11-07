<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
const FullCalendar = defineAsyncComponent(() => import('@fullcalendar/vue3'));
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
// FullCalendar v6 ESM builds don't include CSS files. We rely on core styles.
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from '#imports';
import { useApi } from '~/utils/api';
import { useSession } from '~/stores/session';

type VisibilityOption = 'PUBLIC' | 'FREEBUSY' | 'PRIVATE';
type BlockKindOption = 'REST' | 'FOCUS' | 'OOO';

type CalendarEventDTO = {
  id: string;
  ownerId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  visibility: VisibilityOption;
  location?: string | null;
};

type AvailabilityBlockDTO = {
  id: string;
  ownerId: string;
  startsAt: string;
  endsAt: string;
  kind: BlockKindOption;
  visibility: VisibilityOption;
};

type UserSummary = {
  id: string;
  name: string;
  email: string;
};

type ScheduleRequest = {
  id: string;
  requester: UserSummary;
  targetUser: UserSummary;
  eventDraft: Record<string, unknown> | null;
  notes?: string | null;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'EXPIRED';
  createdAt: string;
  decidedAt?: string | null;
};

const api = useApi();
const session = useSession();

const colleagues = ref<UserSummary[]>([]);
const selectedOwner = ref<'me' | string>('me');
const calendarRange = ref<{ start: Date; end: Date } | null>(null);
const events = ref<any[]>([]);
const isCreatingEvent = ref(false);
const isCreatingBlock = ref(false);
const isCreatingRequest = ref(false);
const requestError = ref<string | null>(null);
const requestSuccess = ref<string | null>(null);

const newEvent = reactive({
  title: '',
  startsAt: '',
  endsAt: '',
  visibility: 'PUBLIC' as VisibilityOption,
  location: '',
});

const newBlock = reactive({
  startsAt: '',
  endsAt: '',
  kind: 'REST' as BlockKindOption,
  visibility: 'FREEBUSY' as VisibilityOption,
});

const newRequest = reactive({
  title: '',
  startsAt: '',
  endsAt: '',
  visibility: 'FREEBUSY' as VisibilityOption,
  location: '',
  notes: '',
});

const incomingRequests = ref<ScheduleRequest[]>([]);
const outgoingRequests = ref<ScheduleRequest[]>([]);

const selectedEvent = ref<CalendarEventDTO | null>(null);
const editEvent = reactive({
  title: '',
  startsAt: '',
  endsAt: '',
  visibility: 'PUBLIC' as VisibilityOption,
  location: '',
});
const eventSaving = ref(false);
const eventDeleting = ref(false);
const eventError = ref<string | null>(null);
const eventSuccess = ref<string | null>(null);

const visibilityColors: Record<VisibilityOption, string> = {
  PUBLIC: '#34d399',
  FREEBUSY: '#a855f7',
  PRIVATE: '#64748b',
};

const blockColors: Record<BlockKindOption, string> = {
  REST: '#fb923c',
  FOCUS: '#0ea5e9',
  OOO: '#f97316',
};

const blockLabels: Record<BlockKindOption, string> = {
  REST: 'Rest block',
  FOCUS: 'Focus block',
  OOO: 'Out of office',
};

const currentUser = computed(() => {
  if (!session.me) return null;
  const match = colleagues.value.find((user) => user.id === session.me?.['id']);
  return match ?? (session.me as UserSummary);
});

const ownerOptions = computed(() => [
  { label: 'Me', value: 'me' },
  ...colleagues.value.map((user) => ({ label: user.name, value: user.id })),
]);

const selectedOwnerUser = computed(() => {
  if (selectedOwner.value === 'me') {
    return currentUser.value;
  }
  return colleagues.value.find((user) => user.id === selectedOwner.value) ?? null;
});

const calendarKey = computed(() => `${session.me?.['id'] ?? 'anonymous'}-${selectedOwner.value}`);

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  locale: 'en',
  initialView: 'timeGridWeek',
  events: events.value,
  height: '100%',
  headerToolbar: {
    start: 'prev,next today',
    center: 'title',
    end: 'dayGridMonth,timeGridWeek,timeGridDay',
  },
  datesSet: (arg: any) => {
    calendarRange.value = { start: arg.start, end: arg.end };
  },
  eventClick: (info: any) => {
    const props = info.event.extendedProps as CalendarEventDTO;
    selectedEvent.value = {
      ...props,
      id: info.event.id,
      title: info.event.title,
      startsAt: info.event.start ? info.event.start.toISOString() : props.startsAt,
      endsAt: info.event.end ? info.event.end.toISOString() : props.endsAt,
    };
    editEvent.title = selectedEvent.value.title;
    editEvent.startsAt = isoToInput(selectedEvent.value.startsAt);
    editEvent.endsAt = isoToInput(selectedEvent.value.endsAt);
    editEvent.location = selectedEvent.value.location || '';
    editEvent.visibility = selectedEvent.value.visibility;
    eventError.value = null;
    eventSuccess.value = null;
  },
}));

function resetEventForm() {
  newEvent.title = '';
  newEvent.startsAt = '';
  newEvent.endsAt = '';
  newEvent.location = '';
  newEvent.visibility = 'PUBLIC';
}

function resetBlockForm() {
  newBlock.startsAt = '';
  newBlock.endsAt = '';
  newBlock.kind = 'REST';
  newBlock.visibility = 'FREEBUSY';
}

function resetRequestForm() {
  newRequest.title = '';
  newRequest.startsAt = '';
  newRequest.endsAt = '';
  newRequest.visibility = 'FREEBUSY';
  newRequest.location = '';
  newRequest.notes = '';
}

function formatDateTime(value?: string | null) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

async function loadUsers() {
  const { data } = await api.get('/users');
  colleagues.value = data as UserSummary[];
}

function mapToCalendar(eventResults: CalendarEventDTO[], blockResults: AvailabilityBlockDTO[]) {
  const calendarEvents = eventResults.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.startsAt,
    end: event.endsAt,
    backgroundColor: visibilityColors[event.visibility],
    borderColor: visibilityColors[event.visibility],
    extendedProps: event,
  }));

  const blockEvents = blockResults.map((block) => ({
    id: `block-${block.id}`,
    title: blockLabels[block.kind] ?? 'Availability block',
    start: block.startsAt,
    end: block.endsAt,
    backgroundColor: blockColors[block.kind],
    borderColor: blockColors[block.kind],
    display: 'background',
    extendedProps: block,
  }));

  events.value = [...calendarEvents, ...blockEvents];
}

async function refreshEvents() {
  if (!calendarRange.value) {
    return;
  }

  const { start, end } = calendarRange.value;
  const params = {
    owner: selectedOwner.value,
    from: start.toISOString(),
    to: end.toISOString(),
  };

  const [eventsResponse, blocksResponse] = await Promise.all([
    api.get('/calendar/events', { params }),
    api.get('/calendar/blocks', { params }),
  ]);

  const eventList = eventsResponse.data as CalendarEventDTO[];
  mapToCalendar(eventList, blocksResponse.data as AvailabilityBlockDTO[]);
  if (selectedEvent.value) {
    const updated = eventList.find((evt) => evt.id === selectedEvent.value?.id);
    if (updated) {
      selectedEvent.value = updated;
      editEvent.title = updated.title;
      editEvent.startsAt = isoToInput(updated.startsAt);
      editEvent.endsAt = isoToInput(updated.endsAt);
      editEvent.location = updated.location || '';
      editEvent.visibility = updated.visibility;
    } else {
      selectedEvent.value = null;
    }
  }
}

async function loadRequests() {
  const [incoming, outgoing] = await Promise.all([
    api.get('/calendar/requests', { params: { scope: 'incoming' } }),
    api.get('/calendar/requests', { params: { scope: 'outgoing' } }),
  ]);
  incomingRequests.value = incoming.data as ScheduleRequest[];
  outgoingRequests.value = outgoing.data as ScheduleRequest[];
}

async function submitEvent() {
  if (!newEvent.title || !newEvent.startsAt || !newEvent.endsAt) {
    return;
  }

  isCreatingEvent.value = true;
  try {
    await api.post('/calendar/events', {
      title: newEvent.title,
      startsAt: new Date(newEvent.startsAt).toISOString(),
      endsAt: new Date(newEvent.endsAt).toISOString(),
      visibility: newEvent.visibility,
      location: newEvent.location || undefined,
    });
    resetEventForm();
    await refreshEvents();
  } finally {
    isCreatingEvent.value = false;
  }
}

async function submitBlock() {
  if (!newBlock.startsAt || !newBlock.endsAt) {
    return;
  }

  isCreatingBlock.value = true;
  try {
    await api.post('/calendar/blocks', {
      startsAt: new Date(newBlock.startsAt).toISOString(),
      endsAt: new Date(newBlock.endsAt).toISOString(),
      kind: newBlock.kind,
      visibility: newBlock.visibility,
    });
    resetBlockForm();
    await refreshEvents();
  } finally {
    isCreatingBlock.value = false;
  }
}

async function submitRequest() {
  if (!selectedOwnerUser.value || !newRequest.title || !newRequest.startsAt || !newRequest.endsAt) {
    return;
  }

  isCreatingRequest.value = true;
  try {
    await api.post('/calendar/requests', {
      targetUserId: selectedOwnerUser.value.id,
      title: newRequest.title,
      startsAt: new Date(newRequest.startsAt).toISOString(),
      endsAt: new Date(newRequest.endsAt).toISOString(),
      visibility: newRequest.visibility,
      location: newRequest.location || undefined,
      notes: newRequest.notes || undefined,
    });
    resetRequestForm();
    await loadRequests();
    requestSuccess.value = 'Request sent successfully';
    requestError.value = null;
  } finally {
    isCreatingRequest.value = false;
  }
}

async function handleRequestAction(id: string, status: 'APPROVED' | 'DECLINED') {
  await api.patch(`/calendar/requests/${id}`, { status });
  await loadRequests();
  await refreshEvents();
}

onMounted(async () => {
  await loadUsers();
  await loadRequests();
  const route = useRoute();
  const qOwner = route.query.owner as string | undefined;
  if (qOwner) {
    selectedOwner.value = qOwner as any;
  }
});

watch(selectedOwner, async () => {
  await refreshEvents();
  selectedEvent.value = null;
  eventError.value = null;
  eventSuccess.value = null;
});

watch(calendarRange, async (next) => {
  if (next) {
    await refreshEvents();
  }
});

watch(
  () => session.me?.['id'],
  async (next, prev) => {
    if (!next || next === prev) return;
    selectedOwner.value = 'me';
    await loadUsers();
    await loadRequests();
    await refreshEvents();
    selectedEvent.value = null;
    eventError.value = null;
    eventSuccess.value = null;
  },
);

function isoToInput(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

function inputToIso(value: string) {
  return value ? new Date(value).toISOString() : undefined;
}

const canEditSelected = computed(
  () => !!selectedEvent.value && selectedEvent.value.ownerId === currentUser.value?.id,
);

async function updateSelectedEvent() {
  if (!selectedEvent.value || !canEditSelected.value) return;
  eventSaving.value = true;
  eventError.value = null;
  eventSuccess.value = null;
  try {
    await api.patch(`/calendar/events/${selectedEvent.value.id}`, {
      title: editEvent.title,
      startsAt: inputToIso(editEvent.startsAt),
      endsAt: inputToIso(editEvent.endsAt),
      location: editEvent.location || undefined,
      visibility: editEvent.visibility,
    });
    eventSuccess.value = 'Event updated';
    await refreshEvents();
  } catch (error: any) {
    eventError.value = error?.response?.data?.message || error?.message || 'Failed to update event';
  } finally {
    eventSaving.value = false;
  }
}

async function deleteSelectedEvent() {
  if (!selectedEvent.value || !canEditSelected.value) return;
  eventDeleting.value = true;
  eventError.value = null;
  eventSuccess.value = null;
  try {
    await api.delete(`/calendar/events/${selectedEvent.value.id}`);
    eventSuccess.value = 'Event deleted';
    selectedEvent.value = null;
    await refreshEvents();
  } catch (error: any) {
    eventError.value = error?.response?.data?.message || error?.message || 'Failed to delete event';
  } finally {
    eventDeleting.value = false;
  }
}
</script>

<template>
  <div class="grid flex-1 min-h-0 grid-cols-[320px_1fr] gap-6 p-6 bg-white text-gray-900">
    <aside class="space-y-6 rounded-lg border border-gray-200 bg-white p-4 overflow-y-auto min-h-0">
      <section v-if="selectedEvent" class="space-y-3 rounded border border-gray-200 bg-white p-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-900">Selected event</h3>
          <button class="text-xs text-gray-500 underline" @click="selectedEvent = null">Clear</button>
        </div>
        <div class="text-xs text-gray-500">
          Event owner: {{ selectedEvent.ownerId === currentUser?.id ? 'Me' : 'Another user' }}
        </div>

        <template v-if="canEditSelected">
          <input
            v-model="editEvent.title"
            class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-400 focus:outline-none"
            placeholder="Event title"
          />
          <input
            v-model="editEvent.startsAt"
            type="datetime-local"
            class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-400 focus:outline-none"
          />
          <input
            v-model="editEvent.endsAt"
            type="datetime-local"
            class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-400 focus:outline-none"
          />
          <input
            v-model="editEvent.location"
            class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-400 focus:outline-none"
            placeholder="Location (optional)"
          />
          <select
            v-model="editEvent.visibility"
            class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
          >
            <option value="PUBLIC">Public</option>
            <option value="FREEBUSY">Free/busy</option>
            <option value="PRIVATE">Private</option>
          </select>

          <div class="flex gap-2">
            <button
              class="rounded bg-emerald-500 px-3 py-2 text-sm font-medium text-emerald-950 disabled:cursor-not-allowed disabled:bg-emerald-300"
              :disabled="eventSaving"
              @click.prevent="updateSelectedEvent"
            >
              {{ eventSaving ? 'Saving…' : 'Save changes' }}
            </button>
            <button
              class="rounded bg-red-500 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-red-300"
              :disabled="eventDeleting"
              @click.prevent="deleteSelectedEvent"
            >
              {{ eventDeleting ? 'Deleting…' : 'Delete' }}
            </button>
          </div>
        </template>
        <template v-else>
          <p class="text-sm text-gray-600">You can only edit your own events.</p>
        </template>

        <p v-if="eventError" class="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {{ eventError }}
        </p>
        <p v-if="eventSuccess" class="rounded border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-700">
          {{ eventSuccess }}
        </p>
      </section>

      <p v-if="requestError" class="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{{ requestError }}</p>
      <p v-if="requestSuccess" class="rounded border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-700">{{ requestSuccess }}</p>
      <div>
        <label class="mb-1 block text-xs tracking-wide text-gray-600">Viewing calendar for</label>
        <select
          v-model="selectedOwner"
          class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
        >
          <option v-for="option in ownerOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>

      <form
        v-if="selectedOwner === 'me'"
        class="space-y-3"
        @submit.prevent="submitEvent"
      >
        <h3 class="text-sm font-semibold text-gray-900">Quick event</h3>
        <input
          v-model="newEvent.title"
          class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-400 focus:outline-none"
          placeholder="Event title"
        />
        <input
          v-model="newEvent.startsAt"
          type="datetime-local"
          class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-400 focus:outline-none"
        />
        <input
          v-model="newEvent.endsAt"
          type="datetime-local"
          class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-400 focus:outline-none"
        />
        <input
          v-model="newEvent.location"
          class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-400 focus:outline-none"
          placeholder="Location (optional)"
        />
        <select
          v-model="newEvent.visibility"
          class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
        >
          <option value="PUBLIC">Public</option>
          <option value="FREEBUSY">Free/busy</option>
          <option value="PRIVATE">Private</option>
        </select>
        <button
          class="w-full rounded bg-emerald-500 px-3 py-2 text-sm font-medium text-emerald-950 disabled:cursor-not-allowed disabled:bg-emerald-800"
          type="submit"
          :disabled="isCreatingEvent"
        >
          {{ isCreatingEvent ? 'Saving…' : 'Create event' }}
        </button>
      </form>

      <form
        v-if="selectedOwner === 'me'"
        class="space-y-3"
        @submit.prevent="submitBlock"
      >
        <h3 class="text-sm font-semibold text-gray-900">Availability block</h3>
        <input
          v-model="newBlock.startsAt"
          type="datetime-local"
          class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-400 focus:outline-none"
        />
        <input
          v-model="newBlock.endsAt"
          type="datetime-local"
          class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-400 focus:outline-none"
        />
        <select
          v-model="newBlock.kind"
          class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
        >
          <option value="REST">Rest</option>
          <option value="FOCUS">Focus</option>
          <option value="OOO">Out of office</option>
        </select>
        <select
          v-model="newBlock.visibility"
          class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
        >
          <option value="FREEBUSY">Free/busy</option>
          <option value="PRIVATE">Private</option>
          <option value="PUBLIC">Public</option>
        </select>
        <button
          class="w-full rounded bg-emerald-500 px-3 py-2 text-sm font-medium text-emerald-950 disabled:cursor-not-allowed disabled:bg-emerald-800"
          type="submit"
          :disabled="isCreatingBlock"
        >
          {{ isCreatingBlock ? 'Saving…' : 'Create block' }}
        </button>
      </form>

      <form
        v-if="selectedOwner !== 'me' && selectedOwnerUser"
        class="space-y-3"
        @submit.prevent="submitRequest"
      >
        <h3 class="text-sm font-semibold text-gray-900">
          Request time with {{ selectedOwnerUser?.name }}
        </h3>
        <input
          v-model="newRequest.title"
          class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-400 focus:outline-none"
          placeholder="Meeting title"
        />
        <input
          v-model="newRequest.startsAt"
          type="datetime-local"
          class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-400 focus:outline-none"
        />
        <input
          v-model="newRequest.endsAt"
          type="datetime-local"
          class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-400 focus:outline-none"
        />
        <input
          v-model="newRequest.location"
          class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-400 focus:outline-none"
          placeholder="Location (optional)"
        />
        <textarea
          v-model="newRequest.notes"
          class="h-20 w-full resize-none rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-400 focus:outline-none"
          placeholder="Notes for {{ selectedOwnerUser?.name }} (optional)"
        />
        <select
          v-model="newRequest.visibility"
          class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
        >
          <option value="FREEBUSY">Free/busy</option>
          <option value="PUBLIC">Public</option>
          <option value="PRIVATE">Private</option>
        </select>
        <button
          class="w-full rounded bg-emerald-500 px-3 py-2 text-sm font-medium text-emerald-950 disabled:cursor-not-allowed disabled:bg-emerald-800"
          type="submit"
          :disabled="isCreatingRequest"
        >
          {{ isCreatingRequest ? 'Sending…' : 'Send request' }}
        </button>
      </form>

      <section class="space-y-2">
        <h3 class="text-sm font-semibold text-gray-900">Incoming requests</h3>
        <p v-if="!incomingRequests.length" class="text-xs text-gray-500">No incoming requests.</p>
        <ul v-else class="space-y-3">
          <li
            v-for="request in incomingRequests"
            :key="request.id"
            class="rounded border border-gray-200 bg-white p-3 text-sm"
          >
            <div class="flex justify-between text-xs text-gray-500">
              <span>From {{ request.requester.name }}</span>
              <span>{{ request.status }}</span>
            </div>
            <p class="mt-1 font-medium text-gray-900">
              {{ (request.eventDraft?.title as string) || 'Requested meeting' }}
            </p>
            <p class="text-xs text-gray-500">
              {{ formatDateTime(request.eventDraft?.startsAt as string) }}
              –
              {{ formatDateTime(request.eventDraft?.endsAt as string) }}
            </p>
            <p v-if="request.notes" class="mt-2 text-xs text-gray-500">Note: {{ request.notes }}</p>
            <div v-if="request.status === 'PENDING'" class="mt-3 flex gap-2">
              <button
                class="flex-1 rounded bg-emerald-500 px-3 py-2 text-xs font-medium text-emerald-950"
                @click="handleRequestAction(request.id, 'APPROVED')"
              >
                Approve
              </button>
              <button
                class="flex-1 rounded bg-gray-200 px-3 py-2 text-xs font-medium text-gray-900"
                @click="handleRequestAction(request.id, 'DECLINED')"
              >
                Decline
              </button>
            </div>
          </li>
        </ul>
      </section>

      <section class="space-y-2">
        <h3 class="text-sm font-semibold text-gray-900">Outgoing requests</h3>
        <p v-if="!outgoingRequests.length" class="text-xs text-gray-500">No outgoing requests.</p>
        <ul v-else class="space-y-3">
          <li
            v-for="request in outgoingRequests"
            :key="request.id"
            class="rounded border border-gray-200 bg-white p-3 text-sm"
          >
            <div class="flex justify-between text-xs text-gray-500">
              <span>To {{ request.targetUser.name }}</span>
              <span>{{ request.status }}</span>
            </div>
            <p class="mt-1 font-medium text-gray-900">
              {{ (request.eventDraft?.title as string) || 'Requested meeting' }}
            </p>
            <p class="text-xs text-gray-500">
              {{ formatDateTime(request.eventDraft?.startsAt as string) }}
              –
              {{ formatDateTime(request.eventDraft?.endsAt as string) }}
            </p>
            <p v-if="request.notes" class="mt-2 text-xs text-gray-500">Note: {{ request.notes }}</p>
          </li>
        </ul>
      </section>
    </aside>

    <section class="rounded-lg border border-gray-200 bg-white p-4 min-h-0">
      <div class="h-full min-h-[400px]">
        <ClientOnly fallback="Loading calendar...">
          <FullCalendar :key="calendarKey" :options="calendarOptions" />
        </ClientOnly>
      </div>
    </section>
  </div>
</template>
