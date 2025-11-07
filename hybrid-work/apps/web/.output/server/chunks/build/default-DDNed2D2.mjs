import { _ as __nuxt_component_0 } from './nuxt-link-D4GkThpp.mjs';
import { v as vueExports, s as serverRenderer_cjs_prodExports } from './server.mjs';
import { u as useState } from './state-BVUnE2Hd.mjs';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import 'node:zlib';
import 'node:stream';
import 'node:util';
import 'node:net';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'vue/server-renderer';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'vue';
import 'unhead/plugins';

const _sfc_main = /* @__PURE__ */ vueExports.defineComponent({
  __name: "default",
  __ssrInlineRender: true,
  setup(__props) {
    const demoUserEmail = useState("demoUserEmail", () => "alice@acme.com");
    const demoUsers = [
      { label: "Alice Example", value: "alice@acme.com" },
      { label: "Bob Example", value: "bob@acme.com" }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${serverRenderer_cjs_prodExports.ssrRenderAttrs(vueExports.mergeProps({ class: "min-h-screen h-screen bg-white text-gray-900 flex flex-col" }, _attrs))}><header class="border-b border-gray-200 bg-white"><nav class="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4">`);
      _push(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "font-semibold"
      }, {
        default: vueExports.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Hybrid Work`);
          } else {
            return [
              vueExports.createTextVNode("Hybrid Work")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<div class="flex items-center gap-6 text-sm"><div class="flex gap-4">`);
      _push(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_NuxtLink, { to: "/chat" }, {
        default: vueExports.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Chat`);
          } else {
            return [
              vueExports.createTextVNode("Chat")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_NuxtLink, { to: "/calendar" }, {
        default: vueExports.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Calendar`);
          } else {
            return [
              vueExports.createTextVNode("Calendar")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_NuxtLink, { to: "/office" }, {
        default: vueExports.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Office`);
          } else {
            return [
              vueExports.createTextVNode("Office")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="flex items-center gap-2 text-xs text-gray-600"><span>Acting as</span><select class="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900"><!--[-->`);
      serverRenderer_cjs_prodExports.ssrRenderList(demoUsers, (user) => {
        _push(`<option${serverRenderer_cjs_prodExports.ssrRenderAttr("value", user.value)}${serverRenderer_cjs_prodExports.ssrIncludeBooleanAttr(Array.isArray(vueExports.unref(demoUserEmail)) ? serverRenderer_cjs_prodExports.ssrLooseContain(vueExports.unref(demoUserEmail), user.value) : serverRenderer_cjs_prodExports.ssrLooseEqual(vueExports.unref(demoUserEmail), user.value)) ? " selected" : ""}>${serverRenderer_cjs_prodExports.ssrInterpolate(user.label)}</option>`);
      });
      _push(`<!--]--></select></div></div></nav></header><main class="flex flex-1 min-h-0 h-full bg-white">`);
      serverRenderer_cjs_prodExports.ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`</main></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = vueExports.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("layouts/default.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=default-DDNed2D2.mjs.map
