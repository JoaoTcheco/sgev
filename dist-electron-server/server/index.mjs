globalThis.__nitro_main__ = import.meta.url;
import { N as NodeResponse, s as serve } from "./_libs/srvx.mjs";
import { d as defineHandler, H as HTTPError, t as toEventHandler, a as defineLazyEventHandler, b as H3Core } from "./_libs/h3.mjs";
import { d as decodePath, w as withLeadingSlash, a as withoutTrailingSlash, j as joinURL } from "./_libs/ufo.mjs";
import { promises } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import "node:http";
import "node:stream";
import "node:stream/promises";
import "node:https";
import "node:http2";
import "./_libs/rou3.mjs";
function lazyService(loader) {
  let promise, mod;
  return {
    fetch(req) {
      if (mod) {
        return mod.fetch(req);
      }
      if (!promise) {
        promise = loader().then((_mod) => mod = _mod.default || _mod);
      }
      return promise.then((mod2) => mod2.fetch(req));
    }
  };
}
const services = {
  ["ssr"]: lazyService(() => import("./_ssr/index.mjs"))
};
globalThis.__nitro_vite_envs__ = services;
const headers = ((m) => function headersRouteRule(event) {
  for (const [key2, value] of Object.entries(m.options || {})) {
    event.res.headers.set(key2, value);
  }
});
const assets = {
  "/assets/alert-dialog-Dzipbcyz.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"12b1-9+gicBSmI/p4xMFt6fl3NRjq9ow"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 4785,
    "path": "../public/assets/alert-dialog-Dzipbcyz.js"
  },
  "/assets/arrow-left-Dqwkk9-d.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"a6-9IxuGVFxj230iFIWauZrm+p1/WA"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 166,
    "path": "../public/assets/arrow-left-Dqwkk9-d.js"
  },
  "/assets/badge-CJ8klvVg.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"30e-fDuIUWfIj2xKtk5lOE/NzUSL+u8"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 782,
    "path": "../public/assets/badge-CJ8klvVg.js"
  },
  "/assets/banknote-CnOyEng_.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"f1-yuja1o3y1DfJMax6EBgiA56oAgw"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 241,
    "path": "../public/assets/banknote-CnOyEng_.js"
  },
  "/assets/auth-DZ56FePu.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"157c-5GYRsQyytbUk20zbM8MDdy1kDvg"',
    "mtime": "2026-06-26T18:15:08.675Z",
    "size": 5500,
    "path": "../public/assets/auth-DZ56FePu.js"
  },
  "/assets/caixa-nBI9zAnG.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1da9-PagEFEg6lpXkd/dFJTk3SqbRxE4"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 7593,
    "path": "../public/assets/caixa-nBI9zAnG.js"
  },
  "/assets/button-Bh4-vGtZ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"d47-7rlf8x/rsiiL8+F+ezH+ABJJVzQ"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 3399,
    "path": "../public/assets/button-Bh4-vGtZ.js"
  },
  "/assets/alertas-CNw817x6.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"b83-cahnkoQo048xC8+VCsuSPBqhbks"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 2947,
    "path": "../public/assets/alertas-CNw817x6.js"
  },
  "/assets/check-3cK_ppFJ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"78-A1KjQLlPSyMn1wcb/bx40Ea9Nmg"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 120,
    "path": "../public/assets/check-3cK_ppFJ.js"
  },
  "/assets/configuracoes-DuWMqsiB.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"48e0-aCBNXUeO6d8Bs8O304Dy0QF16FU"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 18656,
    "path": "../public/assets/configuracoes-DuWMqsiB.js"
  },
  "/assets/chart-column-Cjp5FaIG.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"fc-h9a/IjbOAbZiOwTsuY4xZVokIyM"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 252,
    "path": "../public/assets/chart-column-Cjp5FaIG.js"
  },
  "/assets/contas-Cfw78kYR.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"a86-MKcWte3xwaR+BIcHljrFt89OyPM"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 2694,
    "path": "../public/assets/contas-Cfw78kYR.js"
  },
  "/assets/dashboard-B1MCjzMe.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"9b2-+TUd5qwDBiali2kvhehYJpZXdfI"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 2482,
    "path": "../public/assets/dashboard-B1MCjzMe.js"
  },
  "/assets/dialog-nCTMbew0.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"7f7-dxiwynF0ITpTWm/MOHIihDIdtNY"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 2039,
    "path": "../public/assets/dialog-nCTMbew0.js"
  },
  "/assets/file-text-Lzeew-WD.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"182-svxh1+n2GjfceMi76VqyBWJwfLY"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 386,
    "path": "../public/assets/file-text-Lzeew-WD.js"
  },
  "/assets/entrada-DkmVoI8N.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"256e-iWPlLKcP/uTjM+JvHl6wbyhpZE8"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 9582,
    "path": "../public/assets/entrada-DkmVoI8N.js"
  },
  "/assets/fornecedores-D_lKuTAW.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1284-3tFHfKNCLWaJEVI1/iSYFegDM8o"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 4740,
    "path": "../public/assets/fornecedores-D_lKuTAW.js"
  },
  "/assets/estoque-CrjAfiaZ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"4359-5wMq92ElvgTEKUKtcoXbzI2S7DQ"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 17241,
    "path": "../public/assets/estoque-CrjAfiaZ.js"
  },
  "/assets/history-CYQVgm23.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"ee-Pv5esxPc36KU0SeWySzEk9xeXG4"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 238,
    "path": "../public/assets/history-CYQVgm23.js"
  },
  "/assets/card-JvJcpZup.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"3fa-CYyEGd5ZlKwWpe5v/vkE3b/feEU"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 1018,
    "path": "../public/assets/card-JvJcpZup.js"
  },
  "/assets/historico-DWRa-RV4.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"c19-xzHXePYEdRUuZNvbN4DKKktgxFg"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 3097,
    "path": "../public/assets/historico-DWRa-RV4.js"
  },
  "/assets/index-24NU-J6m.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"de1-Va+iU4r+0I9BjlNS4phyvmpBZvE"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 3553,
    "path": "../public/assets/index-24NU-J6m.js"
  },
  "/assets/index-B-PPYN7z.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"220-kZT5TQvxmil/RNdQxEXWeTUxbgI"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 544,
    "path": "../public/assets/index-B-PPYN7z.js"
  },
  "/assets/index-BE5vPeYF.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1a55-Cwj+IzY2R34QKwJck1VPvd/R/8g"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 6741,
    "path": "../public/assets/index-BE5vPeYF.js"
  },
  "/assets/estatisticas-C7DYg3Wh.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"68967-6IBQhowdSLSpr72HcqGvGDRfsNI"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 428391,
    "path": "../public/assets/estatisticas-C7DYg3Wh.js"
  },
  "/assets/index-C5kaDJOn.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"a86-pmg0sos3x5Kww/Qe96Q60PlqBf8"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 2694,
    "path": "../public/assets/index-C5kaDJOn.js"
  },
  "/assets/index-CyWjUp0V.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"e8-6HH1XMgAIMdzfo8BAYvNb7U59JA"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 232,
    "path": "../public/assets/index-CyWjUp0V.js"
  },
  "/assets/index-C007mgGE.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"2b6-xGRekPG0NNl2rJ3axLkhqob4rX8"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 694,
    "path": "../public/assets/index-C007mgGE.js"
  },
  "/assets/index-D255JJPW.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"6a91-JIiQooFXJ3kEo6fzH3k/An20c0Q"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 27281,
    "path": "../public/assets/index-D255JJPW.js"
  },
  "/assets/index-D8SAm4Sc.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"832-TyA+UPn3j6lDwG0GVPjLNiZXe1A"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 2098,
    "path": "../public/assets/index-D8SAm4Sc.js"
  },
  "/assets/index-f3U-Q4c3.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"4d07-H+wYfFJkhABMrnDjRoHkpkeh6Yo"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 19719,
    "path": "../public/assets/index-f3U-Q4c3.js"
  },
  "/assets/index-DtqBFgK5.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"29-crG9x4dYeQi7xsfEfaRvCOejUcg"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 41,
    "path": "../public/assets/index-DtqBFgK5.js"
  },
  "/assets/index-DWcgWDvq.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"11d0-p22pm7bKPyI5RSKPIB4z1gJOu5o"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 4560,
    "path": "../public/assets/index-DWcgWDvq.js"
  },
  "/assets/index-DI5n2U3R.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"8285-iDE25oI8/Q/Tcp0JQ88RlyIOomE"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 33413,
    "path": "../public/assets/index-DI5n2U3R.js"
  },
  "/assets/input-C9WxoDrc.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"24e-748EvM1YOlkdO5mJHFWf9oB+yeI"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 590,
    "path": "../public/assets/input-C9WxoDrc.js"
  },
  "/assets/loader-circle-BDYvjMOW.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"8c-HLWhY0x8OTlIPfNJVN95+0QflD0"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 140,
    "path": "../public/assets/loader-circle-BDYvjMOW.js"
  },
  "/assets/label-BVQuGl8L.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"3d1-k5vT7eMGgqw9vNhtDirUBmv2z7s"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 977,
    "path": "../public/assets/label-BVQuGl8L.js"
  },
  "/assets/lock-BJVlaKmk.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"ca-hmU3owDHZ5SwvsmkiG/auHH7XV0"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 202,
    "path": "../public/assets/lock-BJVlaKmk.js"
  },
  "/assets/package-BPbkHfHv.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"175-haJ8Q62I9akWtnMs+hVTA4chipk"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 373,
    "path": "../public/assets/package-BPbkHfHv.js"
  },
  "/assets/package-plus-C6d-34lo.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1c9-eoPUOXbVihNpqquUmsGq6X2zDDM"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 457,
    "path": "../public/assets/package-plus-C6d-34lo.js"
  },
  "/assets/pencil-CY_HOh_t.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"115-cgf+xU1mmInM2vEq1EWrsh2B2zA"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 277,
    "path": "../public/assets/pencil-CY_HOh_t.js"
  },
  "/assets/plus-D0BeveGi.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"9a-xOjY/FLBKhV77VIOI7QxzHEpzf0"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 154,
    "path": "../public/assets/plus-D0BeveGi.js"
  },
  "/assets/print-labels-CksUWSxC.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"16f7-utgqr560YM0mS1LBB6LpPCAB2wc"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 5879,
    "path": "../public/assets/print-labels-CksUWSxC.js"
  },
  "/assets/printer-Bkr9M5p0.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"140-pm1z5SXlQtXHYC3DadGDFFgXmnM"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 320,
    "path": "../public/assets/printer-Bkr9M5p0.js"
  },
  "/assets/receipt-CBElOeCj.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"125-19jgoYTMyWkdmhQbaV9fFl+5ydM"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 293,
    "path": "../public/assets/receipt-CBElOeCj.js"
  },
  "/assets/recibo._ref-BXIHDw-M.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"9e-52yTeaMYQmTgTKN+RsYZc36+U8I"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 158,
    "path": "../public/assets/recibo._ref-BXIHDw-M.js"
  },
  "/assets/recibo._ref-Dgd3mgNm.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"c4-yGxRsiE7t71Rns8tvStSEqXJTF8"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 196,
    "path": "../public/assets/recibo._ref-Dgd3mgNm.js"
  },
  "/assets/recibo._ref-BWG4fKtb.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1c4e-eCOvRIcPmXNhQL60lHDHJ7nDfKM"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 7246,
    "path": "../public/assets/recibo._ref-BWG4fKtb.js"
  },
  "/assets/recibo.index-iGLdUU6k.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"84d-8YPButU6KfEWK72ji3j1GZc8jxo"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 2125,
    "path": "../public/assets/recibo.index-iGLdUU6k.js"
  },
  "/assets/index-Dw7cFs0f.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"a4654-bceBofYxrlPb7422aMfnT+ka+9I"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 673364,
    "path": "../public/assets/index-Dw7cFs0f.js"
  },
  "/assets/relatorios-C9VvqxGD.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"9f5-mUULB2eOWI5+g8Wt915huQ2JyZ8"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 2549,
    "path": "../public/assets/relatorios-C9VvqxGD.js"
  },
  "/assets/role-gate-B_767oCx.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"453-JQPSkyR1H3JoC718bS20ZospbMc"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 1107,
    "path": "../public/assets/role-gate-B_767oCx.js"
  },
  "/assets/scan-line-ltB80h11.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"14c-2hrK90cnNay0hFnDAxQjIz9IrLA"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 332,
    "path": "../public/assets/scan-line-ltB80h11.js"
  },
  "/assets/route-BPkzSReg.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"7341-NvLpxswEI3GsBcE6sS0/GVmrYhA"',
    "mtime": "2026-06-26T18:15:08.675Z",
    "size": 29505,
    "path": "../public/assets/route-BPkzSReg.js"
  },
  "/assets/search-CBp6sfOB.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"aa-hH+nMtIg+jMX/HOWozqT0Fhcv8U"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 170,
    "path": "../public/assets/search-CBp6sfOB.js"
  },
  "/assets/separator-Dhhwdp2o.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"440-p4WAVqpAzDY/IvxY4QUy/eOMAe8"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 1088,
    "path": "../public/assets/separator-Dhhwdp2o.js"
  },
  "/assets/settings-DGPpXQwG.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1e3-GGinuq+Iy2HCFShgV1/Ldg003JY"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 483,
    "path": "../public/assets/settings-DGPpXQwG.js"
  },
  "/assets/select-D5DQqaDC.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"5812-ynYk8cNTDtHAhlkML+kJolP1by0"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 22546,
    "path": "../public/assets/select-D5DQqaDC.js"
  },
  "/assets/shield-check-DULcHAD8.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"13c-Bq5vpD7UhvvzhZF4OUtYSBrFIQ8"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 316,
    "path": "../public/assets/shield-check-DULcHAD8.js"
  },
  "/assets/shopping-cart-COKsqDPr.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"120-21bcH72vZ9KCsnI4DL/vmxZeE/Y"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 288,
    "path": "../public/assets/shopping-cart-COKsqDPr.js"
  },
  "/assets/sonner-Cmzu06CM.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"2dc-bWsomuR+STvx2TI4OlvC2YqdIHg"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 732,
    "path": "../public/assets/sonner-Cmzu06CM.js"
  },
  "/assets/styles-Cp25kgk7.css": {
    "type": "text/css; charset=utf-8",
    "etag": '"15b4f-3DVU7un7HB3V49dQeAWpY8YkUMs"',
    "mtime": "2026-06-26T18:15:08.675Z",
    "size": 88911,
    "path": "../public/assets/styles-Cp25kgk7.css"
  },
  "/assets/switch-C5cuW2kY.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"a39-ROWSzg7QnyG/W8i7igsc6jjcSxA"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 2617,
    "path": "../public/assets/switch-C5cuW2kY.js"
  },
  "/assets/table-B0GOl6sy.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"63b-Br8z1CKdtXpg8+Ia9tdExt7RPK0"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 1595,
    "path": "../public/assets/table-B0GOl6sy.js"
  },
  "/assets/tabs-DaZMfjwn.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"d3c-6bOIsyLVCZfyqf3CJpCSz2WSYyU"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 3388,
    "path": "../public/assets/tabs-DaZMfjwn.js"
  },
  "/assets/textarea-Dj-YtP_1.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1e8-UF1AiuG9czG4VQXNACza0M4Td6g"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 488,
    "path": "../public/assets/textarea-Dj-YtP_1.js"
  },
  "/assets/trending-up-Dvrwxsbk.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"b0-Jc6MAVMimF84/Sn0+DQOy8HN93E"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 176,
    "path": "../public/assets/trending-up-Dvrwxsbk.js"
  },
  "/assets/trash-2-D38MNwBF.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"149-+jEA+DUW0WGHBfxYwIximO37da8"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 329,
    "path": "../public/assets/trash-2-D38MNwBF.js"
  },
  "/assets/triangle-alert-BZmMjejZ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"10a-kJgndM/XIaHgUnSHvthBSKb4a/g"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 266,
    "path": "../public/assets/triangle-alert-BZmMjejZ.js"
  },
  "/assets/truck-BRnC_WFn.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"192-qoXwBjl9X1ILT7djDApS+lgI1CE"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 402,
    "path": "../public/assets/truck-BRnC_WFn.js"
  },
  "/assets/use-auth-DbdwpMhx.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"604-T4+7jqEn2gXBjS/NqBo/DOeieBs"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 1540,
    "path": "../public/assets/use-auth-DbdwpMhx.js"
  },
  "/assets/useMutation-C1QTgR-v.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"8a2-+WmWYYhwQg3CLLGUqgUyiCF4hLM"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 2210,
    "path": "../public/assets/useMutation-C1QTgR-v.js"
  },
  "/assets/use-barcode-scanner-DHfwHrho.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"279-oz7FsUwhsZQ8VEoms7cqngur+NQ"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 633,
    "path": "../public/assets/use-barcode-scanner-DHfwHrho.js"
  },
  "/assets/users-4snxwj_c.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"133-Ev7pHtMeD9fpSFdEZtz1cg2A+bY"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 307,
    "path": "../public/assets/users-4snxwj_c.js"
  },
  "/assets/utilizadores-DD8naCW_.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"42b5-UzeGur65buL2vss9DW2JpZn6ijU"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 17077,
    "path": "../public/assets/utilizadores-DD8naCW_.js"
  },
  "/assets/utils-CtA4EDA_.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"6cfc-9zejI/yD8kv1aQyGighr3sOlPYE"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 27900,
    "path": "../public/assets/utils-CtA4EDA_.js"
  },
  "/assets/vendas-Yp43qJuz.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"4545-24th+IEA/5LP4B+JJbNoHj64KNg"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 17733,
    "path": "../public/assets/vendas-Yp43qJuz.js"
  },
  "/assets/wallet-C6DOYJ7g.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"11f-o/y3o7I5VbyUwXYtejdy/9vkWzI"',
    "mtime": "2026-06-26T18:15:08.676Z",
    "size": 287,
    "path": "../public/assets/wallet-C6DOYJ7g.js"
  }
};
function readAsset(id) {
  const serverDir = dirname(fileURLToPath(globalThis.__nitro_main__));
  return promises.readFile(resolve(serverDir, assets[id].path));
}
const publicAssetBases = {};
function isPublicAssetURL(id = "") {
  if (assets[id]) {
    return true;
  }
  for (const base in publicAssetBases) {
    if (id.startsWith(base)) {
      return true;
    }
  }
  return false;
}
function getAsset(id) {
  return assets[id];
}
const METHODS = /* @__PURE__ */ new Set(["HEAD", "GET"]);
const EncodingMap = {
  gzip: ".gz",
  br: ".br",
  zstd: ".zst"
};
const _attSPk = defineHandler((event) => {
  if (event.req.method && !METHODS.has(event.req.method)) {
    return;
  }
  let id = decodePath(withLeadingSlash(withoutTrailingSlash(event.url.pathname)));
  let asset;
  const encodingHeader = event.req.headers.get("accept-encoding") || "";
  const encodings = [...encodingHeader.split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(), ""];
  for (const encoding of encodings) {
    for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
      const _asset = getAsset(_id);
      if (_asset) {
        asset = _asset;
        id = _id;
        break;
      }
    }
  }
  if (!asset) {
    if (isPublicAssetURL(id)) {
      event.res.headers.delete("Cache-Control");
      throw new HTTPError({ status: 404 });
    }
    return;
  }
  if (encodings.length > 1) {
    event.res.headers.append("Vary", "Accept-Encoding");
  }
  const ifNotMatch = event.req.headers.get("if-none-match") === asset.etag;
  if (ifNotMatch) {
    event.res.status = 304;
    event.res.statusText = "Not Modified";
    return "";
  }
  const ifModifiedSinceH = event.req.headers.get("if-modified-since");
  const mtimeDate = new Date(asset.mtime);
  if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
    event.res.status = 304;
    event.res.statusText = "Not Modified";
    return "";
  }
  if (asset.type) {
    event.res.headers.set("Content-Type", asset.type);
  }
  if (asset.etag && !event.res.headers.has("ETag")) {
    event.res.headers.set("ETag", asset.etag);
  }
  if (asset.mtime && !event.res.headers.has("Last-Modified")) {
    event.res.headers.set("Last-Modified", mtimeDate.toUTCString());
  }
  if (asset.encoding && !event.res.headers.has("Content-Encoding")) {
    event.res.headers.set("Content-Encoding", asset.encoding);
  }
  if (asset.size > 0 && !event.res.headers.has("Content-Length")) {
    event.res.headers.set("Content-Length", asset.size.toString());
  }
  return readAsset(id);
});
const findRouteRules = /* @__PURE__ */ (() => {
  const $0 = [{ name: "headers", route: "/assets/**", handler: headers, options: { "cache-control": "public, max-age=31536000, immutable" } }];
  return (m, p) => {
    let r = [];
    if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
    let s = p.split("/"), l = s.length;
    if (l > 1) {
      if (s[1] === "assets") {
        r.unshift({ data: $0, params: { "_": s.slice(2).join("/") } });
      }
    }
    return r;
  };
})();
const _lazy_j21Qvj = defineLazyEventHandler(() => import("./_chunks/ssr-renderer.mjs"));
const findRoute = /* @__PURE__ */ (() => {
  const data = { route: "/**", handler: _lazy_j21Qvj };
  return ((_m, p) => {
    return { data, params: { "_": p.slice(1) } };
  });
})();
const globalMiddleware = [
  toEventHandler(_attSPk)
].filter(Boolean);
const errorHandler$1 = (error, event) => {
  const res = defaultHandler(error, event);
  return new NodeResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event) {
  const unhandled = error.unhandled ?? !HTTPError.isError(error);
  const { status = 500, statusText = "" } = unhandled ? {} : error;
  if (status === 404) {
    const url = event.url || new URL(event.req.url);
    const baseURL = "/";
    if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) {
      return {
        status: 302,
        headers: new Headers({ location: `${baseURL}${url.pathname.slice(1)}${url.search}` })
      };
    }
  }
  const headers2 = new Headers(unhandled ? {} : error.headers);
  headers2.set("content-type", "application/json; charset=utf-8");
  const jsonBody = unhandled ? {
    status,
    unhandled: true
  } : typeof error.toJSON === "function" ? error.toJSON() : {
    status,
    statusText,
    message: error.message
  };
  return {
    status,
    statusText,
    headers: headers2,
    body: {
      error: true,
      ...jsonBody
    }
  };
}
const errorHandlers = [errorHandler$1];
async function errorHandler(error, event) {
  for (const handler of errorHandlers) {
    try {
      const response = await handler(error, event, { defaultHandler });
      if (response) {
        return response;
      }
    } catch (error2) {
      console.error(error2);
    }
  }
}
function createNitroApp() {
  const captureError = (error, errorCtx) => {
    if (errorCtx?.event) {
      const errors = errorCtx.event.req.context?.nitro?.errors;
      if (errors) {
        errors.push({ error, context: errorCtx });
      }
    }
  };
  const h3App = createH3App({
    onError(error, event) {
      return errorHandler(error, event);
    }
  });
  let appHandler = (req) => {
    req.context ||= {};
    req.context.nitro = req.context.nitro || { errors: [] };
    return h3App.fetch(req);
  };
  return {
    fetch: appHandler,
    h3: h3App,
    hooks: void 0,
    captureError
  };
}
function createH3App(config) {
  const h3App = new H3Core(config);
  h3App["~findRoute"] = (event) => findRoute(event.req.method, event.url.pathname);
  h3App["~middleware"].push(...globalMiddleware);
  h3App["~getMiddleware"] = (event, route) => {
    const pathname = event.url.pathname;
    const method = event.req.method;
    const middleware = [];
    const routeRules = getRouteRules(method, pathname);
    event.context.routeRules = routeRules?.routeRules;
    if (routeRules?.routeRuleMiddleware.length) {
      middleware.push(...routeRules.routeRuleMiddleware);
    }
    middleware.push(...h3App["~middleware"]);
    if (route?.data?.middleware?.length) {
      middleware.push(...route.data.middleware);
    }
    return middleware;
  };
  return h3App;
}
const APP_ID = "default";
function useNitroApp() {
  let instance = useNitroApp._instance;
  if (instance) {
    return instance;
  }
  instance = useNitroApp._instance = createNitroApp();
  globalThis.__nitro__ = globalThis.__nitro__ || {};
  globalThis.__nitro__[APP_ID] = instance;
  return instance;
}
function getRouteRules(method, pathname) {
  const m = findRouteRules(method, pathname);
  if (!m?.length) {
    return { routeRuleMiddleware: [] };
  }
  const routeRules = {};
  for (const layer of m) {
    for (const rule of layer.data) {
      const currentRule = routeRules[rule.name];
      if (currentRule) {
        if (rule.options === false) {
          delete routeRules[rule.name];
          continue;
        }
        if (typeof currentRule.options === "object" && typeof rule.options === "object") {
          currentRule.options = {
            ...currentRule.options,
            ...rule.options
          };
        } else {
          currentRule.options = rule.options;
        }
        currentRule.route = rule.route;
        currentRule.params = {
          ...currentRule.params,
          ...layer.params
        };
      } else if (rule.options !== false) {
        routeRules[rule.name] = {
          ...rule,
          params: layer.params
        };
      }
    }
  }
  const middleware = [];
  const orderedRules = Object.values(routeRules).sort((a, b) => (a.handler?.order || 0) - (b.handler?.order || 0));
  for (const rule of orderedRules) {
    if (rule.options === false || !rule.handler) {
      continue;
    }
    middleware.push(rule.handler(rule));
  }
  return {
    routeRules,
    routeRuleMiddleware: middleware
  };
}
function _captureError(error, type) {
  console.error(`[${type}]`, error);
  useNitroApp().captureError?.(error, { tags: [type] });
}
function trapUnhandledErrors() {
  process.on("unhandledRejection", (error) => _captureError(error, "unhandledRejection"));
  process.on("uncaughtException", (error) => _captureError(error, "uncaughtException"));
}
const tracingSrvxPlugins = [];
const _parsedPort = Number.parseInt(process.env.NITRO_PORT ?? process.env.PORT ?? "");
const port = Number.isNaN(_parsedPort) ? 3e3 : _parsedPort;
const host = process.env.NITRO_HOST || process.env.HOST;
const cert = process.env.NITRO_SSL_CERT;
const key = process.env.NITRO_SSL_KEY;
const nitroApp = useNitroApp();
serve({
  port,
  hostname: host,
  tls: cert && key ? {
    cert,
    key
  } : void 0,
  fetch: nitroApp.fetch,
  plugins: [...tracingSrvxPlugins]
});
trapUnhandledErrors();
const nodeServer = {};
export {
  nodeServer as default
};
