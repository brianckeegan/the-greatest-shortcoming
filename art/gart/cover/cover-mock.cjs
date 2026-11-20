// Type mock for the cover. It sets the title in the site's faces (Josefin Sans display,
// EB Garamond italic for the subtitle's serif break, Archivo for the byline) over the
// gart render, and screenshots it with Playwright at print size (6×9 in + bleed, 300 dpi).
//
//   cd art/gart && ./gradlew render -Ppiece=cover
//   node cover/cover-mock.cjs renders/cover-a-swing.png renders/cover-a-swing-mock.png
//
// Needs network access to Google Fonts. This is a mock for review, not press-ready
// artwork: final type belongs in the designer's layout tool, over the gart master.
const { chromium } = require('playwright');
const fs = require('fs');

const [art, out] = process.argv.slice(2);
const b64 = fs.readFileSync(art).toString('base64');
const W = 1875, H = 2775;
const fonts = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600&family=EB+Garamond:ital,wght@1,400;1,500&family=Josefin+Sans:wght@300;700&display=block">`;

// title block upper-left, in the dark field the art leaves there (its crossing sits low right)
const page = `<style>
 body{margin:0;width:${W}px;height:${H}px;background:#33332D url(data:image/png;base64,${b64}) 0 0/100% 100% no-repeat;position:relative;overflow:hidden;color:#CAC4A2}
 .t{position:absolute;left:150px;top:230px;font-family:'Josefin Sans',sans-serif;font-size:212px;line-height:.9;letter-spacing:-.005em}
 .t .l{font-weight:300;display:block}
 .t .b{font-weight:700;display:block}
 .rule{position:absolute;left:156px;top:700px;width:150px;height:14px;background:#CA4D23}
 .s{position:absolute;left:156px;top:762px;width:1100px;font-family:'EB Garamond',serif;font-style:italic;font-size:84px;line-height:1.12}
 .a{position:absolute;left:158px;top:140px;font-family:'Archivo',sans-serif;font-weight:600;font-size:44px;letter-spacing:.32em;text-transform:uppercase;color:#CA4D23}
</style>
<div class="a">Brian C. Keegan</div>
<div class="t"><span class="l">The Greatest</span><span class="b">Shortcoming</span></div>
<div class="rule"></div>
<div class="s">Quantitative Chauvinism<br>and Lebensraum Imaginaries</div>`;

(async () => {
  // PW_CHROMIUM: optional browser binary, if this Playwright's own download is absent
  const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const pg = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await pg.setContent(`<!doctype html><html><head><meta charset="utf-8">${fonts}</head><body>${page}</body></html>`, { waitUntil: 'networkidle' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.screenshot({ path: out });
  await browser.close();
})();
