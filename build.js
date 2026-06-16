/**
 * build.js — Static multilingual site generator
 * Usage: node build.js
 * Output: dist/ with 18 HTML files (6 pages × 3 languages)
 */

const fs   = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const SITE_URL   = 'https://smartpoint.kz';
const LANGUAGES  = ['ru', 'en', 'kk'];
const DEFAULT_LANG = 'ru';

// Per-page meta (title + description per language)
// Falls back to locales `page.title` if not listed here
const PAGE_META = {
  'index.html': {
    ru: { title: 'Smartpoint — Инженерный консалтинг',       desc: 'Комплексные инженерные и консалтинговые решения для промышленных и технологических компаний.' },
    en: { title: 'Smartpoint — Engineering Consulting',      desc: 'Comprehensive engineering and consulting solutions for industrial and technology companies.' },
    kk: { title: 'Smartpoint — Инжиниринг Консалтинг',      desc: 'Өнеркәсіптік және технологиялық компанияларға арналған инжиниринг және консалтинг шешімдері.' },
  },
  'projects.html': {
    ru: { title: 'Smartpoint — Проекты',         desc: 'Портфолио реализованных проектов в области цифровизации, инфраструктуры и промышленности.' },
    en: { title: 'Smartpoint — Projects',         desc: 'Portfolio of completed projects in digitalization, infrastructure, and industrial sectors.' },
    kk: { title: 'Smartpoint — Жобалар',          desc: 'Цифрландыру, инфрақұрылым және өнеркәсіп салаларындағы аяқталған жобалар портфолиосы.' },
  },
  'services.html': {
    ru: { title: 'Smartpoint — Услуги',          desc: 'Инженерный консалтинг, управление проектами, трансфер технологий и цифровая трансформация.' },
    en: { title: 'Smartpoint — Services',         desc: 'Engineering consulting, project management, technology transfer and digital transformation.' },
    kk: { title: 'Smartpoint — Қызметтер',        desc: 'Инжиниринг консалтингі, жобаларды басқару, технологияларды трансфер және цифрлық трансформация.' },
  },
  'career.html': {
    ru: { title: 'Smartpoint — Карьера',         desc: 'Присоединяйтесь к команде профессионалов. Открытые вакансии и возможности для роста.' },
    en: { title: 'Smartpoint — Career',           desc: 'Join our team of professionals. Open positions and growth opportunities.' },
    kk: { title: 'Smartpoint — Мансап',           desc: 'Кәсіпқойлар командасына қосылыңыз. Ашық вакансиялар мен өсу мүмкіндіктері.' },
  },
  'contacts.html': {
    ru: { title: 'Smartpoint — Контакты',        desc: 'Свяжитесь с нами. Алматы, Казахстан. Обсудим ваш проект.' },
    en: { title: 'Smartpoint — Contacts',         desc: 'Get in touch with us. Almaty, Kazakhstan. Let\'s discuss your project.' },
    kk: { title: 'Smartpoint — Байланыс',         desc: 'Бізбен байланысыңыз. Алматы, Қазақстан. Жобаңызды талқылайық.' },
  },
  'project-detail.html': {
    ru: { title: 'Smartpoint — Детали проекта',  desc: 'Подробное описание реализованного проекта компании Smartpoint.' },
    en: { title: 'Smartpoint — Project Details',  desc: 'Detailed description of a completed Smartpoint project.' },
    kk: { title: 'Smartpoint — Жоба мәліметтері',desc: 'Smartpoint аяқталған жобасының толық сипаттамасы.' },
  },
};

// URL for a given page+lang (RU lives at root)
function pageUrl(page, lang) {
  if (lang === DEFAULT_LANG) return `${SITE_URL}/${page}`;
  return `${SITE_URL}/${lang}/${page}`;
}

// Relative path prefix from a lang subfolder back to root assets
function rootPrefix(lang) {
  return lang === DEFAULT_LANG ? '' : '../';
}

// Load all locale files
const locales = {};
for (const lang of LANGUAGES) {
  locales[lang] = JSON.parse(fs.readFileSync(`locales/${lang}.json`, 'utf8'));
}

// Resolve a nested dot-key from locale
function t(lang, key) {
  return locales[lang][key] ?? '';
}

const TEMPLATES_DIR = 'templates';
const DIST_DIR      = 'dist';

// Collect template files
const pages = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.html'));

let totalFiles = 0;

for (const page of pages) {
  const src = fs.readFileSync(path.join(TEMPLATES_DIR, page), 'utf8');

  for (const lang of LANGUAGES) {
    const $ = cheerio.load(src, { decodeEntities: false });

    // --- 1. html[lang] ---
    $('html').attr('lang', lang);

    // --- 2. Remove anti-FOUC inline script (not needed for static) ---
    $('head script').first().remove();

    // --- 3. <title> ---
    const meta = PAGE_META[page]?.[lang];
    if (meta) {
      $('title').text(meta.title);
    }

    // --- 4. <meta name="description"> (add if missing) ---
    if (meta?.desc) {
      if ($('meta[name="description"]').length) {
        $('meta[name="description"]').attr('content', meta.desc);
      } else {
        $('title').after(`\n    <meta name="description" content="${meta.desc}">`);
      }
    }

    // --- 5. hreflang alternate links ---
    // Remove existing alternates (idempotent rebuild)
    $('link[rel="alternate"]').remove();
    $('link[rel="canonical"]').remove();

    const hreflangHtml = LANGUAGES.map(l =>
      `\n    <link rel="alternate" hreflang="${l}" href="${pageUrl(page, l)}">`
    ).join('') +
    `\n    <link rel="alternate" hreflang="x-default" href="${pageUrl(page, DEFAULT_LANG)}">` +
    `\n    <link rel="canonical" href="${pageUrl(page, lang)}">`;

    $('title').after(hreflangHtml);

    // --- 6. Fix relative asset paths for lang subfolders ---
    const prefix = rootPrefix(lang);
    if (prefix) {
      // CSS and JS links
      $('link[href^="css/"]').each((_, el) => {
        $(el).attr('href', prefix + $(el).attr('href'));
      });
      $('script[src]').each((_, el) => {
        const s = $(el).attr('src');
        if (!s.startsWith('http') && !s.startsWith('//')) {
          $(el).attr('src', prefix + s);
        }
      });
      // img src
      $('img[src]').each((_, el) => {
        const s = $(el).attr('src');
        if (!s.startsWith('http') && !s.startsWith('//') && !s.startsWith('data:')) {
          $(el).attr('src', prefix + s);
        }
      });
      // a[href] for internal pages
      $('a[href]').each((_, el) => {
        const h = $(el).attr('href');
        if (h && h.endsWith('.html') && !h.startsWith('http') && !h.startsWith('#') && !h.includes('/')) {
          $(el).attr('href', prefix + h);
        }
      });
    }

    // --- 7. Apply translations: data-i18n → textContent ---
    $('[data-i18n]').each((_, el) => {
      const key = $(el).attr('data-i18n');
      const val = t(lang, key);
      if (val) $(el).text(val);
      $(el).removeAttr('data-i18n');
    });

    // --- 8. data-i18n-html → innerHTML ---
    $('[data-i18n-html]').each((_, el) => {
      const key = $(el).attr('data-i18n-html');
      const val = t(lang, key);
      if (val) $(el).html(val);
      $(el).removeAttr('data-i18n-html');
    });

    // --- 9. data-i18n-attr → attributes ---
    $('[data-i18n-attr]').each((_, el) => {
      const pairs = $(el).attr('data-i18n-attr').split(';');
      for (const pair of pairs) {
        const [attr, key] = pair.split(':');
        const val = t(lang, key.trim());
        if (val) $(el).attr(attr.trim(), val);
      }
      $(el).removeAttr('data-i18n-attr');
    });

    // --- 10. Language switcher buttons → links ---
    $('.lang-switcher').each((_, switcher) => {
      const btns = $(switcher).find('[data-lang]');
      const links = btns.map((_, btn) => {
        const l = $(btn).attr('data-lang');
        let href;
        if (l === DEFAULT_LANG)  href = `${prefix}${page}`;   // → root
        else if (l === lang)     href = page;                  // current page
        else if (prefix)         href = `../${l}/${page}`;    // sibling lang from subfolder
        else                     href = `${l}/${page}`;       // from root to lang subfolder
        const isActive = l === lang ? ' class="lang-btn is-active"' : ' class="lang-btn"';
        return `<a href="${href}"${isActive}>${$(btn).text()}</a>`;
      }).get().join('\n                    ');
      $(switcher).html('\n                    ' + links + '\n                ');
    });

    // --- 11. i18n.js script tag → remove (no longer needed) ---
    $('script[src*="i18n"]').remove();

    // --- 12. Write output ---
    const outDir = lang === DEFAULT_LANG ? DIST_DIR : path.join(DIST_DIR, lang);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, page), $.html(), 'utf8');
    totalFiles++;
    console.log(`  ✓ ${lang}/${page}`);
  }
}

console.log(`\nDone: ${totalFiles} files generated in ${DIST_DIR}/`);
