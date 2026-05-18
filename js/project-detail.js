// Project Detail Page JavaScript
document.addEventListener('DOMContentLoaded', () => {
    if (!document.querySelector('.project-detail-page')) return;
    loadProjectDetail();

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
            showError('Проект не найден');
            return;
        }

        const response = await fetch('data/projects.json');
        if (!response.ok) throw new Error('Failed to load projects data');

        const data = await response.json();
        const project = data.projects.find(p => p.id === projectId);

        if (!project) {
            showError('Проект не найден');
            return;
        }

        const category = data.categories.find(c => c.id === project.category);
        const categoryName = category ? category.name : project.category;

        renderProjectDetail(project, categoryName);

        // Запускаем анимации после того как браузер применит opacity:0
        requestAnimationFrame(() => initAnimations());

    } catch (error) {
        console.error('Error loading project:', error);
        showError('Не удалось загрузить информацию о проекте');
    }
}

function renderProjectDetail(project, categoryName) {
    document.title = `${project.title} — Smartpoint`;

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
            <h1 class="pd-hero-title">${project.title}</h1>
        `;
    }

    // Разделитель: первый абзац description + метка категории
    const spacer = document.getElementById('pdSpacer');
    if (spacer) {
        const lead  = document.getElementById('pdSpacerLead');
        const sub   = document.getElementById('pdSpacerSub');
        const label = document.getElementById('pdSpacerLabel');

        const firstParagraph = (project.description || '').split('\n\n')[0];
        if (lead)  lead.textContent  = firstParagraph;
        if (sub)   sub.textContent   = `Клиент: ${project.client} · ${project.year}`;
        if (label) label.textContent = categoryName.toUpperCase();

        spacer.style.display = '';
    }

    // Главная колонка: описание + итог
    const pdMain = document.getElementById('pdMain');
    if (pdMain) {
        // Разбиваем описание на абзацы по двойному переносу
        const descParagraphs = (project.description || '')
            .split('\n\n')
            .filter(Boolean)
            .map(p => `<p class="pd-section-text">${p}</p>`)
            .join('');

        // Блок «Итог проекта» — если поле result заполнено
        const resultBlock = project.result ? `
            <div class="pd-section pd-section--result">
                <div class="pd-section-label">[+ ИТОГ]</div>
                <div class="pd-section-rule"></div>
                <h2 class="pd-section-title">Итог проекта</h2>
                <p class="pd-section-text">${project.result}</p>
            </div>
        ` : '';

        pdMain.innerHTML = `
            <div class="pd-section">
                <div class="pd-section-label">[+ О ПРОЕКТЕ]</div>
                <div class="pd-section-rule"></div>
                <h2 class="pd-section-title">Описание проекта</h2>
                ${descParagraphs}
            </div>
            ${resultBlock}
        `;
    }

    // Боковая панель: метаданные
    const pdAside = document.getElementById('pdAside');
    if (pdAside) {
        pdAside.innerHTML = `
            <div class="pd-meta-card">
                <div class="pd-meta-card-label">[+ ДЕТАЛИ]</div>
                <div class="pd-meta-list">
                    <div class="pd-meta-item">
                        <span class="pd-meta-label">Клиент</span>
                        <span class="pd-meta-value">${project.client}</span>
                    </div>
                    <div class="pd-meta-item">
                        <span class="pd-meta-label">Год реализации</span>
                        <span class="pd-meta-value">${project.year}</span>
                    </div>
                </div>
                <div class="pd-meta-cta">
                    <p class="pd-meta-cta-text">Заинтересованы в подобном решении для вашего бизнеса?</p>
                    <a href="mailto:info@smartpoint.kz" class="pd-meta-cta-btn">Обсудить проект →</a>
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
        const lead = spacer.querySelector('.spacer-lead');
        const rule = spacer.querySelector('.spacer-rule');
        const sub  = spacer.querySelector('.spacer-sub');

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

    // ── Все секции описания — снизу, поэтапно ────────────────────
    document.querySelectorAll('.pd-section').forEach(pdSection => {
        const secLabel = pdSection.querySelector('.pd-section-label');
        const secRule  = pdSection.querySelector('.pd-section-rule');
        const secTitle = pdSection.querySelector('.pd-section-title');
        const secTexts = [...pdSection.querySelectorAll('.pd-section-text')];

        if (secLabel) secLabel.classList.add('pd-reveal', 'pd-reveal-up');
        if (secRule)  secRule.classList.add('pd-reveal-scale', 'pd-delay-1');
        if (secTitle) secTitle.classList.add('pd-reveal', 'pd-reveal-up', 'pd-delay-2');
        secTexts.forEach(el => el.classList.add('pd-reveal', 'pd-reveal-up', 'pd-delay-4'));

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
                <a href="projects.html" class="pd-error-link">← Вернуться к проектам</a>
            </div>
        `;
    }

    const spacer = document.getElementById('pdSpacer');
    if (spacer) spacer.style.display = 'none';
}
