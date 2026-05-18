// Project Detail Page JavaScript

let _project      = null;
let _categoryName = null;
let _projectsData = null;

// Возвращает поле на текущем языке (аналог хелпера из script.js)
function projectField(obj, field) {
    const lang = (typeof I18n !== 'undefined') ? I18n.lang : 'ru';
    if (lang !== 'ru' && obj[field + '_' + lang] !== undefined) {
        return obj[field + '_' + lang];
    }
    return obj[field] || '';
}

document.addEventListener('DOMContentLoaded', () => {
    if (!document.querySelector('.project-detail-page')) return;

    // Кнопка «Проекты» (pd-back): при клике браузерная кнопка «назад»
    // также сработает корректно, т.к. позиция была сохранена при переходе
    const pdBack = document.querySelector('.pd-back');
    if (pdBack) {
        pdBack.addEventListener('click', e => {
            e.preventDefault();
            // Если пришли с projects.html — идём назад по истории (bfcache)
            // иначе — прямая ссылка на projects.html (sessionStorage уже установлен)
            if (document.referrer.includes('projects.html')) {
                history.back();
            } else {
                window.location.href = pdBack.href;
            }
        });
    }

    // Ждём, пока i18n загрузит переводы, потом рендерим / перерендерим
    document.addEventListener('i18n:ready', () => {
        if (_project) {
            // Смена языка — перерисовываем с теми же данными
            renderProjectDetail(_project);
        } else {
            // Первый запуск
            loadProjectDetail();
        }
    });

    // Ставим флаг перед переходом «← Все проекты»
    // чтобы projects.html знал — анимации не нужны
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href="projects.html"]');
        if (link) {
            try { sessionStorage.setItem('skipAnim_fromDetail', '1'); } catch (_) {}
        }
    });
});

async function loadProjectDetail() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('id');

        if (!projectId) {
            showError(I18n.t('pd.error_not_found'));
            return;
        }

        const response = await fetch('data/projects.json');
        if (!response.ok) throw new Error('Failed to load projects data');

        const data = await response.json();
        const project = data.projects.find(p => p.id === projectId);

        if (!project) {
            showError(I18n.t('pd.error_not_found'));
            return;
        }

        // Сохраняем полные данные для перерисовки при смене языка
        _projectsData = data;
        _project      = project;
        _categoryName = null; // вычисляется динамически в renderProjectDetail

        renderProjectDetail(project);

        // Запускаем анимации после того как браузер применит opacity:0
        requestAnimationFrame(() => initAnimations());

    } catch (error) {
        console.error('Error loading project:', error);
        showError(I18n.t('pd.error_load'));
    }
}

function renderProjectDetail(project) {
    // Вычисляем переведённое название категории
    const category     = _projectsData ? _projectsData.categories.find(c => c.id === project.category) : null;
    const categoryName = category ? projectField(category, 'name') : project.category;

    const title     = projectField(project, 'title');
    const shortDesc = projectField(project, 'shortDescription');
    const desc      = projectField(project, 'description');

    document.title = `${title} — Smartpoint`;

    // Фоновое изображение героя
    const heroBg = document.getElementById('pdHeroBg');
    if (heroBg) {
        const imgSrc = project.image || project.thumbnail;
        heroBg.style.backgroundImage = `url('${imgSrc}')`;
    }

    // Контент поверх героя: категория + заголовок
    const heroContent = document.getElementById('pdHeroContent');
    if (heroContent) {
        heroContent.innerHTML = `
            <div class="pd-hero-category">${categoryName}</div>
            <h1 class="pd-hero-title">${title}</h1>
        `;
    }

    // Разделитель (section-spacer) — показываем и заполняем
    const spacer = document.getElementById('pdSpacer');
    if (spacer) {
        const lead  = document.getElementById('pdSpacerLead');
        const sub   = document.getElementById('pdSpacerSub');
        const label = document.getElementById('pdSpacerLabel');

        if (lead)  lead.textContent  = shortDesc || title;
        if (sub)   sub.textContent   = `${I18n.t('pd.client_label')}: ${project.client} · ${project.year}`;
        if (label) label.innerHTML = categoryName.toUpperCase().replace(' ', '<br>');

        spacer.style.display = '';
    }

    // Главная колонка: описание проекта
    const pdMain = document.getElementById('pdMain');
    if (pdMain) {
        pdMain.innerHTML = `
            <div class="pd-section">
                <div class="pd-section-label">${I18n.t('pd.about_label')}</div>
                <div class="pd-section-rule"></div>
                <h2 class="pd-section-title">${I18n.t('pd.section_title')}</h2>
                <p class="pd-section-text">${desc}</p>
            </div>
        `;
    }

    // Боковая панель: метаданные
    const pdAside = document.getElementById('pdAside');
    if (pdAside) {
        pdAside.innerHTML = `
            <div class="pd-meta-card">
                <div class="pd-meta-card-label">${I18n.t('pd.details_label')}</div>
                <div class="pd-meta-list">
                    <div class="pd-meta-item">
                        <span class="pd-meta-label">${I18n.t('pd.meta_category')}</span>
                        <span class="pd-meta-value pd-meta-value--category">${categoryName}</span>
                    </div>
                    <div class="pd-meta-item">
                        <span class="pd-meta-label">${I18n.t('pd.meta_client')}</span>
                        <span class="pd-meta-value">${project.client}</span>
                    </div>
                    <div class="pd-meta-item">
                        <span class="pd-meta-label">${I18n.t('pd.meta_year')}</span>
                        <span class="pd-meta-value">${project.year}</span>
                    </div>
                </div>
                <div class="pd-meta-cta">
                    <p class="pd-meta-cta-text">${I18n.t('pd.cta_text')}</p>
                    <a href="contacts.html?industry=${encodeURIComponent(project.category)}" class="pd-meta-cta-btn">${I18n.t('pd.cta_btn')}</a>
                </div>
            </div>
        `;
    }
}

/* ================================================================
   АНИМАЦИИ ПОЯВЛЕНИЯ (scroll-reveal)
   ================================================================ */

function initAnimations() {
    const groups = []; // { trigger: Element, elements: Element[] }

    // ── Section-spacer ────────────────────────────────────────────
    const spacer = document.getElementById('pdSpacer');
    if (spacer) {
        const lead  = spacer.querySelector('.spacer-lead');
        const rule  = spacer.querySelector('.spacer-rule');
        const sub   = spacer.querySelector('.spacer-sub');

        if (lead) lead.classList.add('pd-reveal', 'pd-reveal-up');
        if (rule) rule.classList.add('pd-reveal-scale', 'pd-delay-1');
        if (sub)  sub.classList.add('pd-reveal', 'pd-reveal-up', 'pd-delay-3');

        groups.push({ trigger: spacer, elements: [lead, rule, sub] });
    }

    // ── Кнопка «Все проекты» — слева ─────────────────────────────
    const back = document.querySelector('.pd-back');
    if (back) {
        back.classList.add('pd-reveal', 'pd-reveal-left');
        groups.push({ trigger: back, elements: [back] });
    }

    // ── Основная секция — снизу, поэтапно ────────────────────────
    const pdSection = document.querySelector('.pd-section');
    if (pdSection) {
        const secLabel = pdSection.querySelector('.pd-section-label');
        const secRule  = pdSection.querySelector('.pd-section-rule');
        const secTitle = pdSection.querySelector('.pd-section-title');
        const secText  = pdSection.querySelector('.pd-section-text');

        if (secLabel) secLabel.classList.add('pd-reveal', 'pd-reveal-up');
        if (secRule)  secRule.classList.add('pd-reveal-scale', 'pd-delay-1');
        if (secTitle) secTitle.classList.add('pd-reveal', 'pd-reveal-up', 'pd-delay-2');
        if (secText)  secText.classList.add('pd-reveal', 'pd-reveal-up', 'pd-delay-4');

        groups.push({ trigger: pdSection, elements: [secLabel, secRule, secTitle, secText] });
    }

    // ── Meta-карточка — справа (desktop), снизу (mobile) ─────────
    const metaCard = document.querySelector('.pd-meta-card');
    if (metaCard) {
        metaCard.classList.add('pd-reveal', 'pd-reveal-right', 'pd-delay-2');
        groups.push({ trigger: metaCard, elements: [metaCard] });
    }

    setupRevealObserver(groups.filter(g => g.trigger));
}

function setupRevealObserver(groups) {
    if (!groups.length) return;

    // WeakMap: trigger → elements[]
    const map = new WeakMap();
    groups.forEach(({ trigger, elements }) => {
        map.set(trigger, elements.filter(Boolean));
    });

    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const els = map.get(entry.target) || [];
            els.forEach(el => {
                if (el) el.classList.add('is-visible');
            });

            io.unobserve(entry.target);
        });
    }, {
        threshold: 0.08,
        rootMargin: '0px 0px -48px 0px'
    });

    groups.forEach(({ trigger }) => io.observe(trigger));
}

/* ================================================================
   ОШИБКА
   ================================================================ */

function showError(message) {
    const layout = document.querySelector('.pd-layout');
    if (layout) {
        layout.innerHTML = `
            <div class="pd-error">
                <h2>${message}</h2>
                <a href="projects.html" class="pd-error-link">${I18n.t('pd.error_back')}</a>
            </div>
        `;
    }

    const spacer = document.getElementById('pdSpacer');
    if (spacer) spacer.style.display = 'none';
}
