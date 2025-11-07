import { v as vueExports, u as useRouter, a as useRoute$1, s as serverRenderer_cjs_prodExports } from './server.mjs';
import { u as useApi } from './api-msYOaHew.mjs';
import { u as useState } from './state-BVUnE2Hd.mjs';
import 'node:http';
import 'node:https';
import 'node:zlib';
import 'node:stream';
import 'node:buffer';
import 'node:util';
import 'node:url';
import 'node:net';
import 'node:fs';
import 'node:path';
import '../nitro/nitro.mjs';
import 'node:events';
import 'node:crypto';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'vue/server-renderer';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'vue';
import 'unhead/plugins';
import 'axios';

const _sfc_main = /* @__PURE__ */ vueExports.defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const api = useApi();
    useRouter();
    const route = useRoute$1();
    const demoUserEmail = useState("demoUserEmail", () => "alice@acme.com");
    const threads = vueExports.ref([]);
    const messages = vueExports.ref([]);
    const colleagues = vueExports.ref([]);
    const selectedThreadId = vueExports.ref(null);
    const messageDraft = vueExports.ref("");
    const isSending = vueExports.ref(false);
    const loadingThreads = vueExports.ref(false);
    const loadingMessages = vueExports.ref(false);
    const activeBlocks = vueExports.ref({});
    const presenceByUser = vueExports.ref({});
    const requestsById = vueExports.ref({});
    const currentUser = vueExports.computed(
      () => {
        var _a, _b;
        return (_b = (_a = colleagues.value.find((user) => user.email === demoUserEmail.value)) != null ? _a : colleagues.value[0]) != null ? _b : null;
      }
    );
    const currentThread = vueExports.computed(
      () => {
        var _a;
        return (_a = threads.value.find((thread) => thread.id === selectedThreadId.value)) != null ? _a : null;
      }
    );
    const availableRecipients = vueExports.computed(
      () => colleagues.value.filter((user) => {
        var _a;
        return user.id !== ((_a = currentUser.value) == null ? void 0 : _a.id);
      })
    );
    const statusIcon = (kind) => kind === "REST" ? "\u{1F4A4}" : kind === "FOCUS" ? "\u{1F3AF}" : "\u{1F6AA}";
    const statusLabel = (kind) => kind === "REST" ? "Rest" : kind === "FOCUS" ? "Focus" : "Out of office";
    const threadTitle2 = (thread) => {
      if (thread.type === "GROUP") return "Group conversation";
      const others = thread.participants.map((participant) => participant.user).filter((participant) => participant.email !== demoUserEmail.value);
      return others.length ? others.map((participant) => participant.name).join(", ") : "Direct message";
    };
    const participantLine2 = (thread) => thread.participants.map((participant) => participant.user.name).join(", ");
    function formatTimestamp(iso) {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }).format(new Date(iso));
    }
    function formatDate(iso) {
      if (!iso) return "";
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }).format(new Date(iso));
    }
    async function loadUsers() {
      colleagues.value = (await api.get("/users")).data;
    }
    async function loadThreads(selectId) {
      var _a;
      loadingThreads.value = true;
      try {
        threads.value = (await api.get("/threads")).data;
        const qThread = (_a = route.query.thread) != null ? _a : void 0;
        if (qThread && threads.value.some((t) => t.id === qThread)) {
          selectedThreadId.value = qThread;
        } else if (selectId) ;
        else if (!selectedThreadId.value && threads.value.length) {
          selectedThreadId.value = threads.value[0].id;
        }
      } finally {
        loadingThreads.value = false;
      }
    }
    async function loadMessages(threadId) {
      loadingMessages.value = true;
      try {
        messages.value = (await api.get(`/threads/${threadId}/messages`)).data;
      } finally {
        loadingMessages.value = false;
      }
    }
    async function refreshRequestMap() {
      const [incoming, outgoing] = await Promise.all([
        api.get("/calendar/requests", { params: { scope: "incoming" } }),
        api.get("/calendar/requests", { params: { scope: "outgoing" } })
      ]);
      const map = {};
      for (const r of incoming.data) map[r.id] = r;
      for (const r of outgoing.data) map[r.id] = r;
      requestsById.value = map;
    }
    async function refreshActiveBlocks() {
      var _a;
      const others = /* @__PURE__ */ new Set();
      for (const t of threads.value) {
        if (t.type !== "DM") continue;
        for (const p of t.participants) {
          const uid = p.user.id;
          if (uid && uid !== ((_a = currentUser.value) == null ? void 0 : _a.id)) others.add(uid);
        }
      }
      if (!others.size) {
        activeBlocks.value = {};
        return;
      }
      const params = new URLSearchParams({ userIds: Array.from(others).join(",") });
      const { data } = await api.get(`/calendar/active-blocks?${params.toString()}`);
      const map = {};
      for (const b of data) map[b.ownerId] = { kind: b.kind };
      activeBlocks.value = map;
    }
    async function refreshPresence() {
      var _a;
      const others = /* @__PURE__ */ new Set();
      for (const t of threads.value) {
        if (t.type !== "DM") continue;
        for (const p of t.participants) {
          const uid = p.user.id;
          if (uid && uid !== ((_a = currentUser.value) == null ? void 0 : _a.id)) others.add(uid);
        }
      }
      if (!others.size) {
        presenceByUser.value = {};
        return;
      }
      const params = new URLSearchParams({ userIds: Array.from(others).join(",") });
      const { data } = await api.get(`/presence/users?${params.toString()}`);
      const map = {};
      for (const p of data) {
        map[p.userId] = {
          location: p.location,
          deskLabel: p.desk ? `${p.desk.floorId}-${p.desk.label}` : void 0
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
    function isCalendarRequest(msg) {
      return !!msg.attachments && msg.attachments.kind === "calendar-request";
    }
    vueExports.watch(selectedThreadId, async (next, prev) => {
      if (next && next !== prev) await ensureMessages();
    });
    vueExports.watch(demoUserEmail, async () => {
      threads.value = [];
      messages.value = [];
      selectedThreadId.value = null;
      await loadUsers();
      await loadThreads();
      await ensureMessages();
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${serverRenderer_cjs_prodExports.ssrRenderAttrs(vueExports.mergeProps({ class: "flex flex-1 min-h-0 h-full" }, _attrs))}><aside class="w-[300px] border-r border-gray-200 bg-white overflow-y-auto min-h-0 h-full"><div class="flex items-center justify-between px-4 py-3 text-xs uppercase tracking-wide text-gray-500"><span>Threads</span>`);
      if (loadingThreads.value) {
        _push(`<span class="text-[10px] text-gray-400">Loading\u2026</span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><ul class="space-y-1 px-2"><!--[-->`);
      serverRenderer_cjs_prodExports.ssrRenderList(threads.value, (thread) => {
        var _a, _b, _c, _d;
        _push(`<li><button class="${serverRenderer_cjs_prodExports.ssrRenderClass([{ "bg-gray-100": thread.id === selectedThreadId.value }, "w-full rounded px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-100"])}"><div class="flex flex-col"><span class="font-medium text-gray-900">${serverRenderer_cjs_prodExports.ssrInterpolate(threadTitle2(thread))}</span>`);
        if (thread.type === "DM") {
          _push(`<span class="text-[11px] text-gray-500"><!--[-->`);
          serverRenderer_cjs_prodExports.ssrRenderList(thread.participants, (participant) => {
            var _a2, _b2, _c2, _d2;
            _push(`<!--[-->`);
            if (participant.user.id !== ((_a2 = currentUser.value) == null ? void 0 : _a2.id)) {
              _push(`<!--[-->`);
              if (activeBlocks.value[participant.user.id]) {
                _push(`<!--[--><span>${serverRenderer_cjs_prodExports.ssrInterpolate(statusIcon(activeBlocks.value[participant.user.id].kind))} ${serverRenderer_cjs_prodExports.ssrInterpolate(statusLabel(activeBlocks.value[participant.user.id].kind))}</span><span> \xB7 </span><!--]-->`);
              } else {
                _push(`<!---->`);
              }
              _push(`<span> at ${serverRenderer_cjs_prodExports.ssrInterpolate(((_b2 = presenceByUser.value[participant.user.id]) == null ? void 0 : _b2.location) === "OFFICE" && ((_c2 = presenceByUser.value[participant.user.id]) == null ? void 0 : _c2.deskLabel) ? (_d2 = presenceByUser.value[participant.user.id]) == null ? void 0 : _d2.deskLabel : "home")}</span><!--]-->`);
            } else {
              _push(`<!---->`);
            }
            _push(`<!--]-->`);
          });
          _push(`<!--]--></span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<span class="truncate text-xs text-gray-500">${serverRenderer_cjs_prodExports.ssrInterpolate((_c = (_b = (_a = thread.messages[0]) == null ? void 0 : _a.sender) == null ? void 0 : _b.name) != null ? _c : "No messages yet")} `);
        if (thread.messages[0]) {
          _push(`<!--[--> \xB7 ${serverRenderer_cjs_prodExports.ssrInterpolate((_d = thread.messages[0]) == null ? void 0 : _d.body)}<!--]-->`);
        } else {
          _push(`<!---->`);
        }
        _push(`</span></div></button></li>`);
      });
      _push(`<!--]--></ul><div class="mt-6 border-t border-gray-200 px-4 pt-4"><h3 class="mb-2 text-xs uppercase tracking-wide text-gray-500">Start new chat</h3><div class="flex flex-col gap-2"><!--[-->`);
      serverRenderer_cjs_prodExports.ssrRenderList(availableRecipients.value, (person) => {
        _push(`<button class="rounded border border-gray-200 px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-100"> Message ${serverRenderer_cjs_prodExports.ssrInterpolate(person.name)}</button>`);
      });
      _push(`<!--]--></div></div></aside><section class="flex flex-1 min-h-0 h-full flex-col bg-white overflow-hidden"><header class="border-b border-gray-200 px-6 py-4 shrink-0"><h2 class="text-lg font-semibold text-gray-900">${serverRenderer_cjs_prodExports.ssrInterpolate(currentThread.value ? threadTitle2(currentThread.value) : "Select a thread")}</h2>`);
      if (currentThread.value) {
        _push(`<p class="text-sm text-gray-500">${serverRenderer_cjs_prodExports.ssrInterpolate(participantLine2(currentThread.value))}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</header><div class="flex-1 overflow-y-auto min-h-0 px-6 py-4">`);
      if (!currentThread.value) {
        _push(`<div class="text-gray-500">Choose a conversation or start a new one.</div>`);
      } else if (loadingMessages.value) {
        _push(`<div class="text-gray-500">Loading messages\u2026</div>`);
      } else {
        _push(`<ul class="space-y-4"><!--[-->`);
        serverRenderer_cjs_prodExports.ssrRenderList(messages.value, (message) => {
          var _a, _b, _c, _d, _e;
          _push(`<li class="flex flex-col gap-2"><div><span class="${serverRenderer_cjs_prodExports.ssrRenderClass([message.sender.id === ((_a = currentUser.value) == null ? void 0 : _a.id) ? "text-emerald-700" : "text-gray-800", "text-sm font-medium"])}">${serverRenderer_cjs_prodExports.ssrInterpolate(message.sender.name)}</span><span class="ml-2 text-xs text-gray-500">${serverRenderer_cjs_prodExports.ssrInterpolate(formatTimestamp(message.createdAt))}</span></div>`);
          if (isCalendarRequest(message)) {
            _push(`<div class="rounded border border-gray-200 bg-white p-3"><div class="text-sm font-medium text-gray-900">Calendar request: ${serverRenderer_cjs_prodExports.ssrInterpolate(message.attachments.title)}</div><div class="text-xs text-gray-500">${serverRenderer_cjs_prodExports.ssrInterpolate(formatDate(message.attachments.startsAt))} `);
            if (message.attachments.endsAt) {
              _push(`<!--[--> \u2013 ${serverRenderer_cjs_prodExports.ssrInterpolate(formatDate(message.attachments.endsAt))}<!--]-->`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
            if (message.attachments.location) {
              _push(`<div class="mt-1 text-xs text-gray-500"> Location: ${serverRenderer_cjs_prodExports.ssrInterpolate(message.attachments.location)}</div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`<div class="mt-2 flex flex-wrap gap-2"><button class="rounded border border-gray-300 bg-white px-2 py-1 text-xs"> View in Calendar </button>`);
            if (((_b = requestsById.value[message.attachments.requestId]) == null ? void 0 : _b.status) === "PENDING" && ((_c = requestsById.value[message.attachments.requestId]) == null ? void 0 : _c.targetUser.id) === ((_d = currentUser.value) == null ? void 0 : _d.id)) {
              _push(`<!--[--><button class="rounded bg-emerald-500 px-2 py-1 text-xs font-medium text-emerald-950"> Approve </button><button class="rounded bg-gray-200 px-2 py-1 text-xs"> Decline </button><!--]-->`);
            } else {
              _push(`<span class="text-xs text-gray-500"> Status: ${serverRenderer_cjs_prodExports.ssrInterpolate(((_e = requestsById.value[message.attachments.requestId]) == null ? void 0 : _e.status) || "PENDING")}</span>`);
            }
            _push(`</div></div>`);
          } else {
            _push(`<p class="whitespace-pre-line text-gray-900">${serverRenderer_cjs_prodExports.ssrInterpolate(message.body)}</p>`);
          }
          _push(`</li>`);
        });
        _push(`<!--]--></ul>`);
      }
      _push(`</div><footer class="border-t border-gray-200 bg-white px-6 py-4 shrink-0"><form class="flex gap-3"><input${serverRenderer_cjs_prodExports.ssrRenderAttr("value", messageDraft.value)} class="flex-1 rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-emerald-400 focus:outline-none" placeholder="Type a message"${serverRenderer_cjs_prodExports.ssrIncludeBooleanAttr(!currentThread.value) ? " disabled" : ""}><button class="rounded bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950 disabled:cursor-not-allowed disabled:bg-emerald-300" type="submit"${serverRenderer_cjs_prodExports.ssrIncludeBooleanAttr(!currentThread.value || !messageDraft.value.trim() || isSending.value) ? " disabled" : ""}>${serverRenderer_cjs_prodExports.ssrInterpolate(isSending.value ? "Sending\u2026" : "Send")}</button></form></footer></section></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = vueExports.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/chat/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-JJ00_IKi.mjs.map
