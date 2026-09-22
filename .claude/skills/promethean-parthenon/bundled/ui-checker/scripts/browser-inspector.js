#!/usr/bin/env node
/**
 * ui-checker / scripts / browser-inspector.js
 *
 * OPTIONAL — requires Playwright (usually not available in Claude.ai web chat).
 * Check availability first: npx playwright --version
 *
 * Captures screenshots in light + dark mode and measures element dimensions
 * across multiple viewports using a real browser engine.
 *
 * Usage:
 *   node browser-inspector.js --file page.html [options]
 *   node browser-inspector.js --url https://example.com [options]
 *
 *   --selectors  Comma-separated CSS selectors (default: body,main,nav,header,footer)
 *   --viewports  Comma-separated presets or WxH  (default: mobile,desktop)
 *   --outputDir  Screenshot directory             (default: /tmp/ui-checker/screenshots)
 *   --output     JSON results path               (default: stdout)
 *   --no-dark    Skip dark-mode screenshots
 */

'use strict';
const path = require('path');
const fs   = require('fs');

const PRESETS = {
  'mobile-s':   { width: 320,  height: 568  },
  'mobile':     { width: 375,  height: 812  },
  'mobile-lg':  { width: 430,  height: 932  },
  'tablet':     { width: 768,  height: 1024 },
  'tablet-lg':  { width: 1024, height: 768  },
  'desktop':    { width: 1280, height: 800  },
  'desktop-lg': { width: 1440, height: 900  },
  '4k':         { width: 1920, height: 1080 },
};

function parseVP(name) {
  if (PRESETS[name]) return PRESETS[name];
  const m = name.match(/^(\d+)[x×](\d+)$/);
  if (m) return { width: +m[1], height: +m[2] };
  console.warn(`Unknown viewport "${name}", using desktop.`);
  return PRESETS.desktop;
}

function parseArgs(argv) {
  const a = { selectors: 'body,main,nav,header,footer', viewports: 'mobile,desktop', noDark: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--no-dark') { a.noDark = true; continue; }
    if (argv[i].startsWith('--')) {
      const k = argv[i].slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      a[k] = argv[++i];
    }
  }
  return a;
}

const STYLE_PROPS = [
  'width','height','minWidth','maxWidth','minHeight','maxHeight',
  'color','backgroundColor','borderColor','boxShadow',
  'fontSize','fontWeight','lineHeight',
  'display','position','overflow','overflowX','overflowY',
  'padding','margin','zIndex','opacity','visibility',
  'flexDirection','alignItems','justifyContent',
];

async function measure(page, sel) {
  try {
    const el  = await page.$(sel);
    if (!el) return { error: `"${sel}" not found` };
    const box = await el.boundingBox();
    const css = await page.evaluate((s, props) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const cs = window.getComputedStyle(el), out = {};
      for (const p of props) out[p] = cs[p];
      return out;
    }, sel, STYLE_PROPS);
    return { boundingBox: box, computedStyles: css };
  } catch (e) { return { error: e.message }; }
}

(async () => {
  const args = parseArgs(process.argv.slice(2));
  if (!args.file && !args.url) {
    console.error('Usage: node browser-inspector.js [--file path | --url URL] [--selectors "body,main"] [--viewports "mobile,desktop"] [--output results.json] [--no-dark]');
    process.exit(1);
  }

  let playwright;
  try { playwright = require('playwright'); }
  catch { console.error('Playwright not installed.\nRun: npm install -g playwright && npx playwright install chromium'); process.exit(1); }

  const targetUrl = args.file ? `file://${path.resolve(args.file)}` : args.url;
  const vpNames   = args.viewports.split(',').map(s => s.trim());
  const selectors = args.selectors.split(',').map(s => s.trim());
  const outDir    = args.outputDir || '/tmp/ui-checker/screenshots';
  fs.mkdirSync(outDir, { recursive: true });

  const { chromium } = playwright;
  const browser = await chromium.launch({ headless: true });
  const results  = { url: targetUrl, viewports: {}, timestamp: new Date().toISOString() };

  for (const vpName of vpNames) {
    const vp  = parseVP(vpName);
    const ctx = await browser.newContext({ viewport: vp });
    const pg  = await ctx.newPage();
    await pg.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await pg.waitForTimeout(500);

    const vpRes = { viewport: vp, screenshots: {}, elements: {} };

    await pg.emulateMedia({ colorScheme: 'light' });
    await pg.waitForTimeout(250);
    const lp = path.join(outDir, `${vpName}-light.png`);
    await pg.screenshot({ path: lp, fullPage: true });
    vpRes.screenshots.light = lp;
    for (const sel of selectors)
      vpRes.elements[sel] = { light: await measure(pg, sel) };

    if (!args.noDark) {
      await pg.emulateMedia({ colorScheme: 'dark' });
      await pg.waitForTimeout(250);
      const dp = path.join(outDir, `${vpName}-dark.png`);
      await pg.screenshot({ path: dp, fullPage: true });
      vpRes.screenshots.dark = dp;
      for (const sel of selectors) {
        if (!vpRes.elements[sel]) vpRes.elements[sel] = {};
        vpRes.elements[sel].dark = await measure(pg, sel);
      }
    }

    results.viewports[vpName] = vpRes;
    await ctx.close();
  }

  await browser.close();

  if (args.output) {
    fs.writeFileSync(args.output, JSON.stringify(results, null, 2));
    console.log(`✅ Browser inspection → ${args.output}`);
    for (const [vp, d] of Object.entries(results.viewports)) {
      const s = d.screenshots;
      console.log(`   ${vp}: light=${s.light}${s.dark?' dark='+s.dark:''}`);
    }
  } else {
    process.stdout.write(JSON.stringify(results, null, 2));
  }
})();
