
/// <reference path="app.config.d.ts" />
/// <reference path="runtime-config.d.ts" />
/// <reference types="/home/wilf/data/ED100PJ4/hybrid-work/node_modules/.pnpm/@nuxt+nitro-server@3.20.0_db0@0.3.4_ioredis@5.8.2_magicast@0.5.1_nuxt@3.20.0_@parcel+wa_0cc1af14d89733ffb207b9fd2088c27a/node_modules/@nuxt/nitro-server/dist/index.mjs" />
/// <reference path="nitro-middleware.d.ts" />
/// <reference path="./schema.d.ts" />

import type { RuntimeConfig } from 'nuxt/schema'
import type { H3Event } from 'h3'
import type { LogObject } from 'consola'
import type { NuxtIslandContext, NuxtIslandResponse, NuxtRenderHTMLContext } from 'nuxt/app'

declare module 'nitropack' {
  interface NitroRuntimeConfigApp {
    buildAssetsDir: string
    cdnURL: string
  }
  interface NitroRuntimeConfig extends RuntimeConfig {}
  interface NitroRouteConfig {
    ssr?: boolean
    noScripts?: boolean
    /** @deprecated Use `noScripts` instead */
    experimentalNoScripts?: boolean
  }
  interface NitroRouteRules {
    ssr?: boolean
    noScripts?: boolean
    /** @deprecated Use `noScripts` instead */
    experimentalNoScripts?: boolean
    appMiddleware?: Record<string, boolean>
  }
  interface NitroRuntimeHooks {
    'dev:ssr-logs': (ctx: { logs: LogObject[], path: string }) => void | Promise<void>
    'render:html': (htmlContext: NuxtRenderHTMLContext, context: { event: H3Event }) => void | Promise<void>
    'render:island': (islandResponse: NuxtIslandResponse, context: { event: H3Event, islandContext: NuxtIslandContext }) => void | Promise<void>
  }
}
