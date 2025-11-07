import { v as vueExports, s as serverRenderer_cjs_prodExports, b as __nuxt_component_0$1 } from './server.mjs';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
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
    const demoUserEmail = useState("demoUserEmail", () => "alice@acme.com");
    const colleagues = vueExports.ref([]);
    const selectedOwner = vueExports.ref("me");
    const calendarRange = vueExports.ref(null);
    const events = vueExports.ref([]);
    const isCreatingEvent = vueExports.ref(false);
    const isCreatingBlock = vueExports.ref(false);
    const isCreatingRequest = vueExports.ref(false);
    const requestError = vueExports.ref(null);
    const requestSuccess = vueExports.ref(null);
    const newEvent = vueExports.reactive({
      title: "",
      startsAt: "",
      endsAt: "",
      visibility: "PUBLIC",
      location: ""
    });
    const newBlock = vueExports.reactive({
      startsAt: "",
      endsAt: "",
      kind: "REST",
      visibility: "FREEBUSY"
    });
    const newRequest = vueExports.reactive({
      title: "",
      startsAt: "",
      endsAt: "",
      visibility: "FREEBUSY",
      location: "",
      notes: ""
    });
    const incomingRequests = vueExports.ref([]);
    const outgoingRequests = vueExports.ref([]);
    const selectedEvent = vueExports.ref(null);
    const editEvent = vueExports.reactive({
      title: "",
      startsAt: "",
      endsAt: "",
      visibility: "PUBLIC",
      location: ""
    });
    const eventSaving = vueExports.ref(false);
    const eventDeleting = vueExports.ref(false);
    const eventError = vueExports.ref(null);
    const eventSuccess = vueExports.ref(null);
    const visibilityColors = {
      PUBLIC: "#34d399",
      FREEBUSY: "#a855f7",
      PRIVATE: "#64748b"
    };
    const blockColors = {
      REST: "#fb923c",
      FOCUS: "#0ea5e9",
      OOO: "#f97316"
    };
    const blockLabels = {
      REST: "Rest block",
      FOCUS: "Focus block",
      OOO: "Out of office"
    };
    const currentUser = vueExports.computed(
      () => {
        var _a, _b;
        return (_b = (_a = colleagues.value.find((user) => user.email === demoUserEmail.value)) != null ? _a : colleagues.value[0]) != null ? _b : null;
      }
    );
    const ownerOptions = vueExports.computed(() => [
      { label: "Me", value: "me" },
      ...colleagues.value.map((user) => ({ label: user.name, value: user.id }))
    ]);
    const selectedOwnerUser = vueExports.computed(() => {
      var _a;
      if (selectedOwner.value === "me") {
        return currentUser.value;
      }
      return (_a = colleagues.value.find((user) => user.id === selectedOwner.value)) != null ? _a : null;
    });
    vueExports.computed(() => `${demoUserEmail.value}-${selectedOwner.value}`);
    vueExports.computed(() => ({
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: "timeGridWeek",
      events: events.value,
      height: "100%",
      headerToolbar: {
        start: "prev,next today",
        center: "title",
        end: "dayGridMonth,timeGridWeek,timeGridDay"
      },
      datesSet: (arg) => {
        calendarRange.value = { start: arg.start, end: arg.end };
      },
      eventClick: (info) => {
        const props = info.event.extendedProps;
        selectedEvent.value = {
          ...props,
          id: info.event.id,
          title: info.event.title,
          startsAt: info.event.start ? info.event.start.toISOString() : props.startsAt,
          endsAt: info.event.end ? info.event.end.toISOString() : props.endsAt
        };
        editEvent.title = selectedEvent.value.title;
        editEvent.startsAt = isoToInput(selectedEvent.value.startsAt);
        editEvent.endsAt = isoToInput(selectedEvent.value.endsAt);
        editEvent.location = selectedEvent.value.location || "";
        editEvent.visibility = selectedEvent.value.visibility;
        eventError.value = null;
        eventSuccess.value = null;
      }
    }));
    function formatDateTime(value) {
      if (!value) return "";
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }).format(new Date(value));
    }
    async function loadUsers() {
      const { data } = await api.get("/users");
      colleagues.value = data;
    }
    function mapToCalendar(eventResults, blockResults) {
      const calendarEvents = eventResults.map((event) => ({
        id: event.id,
        title: event.title,
        start: event.startsAt,
        end: event.endsAt,
        backgroundColor: visibilityColors[event.visibility],
        borderColor: visibilityColors[event.visibility],
        extendedProps: event
      }));
      const blockEvents = blockResults.map((block) => {
        var _a;
        return {
          id: `block-${block.id}`,
          title: (_a = blockLabels[block.kind]) != null ? _a : "Availability block",
          start: block.startsAt,
          end: block.endsAt,
          backgroundColor: blockColors[block.kind],
          borderColor: blockColors[block.kind],
          display: "background",
          extendedProps: block
        };
      });
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
        to: end.toISOString()
      };
      const [eventsResponse, blocksResponse] = await Promise.all([
        api.get("/calendar/events", { params }),
        api.get("/calendar/blocks", { params })
      ]);
      const eventList = eventsResponse.data;
      mapToCalendar(eventList, blocksResponse.data);
      if (selectedEvent.value) {
        const updated = eventList.find((evt) => {
          var _a;
          return evt.id === ((_a = selectedEvent.value) == null ? void 0 : _a.id);
        });
        if (updated) {
          selectedEvent.value = updated;
          editEvent.title = updated.title;
          editEvent.startsAt = isoToInput(updated.startsAt);
          editEvent.endsAt = isoToInput(updated.endsAt);
          editEvent.location = updated.location || "";
          editEvent.visibility = updated.visibility;
        } else {
          selectedEvent.value = null;
        }
      }
    }
    async function loadRequests() {
      const [incoming, outgoing] = await Promise.all([
        api.get("/calendar/requests", { params: { scope: "incoming" } }),
        api.get("/calendar/requests", { params: { scope: "outgoing" } })
      ]);
      incomingRequests.value = incoming.data;
      outgoingRequests.value = outgoing.data;
    }
    vueExports.watch(selectedOwner, async () => {
      await refreshEvents();
      selectedEvent.value = null;
    });
    vueExports.watch(calendarRange, async (next) => {
      if (next) {
        await refreshEvents();
      }
    });
    vueExports.watch(demoUserEmail, async () => {
      selectedOwner.value = "me";
      await loadUsers();
      await loadRequests();
      await refreshEvents();
      selectedEvent.value = null;
    });
    function isoToInput(value) {
      if (!value) return "";
      const date = new Date(value);
      const tzOffset = date.getTimezoneOffset() * 6e4;
      return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
    }
    const canEditSelected = vueExports.computed(
      () => {
        var _a;
        return !!selectedEvent.value && selectedEvent.value.ownerId === ((_a = currentUser.value) == null ? void 0 : _a.id);
      }
    );
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b;
      const _component_ClientOnly = __nuxt_component_0$1;
      _push(`<div${serverRenderer_cjs_prodExports.ssrRenderAttrs(vueExports.mergeProps({ class: "grid flex-1 min-h-0 grid-cols-[320px_1fr] gap-6 p-6 bg-white text-gray-900" }, _attrs))}><aside class="space-y-6 rounded-lg border border-gray-200 bg-white p-4 overflow-y-auto min-h-0">`);
      if (requestError.value) {
        _push(`<p class="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">${serverRenderer_cjs_prodExports.ssrInterpolate(requestError.value)}</p>`);
      } else {
        _push(`<!---->`);
      }
      if (requestSuccess.value) {
        _push(`<p class="rounded border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-700">${serverRenderer_cjs_prodExports.ssrInterpolate(requestSuccess.value)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div><label class="mb-1 block text-xs tracking-wide text-gray-600">Viewing calendar for</label><select class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"><!--[-->`);
      serverRenderer_cjs_prodExports.ssrRenderList(ownerOptions.value, (option) => {
        _push(`<option${serverRenderer_cjs_prodExports.ssrRenderAttr("value", option.value)}${serverRenderer_cjs_prodExports.ssrIncludeBooleanAttr(Array.isArray(selectedOwner.value) ? serverRenderer_cjs_prodExports.ssrLooseContain(selectedOwner.value, option.value) : serverRenderer_cjs_prodExports.ssrLooseEqual(selectedOwner.value, option.value)) ? " selected" : ""}>${serverRenderer_cjs_prodExports.ssrInterpolate(option.label)}</option>`);
      });
      _push(`<!--]--></select></div>`);
      if (selectedOwner.value === "me") {
        _push(`<form class="space-y-3"><h3 class="text-sm font-semibold text-gray-900">Quick event</h3><input${serverRenderer_cjs_prodExports.ssrRenderAttr("value", newEvent.title)} class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-400 focus:outline-none" placeholder="Event title"><input${serverRenderer_cjs_prodExports.ssrRenderAttr("value", newEvent.startsAt)} type="datetime-local" class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-400 focus:outline-none"><input${serverRenderer_cjs_prodExports.ssrRenderAttr("value", newEvent.endsAt)} type="datetime-local" class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-400 focus:outline-none"><input${serverRenderer_cjs_prodExports.ssrRenderAttr("value", newEvent.location)} class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-400 focus:outline-none" placeholder="Location (optional)"><select class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"><option value="PUBLIC"${serverRenderer_cjs_prodExports.ssrIncludeBooleanAttr(Array.isArray(newEvent.visibility) ? serverRenderer_cjs_prodExports.ssrLooseContain(newEvent.visibility, "PUBLIC") : serverRenderer_cjs_prodExports.ssrLooseEqual(newEvent.visibility, "PUBLIC")) ? " selected" : ""}>Public</option><option value="FREEBUSY"${serverRenderer_cjs_prodExports.ssrIncludeBooleanAttr(Array.isArray(newEvent.visibility) ? serverRenderer_cjs_prodExports.ssrLooseContain(newEvent.visibility, "FREEBUSY") : serverRenderer_cjs_prodExports.ssrLooseEqual(newEvent.visibility, "FREEBUSY")) ? " selected" : ""}>Free/busy</option><option value="PRIVATE"${serverRenderer_cjs_prodExports.ssrIncludeBooleanAttr(Array.isArray(newEvent.visibility) ? serverRenderer_cjs_prodExports.ssrLooseContain(newEvent.visibility, "PRIVATE") : serverRenderer_cjs_prodExports.ssrLooseEqual(newEvent.visibility, "PRIVATE")) ? " selected" : ""}>Private</option></select><button class="w-full rounded bg-emerald-500 px-3 py-2 text-sm font-medium text-emerald-950 disabled:cursor-not-allowed disabled:bg-emerald-800" type="submit"${serverRenderer_cjs_prodExports.ssrIncludeBooleanAttr(isCreatingEvent.value) ? " disabled" : ""}>${serverRenderer_cjs_prodExports.ssrInterpolate(isCreatingEvent.value ? "Saving\u2026" : "Create event")}</button></form>`);
      } else {
        _push(`<!---->`);
      }
      if (selectedOwner.value === "me") {
        _push(`<form class="space-y-3"><h3 class="text-sm font-semibold text-gray-900">Availability block</h3><input${serverRenderer_cjs_prodExports.ssrRenderAttr("value", newBlock.startsAt)} type="datetime-local" class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-400 focus:outline-none"><input${serverRenderer_cjs_prodExports.ssrRenderAttr("value", newBlock.endsAt)} type="datetime-local" class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-400 focus:outline-none"><select class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"><option value="REST"${serverRenderer_cjs_prodExports.ssrIncludeBooleanAttr(Array.isArray(newBlock.kind) ? serverRenderer_cjs_prodExports.ssrLooseContain(newBlock.kind, "REST") : serverRenderer_cjs_prodExports.ssrLooseEqual(newBlock.kind, "REST")) ? " selected" : ""}>Rest</option><option value="FOCUS"${serverRenderer_cjs_prodExports.ssrIncludeBooleanAttr(Array.isArray(newBlock.kind) ? serverRenderer_cjs_prodExports.ssrLooseContain(newBlock.kind, "FOCUS") : serverRenderer_cjs_prodExports.ssrLooseEqual(newBlock.kind, "FOCUS")) ? " selected" : ""}>Focus</option><option value="OOO"${serverRenderer_cjs_prodExports.ssrIncludeBooleanAttr(Array.isArray(newBlock.kind) ? serverRenderer_cjs_prodExports.ssrLooseContain(newBlock.kind, "OOO") : serverRenderer_cjs_prodExports.ssrLooseEqual(newBlock.kind, "OOO")) ? " selected" : ""}>Out of office</option></select><select class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"><option value="FREEBUSY"${serverRenderer_cjs_prodExports.ssrIncludeBooleanAttr(Array.isArray(newBlock.visibility) ? serverRenderer_cjs_prodExports.ssrLooseContain(newBlock.visibility, "FREEBUSY") : serverRenderer_cjs_prodExports.ssrLooseEqual(newBlock.visibility, "FREEBUSY")) ? " selected" : ""}>Free/busy</option><option value="PRIVATE"${serverRenderer_cjs_prodExports.ssrIncludeBooleanAttr(Array.isArray(newBlock.visibility) ? serverRenderer_cjs_prodExports.ssrLooseContain(newBlock.visibility, "PRIVATE") : serverRenderer_cjs_prodExports.ssrLooseEqual(newBlock.visibility, "PRIVATE")) ? " selected" : ""}>Private</option><option value="PUBLIC"${serverRenderer_cjs_prodExports.ssrIncludeBooleanAttr(Array.isArray(newBlock.visibility) ? serverRenderer_cjs_prodExports.ssrLooseContain(newBlock.visibility, "PUBLIC") : serverRenderer_cjs_prodExports.ssrLooseEqual(newBlock.visibility, "PUBLIC")) ? " selected" : ""}>Public</option></select><button class="w-full rounded bg-emerald-500 px-3 py-2 text-sm font-medium text-emerald-950 disabled:cursor-not-allowed disabled:bg-emerald-800" type="submit"${serverRenderer_cjs_prodExports.ssrIncludeBooleanAttr(isCreatingBlock.value) ? " disabled" : ""}>${serverRenderer_cjs_prodExports.ssrInterpolate(isCreatingBlock.value ? "Saving\u2026" : "Create block")}</button></form>`);
      } else {
        _push(`<!---->`);
      }
      if (selectedOwner.value !== "me" && selectedOwnerUser.value) {
        _push(`<form class="space-y-3"><h3 class="text-sm font-semibold text-gray-900"> Request time with ${serverRenderer_cjs_prodExports.ssrInterpolate((_a = selectedOwnerUser.value) == null ? void 0 : _a.name)}</h3><input${serverRenderer_cjs_prodExports.ssrRenderAttr("value", newRequest.title)} class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-400 focus:outline-none" placeholder="Meeting title"><input${serverRenderer_cjs_prodExports.ssrRenderAttr("value", newRequest.startsAt)} type="datetime-local" class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-400 focus:outline-none"><input${serverRenderer_cjs_prodExports.ssrRenderAttr("value", newRequest.endsAt)} type="datetime-local" class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-400 focus:outline-none"><input${serverRenderer_cjs_prodExports.ssrRenderAttr("value", newRequest.location)} class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-400 focus:outline-none" placeholder="Location (optional)"><textarea class="h-20 w-full resize-none rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-400 focus:outline-none" placeholder="Notes for {{ selectedOwnerUser?.name }} (optional)">${serverRenderer_cjs_prodExports.ssrInterpolate(newRequest.notes)}</textarea><select class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"><option value="FREEBUSY"${serverRenderer_cjs_prodExports.ssrIncludeBooleanAttr(Array.isArray(newRequest.visibility) ? serverRenderer_cjs_prodExports.ssrLooseContain(newRequest.visibility, "FREEBUSY") : serverRenderer_cjs_prodExports.ssrLooseEqual(newRequest.visibility, "FREEBUSY")) ? " selected" : ""}>Free/busy</option><option value="PUBLIC"${serverRenderer_cjs_prodExports.ssrIncludeBooleanAttr(Array.isArray(newRequest.visibility) ? serverRenderer_cjs_prodExports.ssrLooseContain(newRequest.visibility, "PUBLIC") : serverRenderer_cjs_prodExports.ssrLooseEqual(newRequest.visibility, "PUBLIC")) ? " selected" : ""}>Public</option><option value="PRIVATE"${serverRenderer_cjs_prodExports.ssrIncludeBooleanAttr(Array.isArray(newRequest.visibility) ? serverRenderer_cjs_prodExports.ssrLooseContain(newRequest.visibility, "PRIVATE") : serverRenderer_cjs_prodExports.ssrLooseEqual(newRequest.visibility, "PRIVATE")) ? " selected" : ""}>Private</option></select><button class="w-full rounded bg-emerald-500 px-3 py-2 text-sm font-medium text-emerald-950 disabled:cursor-not-allowed disabled:bg-emerald-800" type="submit"${serverRenderer_cjs_prodExports.ssrIncludeBooleanAttr(isCreatingRequest.value) ? " disabled" : ""}>${serverRenderer_cjs_prodExports.ssrInterpolate(isCreatingRequest.value ? "Sending\u2026" : "Send request")}</button></form>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<section class="space-y-2"><h3 class="text-sm font-semibold text-gray-900">Incoming requests</h3>`);
      if (!incomingRequests.value.length) {
        _push(`<p class="text-xs text-gray-500">No incoming requests.</p>`);
      } else {
        _push(`<ul class="space-y-3"><!--[-->`);
        serverRenderer_cjs_prodExports.ssrRenderList(incomingRequests.value, (request) => {
          var _a2, _b2, _c;
          _push(`<li class="rounded border border-gray-200 bg-white p-3 text-sm"><div class="flex justify-between text-xs text-gray-500"><span>From ${serverRenderer_cjs_prodExports.ssrInterpolate(request.requester.name)}</span><span>${serverRenderer_cjs_prodExports.ssrInterpolate(request.status)}</span></div><p class="mt-1 font-medium text-gray-900">${serverRenderer_cjs_prodExports.ssrInterpolate(((_a2 = request.eventDraft) == null ? void 0 : _a2.title) || "Requested meeting")}</p><p class="text-xs text-gray-500">${serverRenderer_cjs_prodExports.ssrInterpolate(formatDateTime((_b2 = request.eventDraft) == null ? void 0 : _b2.startsAt))} \u2013 ${serverRenderer_cjs_prodExports.ssrInterpolate(formatDateTime((_c = request.eventDraft) == null ? void 0 : _c.endsAt))}</p>`);
          if (request.notes) {
            _push(`<p class="mt-2 text-xs text-gray-500">Note: ${serverRenderer_cjs_prodExports.ssrInterpolate(request.notes)}</p>`);
          } else {
            _push(`<!---->`);
          }
          if (request.status === "PENDING") {
            _push(`<div class="mt-3 flex gap-2"><button class="flex-1 rounded bg-emerald-500 px-3 py-2 text-xs font-medium text-emerald-950"> Approve </button><button class="flex-1 rounded bg-gray-200 px-3 py-2 text-xs font-medium text-gray-900"> Decline </button></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</li>`);
        });
        _push(`<!--]--></ul>`);
      }
      _push(`</section><section class="space-y-2"><h3 class="text-sm font-semibold text-gray-900">Outgoing requests</h3>`);
      if (!outgoingRequests.value.length) {
        _push(`<p class="text-xs text-gray-500">No outgoing requests.</p>`);
      } else {
        _push(`<ul class="space-y-3"><!--[-->`);
        serverRenderer_cjs_prodExports.ssrRenderList(outgoingRequests.value, (request) => {
          var _a2, _b2, _c;
          _push(`<li class="rounded border border-gray-200 bg-white p-3 text-sm"><div class="flex justify-between text-xs text-gray-500"><span>To ${serverRenderer_cjs_prodExports.ssrInterpolate(request.targetUser.name)}</span><span>${serverRenderer_cjs_prodExports.ssrInterpolate(request.status)}</span></div><p class="mt-1 font-medium text-gray-900">${serverRenderer_cjs_prodExports.ssrInterpolate(((_a2 = request.eventDraft) == null ? void 0 : _a2.title) || "Requested meeting")}</p><p class="text-xs text-gray-500">${serverRenderer_cjs_prodExports.ssrInterpolate(formatDateTime((_b2 = request.eventDraft) == null ? void 0 : _b2.startsAt))} \u2013 ${serverRenderer_cjs_prodExports.ssrInterpolate(formatDateTime((_c = request.eventDraft) == null ? void 0 : _c.endsAt))}</p>`);
          if (request.notes) {
            _push(`<p class="mt-2 text-xs text-gray-500">Note: ${serverRenderer_cjs_prodExports.ssrInterpolate(request.notes)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</li>`);
        });
        _push(`<!--]--></ul>`);
      }
      _push(`</section>`);
      if (selectedEvent.value) {
        _push(`<section class="space-y-3 rounded border border-gray-200 bg-white p-3"><div class="flex items-center justify-between"><h3 class="text-sm font-semibold text-gray-900">Selected event</h3><button class="text-xs text-gray-500 underline">Clear</button></div><div class="text-xs text-gray-500"> Event owner: ${serverRenderer_cjs_prodExports.ssrInterpolate(selectedEvent.value.ownerId === ((_b = currentUser.value) == null ? void 0 : _b.id) ? "Me" : "Another user")}</div>`);
        if (canEditSelected.value) {
          _push(`<!--[--><input${serverRenderer_cjs_prodExports.ssrRenderAttr("value", editEvent.title)} class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-400 focus:outline-none" placeholder="Event title"><input${serverRenderer_cjs_prodExports.ssrRenderAttr("value", editEvent.startsAt)} type="datetime-local" class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-400 focus:outline-none"><input${serverRenderer_cjs_prodExports.ssrRenderAttr("value", editEvent.endsAt)} type="datetime-local" class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-400 focus:outline-none"><input${serverRenderer_cjs_prodExports.ssrRenderAttr("value", editEvent.location)} class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-400 focus:outline-none" placeholder="Location (optional)"><select class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"><option value="PUBLIC"${serverRenderer_cjs_prodExports.ssrIncludeBooleanAttr(Array.isArray(editEvent.visibility) ? serverRenderer_cjs_prodExports.ssrLooseContain(editEvent.visibility, "PUBLIC") : serverRenderer_cjs_prodExports.ssrLooseEqual(editEvent.visibility, "PUBLIC")) ? " selected" : ""}>Public</option><option value="FREEBUSY"${serverRenderer_cjs_prodExports.ssrIncludeBooleanAttr(Array.isArray(editEvent.visibility) ? serverRenderer_cjs_prodExports.ssrLooseContain(editEvent.visibility, "FREEBUSY") : serverRenderer_cjs_prodExports.ssrLooseEqual(editEvent.visibility, "FREEBUSY")) ? " selected" : ""}>Free/busy</option><option value="PRIVATE"${serverRenderer_cjs_prodExports.ssrIncludeBooleanAttr(Array.isArray(editEvent.visibility) ? serverRenderer_cjs_prodExports.ssrLooseContain(editEvent.visibility, "PRIVATE") : serverRenderer_cjs_prodExports.ssrLooseEqual(editEvent.visibility, "PRIVATE")) ? " selected" : ""}>Private</option></select><div class="flex gap-2"><button class="rounded bg-emerald-500 px-3 py-2 text-sm font-medium text-emerald-950 disabled:cursor-not-allowed disabled:bg-emerald-300"${serverRenderer_cjs_prodExports.ssrIncludeBooleanAttr(eventSaving.value) ? " disabled" : ""}>${serverRenderer_cjs_prodExports.ssrInterpolate(eventSaving.value ? "Saving\u2026" : "Save changes")}</button><button class="rounded bg-red-500 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-red-300"${serverRenderer_cjs_prodExports.ssrIncludeBooleanAttr(eventDeleting.value) ? " disabled" : ""}>${serverRenderer_cjs_prodExports.ssrInterpolate(eventDeleting.value ? "Deleting\u2026" : "Delete")}</button></div><!--]-->`);
        } else {
          _push(`<p class="text-sm text-gray-600">You can only edit your own events.</p>`);
        }
        if (eventError.value) {
          _push(`<p class="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">${serverRenderer_cjs_prodExports.ssrInterpolate(eventError.value)}</p>`);
        } else {
          _push(`<!---->`);
        }
        if (eventSuccess.value) {
          _push(`<p class="rounded border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-700">${serverRenderer_cjs_prodExports.ssrInterpolate(eventSuccess.value)}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</section>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</aside><section class="rounded-lg border border-gray-200 bg-white p-4 min-h-0"><div class="h-full min-h-[400px]">`);
      _push(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_ClientOnly, { fallback: "Loading calendar..." }, {}, _parent));
      _push(`</div></section></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = vueExports.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/calendar/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-CvuTENbq.mjs.map
