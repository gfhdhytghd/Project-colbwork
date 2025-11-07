import { v as vueExports, u as useRouter, s as serverRenderer_cjs_prodExports } from './server.mjs';
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
    const desks = vueExports.ref([]);
    const isLoading = vueExports.ref(true);
    const loadError = vueExports.ref(null);
    const selectedDesk = vueExports.ref(null);
    const myReservation = vueExports.ref(null);
    const isReserving = vueExports.ref(false);
    const isCancelling = vueExports.ref(false);
    const actionError = vueExports.ref(null);
    const actionSuccess = vueExports.ref(null);
    const demoUserEmail = useState("demoUserEmail", () => "alice@acme.com");
    const selectedOccupant = vueExports.computed(
      () => selectedDesk.value ? occupantOf(selectedDesk.value) : null
    );
    async function loadDesks() {
      isLoading.value = true;
      loadError.value = null;
      try {
        const { data } = await api.get("/desks", { params: { floor: "F1" } });
        const fresh = data;
        desks.value = fresh;
        if (selectedDesk.value) {
          const found = fresh.find((d) => d.id === selectedDesk.value.id) || null;
          selectedDesk.value = found;
        }
        computeMyReservation();
      } catch (e) {
        loadError.value = (e == null ? void 0 : e.message) || "Failed to load desks";
        desks.value = [];
      } finally {
        isLoading.value = false;
      }
    }
    function computeMyReservation() {
      const me = demoUserEmail.value;
      for (const d of desks.value) {
        const r = (d.reservations || []).find((res) => {
          var _a;
          return res.status === "ACTIVE" && ((_a = res.user) == null ? void 0 : _a.email) === me;
        });
        if (r) {
          myReservation.value = r;
          return;
        }
      }
      myReservation.value = null;
    }
    function occupantOf(d) {
      var _a;
      const r = (d.reservations || [])[0];
      return (_a = r == null ? void 0 : r.user) != null ? _a : null;
    }
    useRouter();
    vueExports.watch(demoUserEmail, loadDesks);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${serverRenderer_cjs_prodExports.ssrRenderAttrs(vueExports.mergeProps({ class: "p-6 bg-white text-gray-900 flex-1 min-h-0" }, _attrs))}><div class="mb-4 flex items-center justify-between"><h1 class="text-2xl font-semibold">Office Map</h1>`);
      if (myReservation.value) {
        _push(`<div class="flex items-center gap-3 text-sm"><span>My desk active</span><button class="rounded bg-gray-200 px-3 py-1"${serverRenderer_cjs_prodExports.ssrIncludeBooleanAttr(isCancelling.value) ? " disabled" : ""}>${serverRenderer_cjs_prodExports.ssrInterpolate(isCancelling.value ? "Leaving\u2026" : "Leave desk")}</button></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (isLoading.value) {
        _push(`<div class="text-gray-500">Loading desks\u2026</div>`);
      } else if (!desks.value.length) {
        _push(`<div class="rounded border border-gray-200 bg-white p-4 text-sm text-gray-600"> No desks found on floor F1. If you recently reset the database, please run the seed script and reload. </div>`);
      } else {
        _push(`<div class="grid grid-cols-[1fr_320px] gap-6 min-h-0"><svg viewBox="0 0 1200 800" class="h-full min-h-[400px] w-full rounded border border-gray-200 bg-white"><!--[-->`);
        serverRenderer_cjs_prodExports.ssrRenderList(desks.value, (desk) => {
          _push(`<g><rect${serverRenderer_cjs_prodExports.ssrRenderAttr("x", desk.x)}${serverRenderer_cjs_prodExports.ssrRenderAttr("y", desk.y)} width="60" height="40" rx="6" class="${serverRenderer_cjs_prodExports.ssrRenderClass(occupantOf(desk) ? "fill-red-300 stroke-red-400 cursor-pointer" : "fill-emerald-300 stroke-emerald-400 cursor-pointer")}"></rect><text${serverRenderer_cjs_prodExports.ssrRenderAttr("x", desk.x + 30)}${serverRenderer_cjs_prodExports.ssrRenderAttr("y", desk.y + 25)} text-anchor="middle" class="fill-gray-900 text-xs select-none">${serverRenderer_cjs_prodExports.ssrInterpolate(desk.label)}</text></g>`);
        });
        _push(`<!--]--></svg>`);
        if (selectedDesk.value) {
          _push(`<aside class="rounded border border-gray-200 bg-white p-4"><div class="mb-3 text-sm text-gray-500">Desk ${serverRenderer_cjs_prodExports.ssrInterpolate(selectedDesk.value.label)}</div>`);
          if (actionError.value) {
            _push(`<p class="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">${serverRenderer_cjs_prodExports.ssrInterpolate(actionError.value)}</p>`);
          } else {
            _push(`<!---->`);
          }
          if (actionSuccess.value) {
            _push(`<p class="rounded border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-700">${serverRenderer_cjs_prodExports.ssrInterpolate(actionSuccess.value)}</p>`);
          } else {
            _push(`<!---->`);
          }
          if (selectedOccupant.value) {
            _push(`<div class="space-y-3"><div><div class="text-sm text-gray-500">Occupied by</div><div class="text-base font-medium text-gray-900">${serverRenderer_cjs_prodExports.ssrInterpolate(selectedOccupant.value.name)}</div></div><div class="flex gap-2"><button class="rounded bg-emerald-500 px-3 py-2 text-sm font-medium text-emerald-950"> Message </button><button class="rounded bg-gray-200 px-3 py-2 text-sm"> View calendar </button></div></div>`);
          } else {
            _push(`<div class="space-y-3"><div class="text-sm text-gray-500">This desk is available.</div><button class="rounded bg-emerald-500 px-3 py-2 text-sm font-medium text-emerald-950"${serverRenderer_cjs_prodExports.ssrIncludeBooleanAttr(isReserving.value) ? " disabled" : ""}>${serverRenderer_cjs_prodExports.ssrInterpolate(isReserving.value ? "Reserving\u2026" : "Reserve for 4h")}</button></div>`);
          }
          _push(`</aside>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = vueExports.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/office/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-DkMY9gua.mjs.map
