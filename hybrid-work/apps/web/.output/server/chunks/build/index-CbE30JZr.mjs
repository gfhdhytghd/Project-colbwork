import { v as vueExports, u as useRouter, s as serverRenderer_cjs_prodExports } from './server.mjs';
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

const _sfc_main = /* @__PURE__ */ vueExports.defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    useRouter();
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${serverRenderer_cjs_prodExports.ssrRenderAttrs(vueExports.mergeProps({ class: "flex flex-1 h-full flex-col items-center justify-center gap-6 bg-white text-gray-900" }, _attrs))}><div class="text-center"><h1 class="text-4xl font-semibold">Hybrid Work Collaboration</h1><p class="text-gray-600 mt-2">Chat, shared calendars, and desk orchestration in one place.</p></div><button class="px-4 py-2 rounded bg-emerald-500 text-emerald-950 hover:bg-emerald-400"> Open Workspace </button></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = vueExports.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-CbE30JZr.mjs.map
