const I18n = (() => {
    const STORAGE_KEY = 'sp-lang';
    const SUPPORTED   = ['ru', 'en', 'kk'];
    const DEFAULT     = 'ru';

    let translations = {};
    let currentLang  = (() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return SUPPORTED.includes(stored) ? stored : DEFAULT;
    })();

    function t(key) {
        return translations[key] ?? key;
    }

    async function load(lang) {
        const res = await fetch(`locales/${lang}.json`);
        if (!res.ok) throw new Error(`i18n: failed to load ${lang}.json`);
        translations = await res.json();
        currentLang  = lang;
    }

    function applyToDOM() {
        // Текстовое содержимое
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const v = translations[el.dataset.i18n];
            if (v !== undefined) el.textContent = v;
        });

        // HTML-содержимое (элементы с <br> и HTML-сущностями)
        document.querySelectorAll('[data-i18n-html]').forEach(el => {
            const v = translations[el.dataset.i18nHtml];
            if (v !== undefined) el.innerHTML = v;
        });

        // Атрибуты: aria-label, placeholder и т.д.
        // Формат: data-i18n-attr="attr1:key1;attr2:key2"
        document.querySelectorAll('[data-i18n-attr]').forEach(el => {
            el.dataset.i18nAttr.split(';').forEach(pair => {
                const i = pair.indexOf(':');
                if (i === -1) return;
                const v = translations[pair.slice(i + 1).trim()];
                if (v !== undefined) el.setAttribute(pair.slice(0, i).trim(), v);
            });
        });

        // Заголовок страницы
        if (translations['page.title']) document.title = translations['page.title'];

        // Атрибут lang на <html>
        document.documentElement.lang = currentLang;

        // Синхронизация кнопок переключателя
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('is-active', btn.dataset.lang === currentLang);
        });

        // Сообщаем остальным скриптам что перевод применён
        document.dispatchEvent(new CustomEvent('i18n:ready', { detail: { lang: currentLang } }));
    }

    async function setLang(lang) {
        if (!SUPPORTED.includes(lang)) return;
        try {
            await load(lang);
            localStorage.setItem(STORAGE_KEY, currentLang);
            applyToDOM();
        } catch (e) {
            console.warn('i18n: could not switch to', lang, e);
        }
    }

    async function init() {
        try {
            await load(currentLang);
        } catch {
            if (currentLang !== DEFAULT) {
                currentLang = DEFAULT;
                await load(DEFAULT);
            }
        }
        applyToDOM();

        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => setLang(btn.dataset.lang));
        });
    }

    document.addEventListener('DOMContentLoaded', init);

    return { t, setLang, get lang() { return currentLang; } };
})();
