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

    const pdBack = document.querySelector('.pd-back');
    if (pdBack) {
        pdBack.addEventListener('click', e => {
            e.preventDefault();
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
            renderProjectDetail(_project);
        } else {
            loadProjectDetail();
        }
    });

    // Ставим флаг перед переходом «← Все проекты»
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

        _projectsData = data;
        _project      = project;
        _categoryName = null;

        renderProjectDetail(project);

        requestAnimationFrame(() => initAnimations());

    } catch (error) {
        console.error('Error loading project:', error);
        showError(I18n.t('pd.error_load'));
    }
}

function renderProjectDetail(project) {
    const category     = _projectsData ? _projectsData.categories.find(c => c.id === project.category) : null;
    const categoryName = category ? projectField(category, 'name') : project.category;

    const title = projectField(project, 'title');
    const desc  = projectField(project, 'description');

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

    // Разделитель: первый абзац description как lead
    const spacer = document.getElementById('pdSpacer');
    if (spacer) {
        const lead  = document.getElementById('pdSpacerLead');
        const sub   = document.getElementById('pdSpacerSub');

        const summary = projectField(project, 'summary') || desc.split('\n\n')[0];
        if (lead)  lead.textContent = summary;
        if (sub)   sub.textContent  = `${project.client} · ${project.year}`;

        spacer.style.display = '';
    }

    // Главная колонка: полное description + итог
    const pdMain = document.getElementById('pdMain');
    if (pdMain) {
        const descParagraphs = desc
            .split('\n\n')
            .map((s) => s.trim())
            .filter(Boolean)
            .map((p) => `<p class="pd-section-text">${p}</p>`)
            .join('');

        const resultText = projectField(project, 'result');
        const resultBlock = resultText ? `
            <div class="pd-section pd-section--result">
                <div class="pd-section-label">${I18n.t('pd.result_title')}</div>
                <div class="pd-section-rule"></div>
                <p class="pd-section-text">${resultText}</p>
            </div>
        ` : '';

        const aboutSection = descParagraphs
            ? `
            <div class="pd-section">
                ${descParagraphs}
            </div>`
            : '';

        pdMain.innerHTML = `${aboutSection}${resultBlock}`;
    }

    // Боковая панель: клиент + год (категория уже показана в hero)
    const pdAside = document.getElementById('pdAside');
    if (pdAside) {
        pdAside.innerHTML = `
            <div class="pd-meta-card">
                <div class="pd-meta-card-label">${I18n.t('pd.details_label')}</div>
                <div class="pd-meta-list">
                    <div class="pd-meta-item">
                        <span class="pd-meta-label">${I18n.t('pd.meta_category')}</span>
                        <span class="pd-meta-value">${categoryName}</span>
                    </div>
                    <div class="pd-meta-item">
                        <span class="pd-meta-label">${I18n.t('pd.meta_client')}</span>
                        <span class="pd-meta-value">${projectField(project, 'client')}</span>
                    </div>
                    <div class="pd-meta-item pd-meta-item--stages">
                        <span class="pd-meta-label">${I18n.t('pd.meta_stages')}</span>
                        <div class="pd-meta-stages" role="group" aria-label="${I18n.t('pd.meta_stages')}">
                            ${[6, 2, 3, 4, 5]
                                .map((n, i) => {
                                    const escAttr = (s) =>
                                        String(s)
                                            .replace(/&/g, '&amp;')
                                            .replace(/"/g, '&quot;');
                                    const escHtml = (s) =>
                                        String(s)
                                            .replace(/&/g, '&amp;')
                                            .replace(/</g, '&lt;')
                                            .replace(/>/g, '&gt;')
                                            .replace(/"/g, '&quot;');
                                    const tip = I18n.t('pd.stage_tip_init');
                                    const altAttr =
                                        i === 0 ? ` alt="${escAttr(tip)}"` : ' alt=""';
                                    const img = `<img class="pd-meta-stage-thumb" src="assets/images/1/stage_icon_read-${String(n).padStart(2, '0')}.svg"${altAttr} decoding="async">`;
                                    if (i === 0) {
                                        return `<span class="pd-meta-stage-wrap pd-meta-stage-wrap--has-tip">${img}<span class="pd-meta-stage-tooltip" role="tooltip">${escHtml(tip)}</span></span>`;
                                    }
                                    return `<span class="pd-meta-stage-wrap">${img}</span>`;
                                })
                                .join('')}
                        </div>
                    </div>
                    <div class="pd-meta-item">
                        <span class="pd-meta-label">${I18n.t('pd.meta_year')}</span>
                        <span class="pd-meta-value">${project.year}</span>
                    </div>
                </div>
                <div class="pd-meta-cta">
                    <p class="pd-meta-cta-text">${I18n.t('pd.cta_text')}</p>
                    <a href="contacts.html?industry=${encodeURIComponent(project.category)}#contact-form-card" class="action-btn action-btn--primary cta-btn">
                        <span class="action-btn-text">${I18n.t('pd.cta_btn')}</span>
                        <span class="action-btn-icon" aria-hidden="true"></span>
                    </a>
                </div>
            </div>
        `;
    }
}

/* ================================================================
   АНИМАЦИИ ПОЯВЛЕНИЯ (scroll-reveal)
   ================================================================ */

function initAnimations() {
    const groups = [];

    // ── Section-spacer ────────────────────────────────────────────
    const spacer = document.getElementById('pdSpacer');
    if (spacer) {
        const lead = spacer.querySelector('.spacer-lead');
        const rule = spacer.querySelector('.spacer-rule');
        const sub  = spacer.querySelector('.spacer-sub');

        if (sub)  sub.classList.add('pd-reveal', 'pd-reveal-up');
        if (rule) rule.classList.add('pd-reveal-scale', 'pd-delay-1');
        if (lead) lead.classList.add('pd-reveal', 'pd-reveal-up', 'pd-delay-3');

        groups.push({ trigger: spacer, elements: [sub, rule, lead] });
    }

    // ── Кнопка «Все проекты» — снизу (триггер: полоса, чтобы на мобилке IO срабатывал надёжно)
    const back = document.querySelector('.pd-back');
    const backBand = document.querySelector('.pd-back-band');
    if (back) {
        back.classList.add('pd-reveal', 'pd-reveal-up');
        groups.push({ trigger: backBand || back, elements: [back] });
    }

    // ── Все секции описания — снизу, поэтапно ────────────────────
    document.querySelectorAll('.pd-section').forEach(pdSection => {
        const secLabel = pdSection.querySelector('.pd-section-label');
        const secRule  = pdSection.querySelector('.pd-section-rule');
        const secTitle = pdSection.querySelector('.pd-section-title');
        const secTexts = [...pdSection.querySelectorAll('.pd-section-text')];
        const textDelayClass = secTitle ? 'pd-delay-4' : 'pd-delay-2';

        if (secLabel) secLabel.classList.add('pd-reveal', 'pd-reveal-up');
        if (secRule)  secRule.classList.add('pd-reveal-scale', 'pd-delay-1');
        if (secTitle) secTitle.classList.add('pd-reveal', 'pd-reveal-up', 'pd-delay-2');
        secTexts.forEach(el => el.classList.add('pd-reveal', 'pd-reveal-up', textDelayClass));

        const allEls = [secLabel, secRule, secTitle, ...secTexts].filter(Boolean);
        groups.push({ trigger: pdSection, elements: allEls });
    });

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
