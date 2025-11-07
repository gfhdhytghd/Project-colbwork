<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from '#imports';
import { useApi } from '~/utils/api';
import { useSession } from '~/stores/session';

interface UserSummary {
  id: string;
  name: string;
  email: string;
}

interface Reservation {
  id: string;
  user: UserSummary;
  startsAt: string;
  endsAt: string;
  status: 'ACTIVE' | 'CANCELLED';
}

interface Desk {
  id: string;
  label: string;
  x: number;
  y: number;
  reservations: Reservation[];
}

const api = useApi();
const session = useSession();
const desks = ref<Desk[]>([]);
const isLoading = ref(true);
const loadError = ref<string | null>(null);
const selectedDesk = ref<Desk | null>(null);
const myReservation = ref<Reservation | null>(null);
const isReserving = ref(false);
const isCancelling = ref(false);
const actionError = ref<string | null>(null);
const actionSuccess = ref<string | null>(null);
const selectedOccupant = computed<UserSummary | null>(() =>
  selectedDesk.value ? occupantOf(selectedDesk.value) : null
);

async function loadDesks() {
  isLoading.value = true;
  loadError.value = null;
  try {
    const { data } = await api.get('/desks', { params: { floor: 'F1' } });
    const fresh: Desk[] = data as Desk[];
    desks.value = fresh;
    // rebind selected desk to the fresh instance so side panel reflects latest state
    if (selectedDesk.value) {
      const found = fresh.find((d) => d.id === selectedDesk.value!.id) || null;
      selectedDesk.value = found;
    }
    computeMyReservation();
  } catch (e: any) {
    loadError.value = e?.message || 'Failed to load desks';
    desks.value = [];
  } finally {
    isLoading.value = false;
  }
}

function computeMyReservation() {
  const me = session.me?.['id'];
  if (!me) {
    myReservation.value = null;
    return;
  }
  for (const d of desks.value) {
    const r = (d.reservations || []).find((res) => res.status === 'ACTIVE' && res.user?.id === me);
    if (r) {
      myReservation.value = r;
      return;
    }
  }
  myReservation.value = null;
}

function occupantOf(d: Desk): UserSummary | null {
  const r = (d.reservations || [])[0];
  return r?.user ?? null;
}

async function reserveSelected() {
  if (!selectedDesk.value) return;
  isReserving.value = true;
  actionError.value = null;
  actionSuccess.value = null;
  try {
    const now = new Date();
    const ends = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    await api.post(`/desks/${selectedDesk.value.id}/reservations`, {
      startsAt: now.toISOString(),
      endsAt: ends.toISOString(),
    });
    await loadDesks();
    // keep the panel open with the updated desk reference
    selectedDesk.value = desks.value.find((d) => d.id === selectedDesk.value!.id) || null;
    actionSuccess.value = 'Desk reserved successfully';
  } catch (e: any) {
    actionError.value = e?.response?.data?.message || e?.message || 'Failed to reserve desk';
  } finally {
    isReserving.value = false;
  }
}

async function cancelMyReservation() {
  if (!myReservation.value) return;
  isCancelling.value = true;
  actionError.value = null;
  actionSuccess.value = null;
  try {
    await api.delete(`/desks/reservations/${myReservation.value.id}`);
    await loadDesks();
    actionSuccess.value = 'Reservation cancelled';
  } finally {
    isCancelling.value = false;
  }
}

const router = useRouter();
async function messageUser(userId: string) {
  // ensure DM then open chat with thread query param
  const { data } = await api.post('/threads', { type: 'DM', participantIds: [userId] });
  router.push({ path: '/chat', query: { thread: (data as any).id } });
}

onMounted(loadDesks);
watch(
  () => session.me?.['id'],
  async (next, prev) => {
    if (next && next !== prev) {
      await loadDesks();
    }
  },
);
</script>

<template>
  <div class="p-6 bg-white text-gray-900 flex-1 min-h-0">
    <div class="mb-4 flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Office Map</h1>
      <div v-if="myReservation" class="flex items-center gap-3 text-sm">
        <span>My desk active</span>
        <button class="rounded bg-gray-200 px-3 py-1" :disabled="isCancelling" @click="cancelMyReservation">
          {{ isCancelling ? 'Leaving…' : 'Leave desk' }}
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="text-gray-500">Loading desks…</div>
    <div v-else-if="!desks.length" class="rounded border border-gray-200 bg-white p-4 text-sm text-gray-600">
      No desks found on floor F1. If you recently reset the database, please run the seed script and reload.
    </div>

    <div v-else class="grid grid-cols-[1fr_320px] gap-6 min-h-0">
      <svg viewBox="0 0 1200 800" class="h-full min-h-[400px] w-full rounded border border-gray-200 bg-white">
        <g v-for="desk in desks" :key="desk.id">
          <rect
            :x="desk.x"
            :y="desk.y"
            width="60"
            height="40"
            rx="6"
            :class="occupantOf(desk) ? 'fill-red-300 stroke-red-400 cursor-pointer' : 'fill-emerald-300 stroke-emerald-400 cursor-pointer'"
            @click="selectedDesk = desk"
          />
          <text :x="desk.x + 30" :y="desk.y + 25" text-anchor="middle" class="fill-gray-900 text-xs select-none">
            {{ desk.label }}
          </text>
        </g>
      </svg>

      <aside class="rounded border border-gray-200 bg-white p-4" v-if="selectedDesk">
        <div class="mb-3 text-sm text-gray-500">Desk {{ selectedDesk.label }}</div>
        <p v-if="actionError" class="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">{{ actionError }}</p>
        <p v-if="actionSuccess" class="rounded border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-700">{{ actionSuccess }}</p>
        <div v-if="selectedOccupant" class="space-y-3">
          <div>
            <div class="text-sm text-gray-500">Occupied by</div>
            <div class="text-base font-medium text-gray-900">{{ selectedOccupant.name }}</div>
          </div>
          <div class="flex gap-2">
            <button class="rounded bg-emerald-500 px-3 py-2 text-sm font-medium text-emerald-950" @click="messageUser(selectedOccupant.id)">
              Message
            </button>
            <button class="rounded bg-gray-200 px-3 py-2 text-sm" @click="router.push({ path: '/calendar', query: { owner: selectedOccupant.id } })">
              View calendar
            </button>
          </div>
        </div>

        <div v-else class="space-y-3">
          <div class="text-sm text-gray-500">This desk is available.</div>
          <button class="rounded bg-emerald-500 px-3 py-2 text-sm font-medium text-emerald-950" :disabled="isReserving" @click="reserveSelected">
            {{ isReserving ? 'Reserving…' : 'Reserve for 4h' }}
          </button>
        </div>
      </aside>
    </div>
  </div>
</template>
