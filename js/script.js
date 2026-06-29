document.addEventListener('DOMContentLoaded', () => {

    // ── Флаг анимаций — вычисляем первым, до любого hero-кода ──────
    const _navEntry = performance.getEntriesByType('navigation')[0];
    const _navType  = _navEntry ? _navEntry.type : '';
    const _isBackForward = _navType === 'back_forward';
    let _cameFromDetail = false;
    try {
        _cameFromDetail = sessionStorage.getItem('skipAnim_fromDetail') === '1';
        if (_cameFromDetail) sessionStorage.removeItem('skipAnim_fromDetail');
    } catch (_) {}
    // true  → анимации  |  false → мгновенный показ
    const _shouldAnim = !_isBackForward && !_cameFromDetail;

    // ── Hero верхние секции ─────────────────────────────────────────
    // hero-services: hero-animated добавляем только если играем анимации
    const heroServices = document.querySelector('.hero.hero-services');
    if (heroServices) {
        if (_shouldAnim) heroServices.classList.add('hero-animated');
    }

    // hero-home уже имеет hero-animated в HTML;
    // при мгновенном показе гасим анимацию через hero-restored
    const heroHome = document.querySelector('.hero.hero-home');
    if (heroHome && !_shouldAnim) {
        heroHome.classList.add('hero-restored');
    }

    // Hero section logic handled above

    // ── Подсветка текущей страницы в футере ──────────────────────
    (function () {
        const page = location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.footer-nav a').forEach(a => {
            const href = a.getAttribute('href').split('?')[0];
            if (href === page || (page === '' && href === 'index.html')) {
                a.classList.add('is-current');
            }
        });
    })();

    const header = document.querySelector('.main-header');
    const links = document.querySelectorAll('.main-nav a');
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    const menuOverlay = document.querySelector('.menu-overlay');

    function closeMenu() {
        if (mobileMenuToggle) mobileMenuToggle.classList.remove('active');
        if (mainNav) mainNav.classList.remove('is-open');
        if (menuOverlay) menuOverlay.classList.remove('is-active');
        lockScroll(false);
    }

    /** true, если ссылка ведёт на текущий HTML-файл (не срабатывать как переход) */
    function isSamePageNavLink(anchor) {
        const hrefRaw = (anchor && anchor.getAttribute('href')) || '';
        if (/^mailto:|^tel:|^javascript:/i.test(hrefRaw.trim())) return false;
        const href = hrefRaw.split('#')[0].split('?')[0];
        const page = (location.pathname.split('/').pop() || 'index.html').split('?')[0];
        return href === page || (page === '' && href === 'index.html');
    }

    function lockScroll(lock) {
        document.documentElement.style.overflow = lock ? 'hidden' : '';
        document.body.style.overflow = lock ? 'hidden' : '';
        document.body.classList.toggle('menu-open', lock);
    }

    document.querySelectorAll('.footer-nav a').forEach((a) => {
        a.addEventListener('click', (e) => {
            if (isSamePageNavLink(a)) e.preventDefault();
        });
    });

    document.addEventListener('touchmove', (e) => {
        if (mainNav && mainNav.classList.contains('is-open') && !mainNav.contains(e.target)) {
            e.preventDefault();
        }
    }, { passive: false });

    // Mobile menu toggle — сначала оверлей (затемнение + blur), затем меню сбоку
    if (mobileMenuToggle && mainNav) {
        mobileMenuToggle.addEventListener('click', () => {
            const isOpen = mainNav.classList.toggle('is-open');
            mobileMenuToggle.classList.toggle('active', isOpen);
            if (menuOverlay) menuOverlay.classList.toggle('is-active', isOpen);
            lockScroll(isOpen);
        });

        // Закрыть меню; переход отменяем только если href — тот же HTML, что и в адресной строке
        // (на project-detail.html пункт «Проекты» → projects.html должен открываться).
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                if (isSamePageNavLink(link)) e.preventDefault();
                closeMenu();
            });
        });
    }

    // Оборачиваем символы после применения переводов,
    // чтобы анимация работала с уже переведённым текстом
    document.addEventListener('i18n:ready', () => {
        links.forEach((link) => {
            const text = link.textContent.trim() || '';
            link.textContent = '';
            Array.from(text).forEach((char, index) => {
                const span = document.createElement('span');
                span.textContent = char === ' ' ? '\u00A0' : char;
                span.style.transitionDelay = `${index * 40}ms`;
                link.appendChild(span);
            });
        });
    }, { once: true });

    if (header) {
        let lastScrollY = window.scrollY;
        const threshold = 10;
        const headerHeight = header.offsetHeight || 80;

        const updateScrollState = () => {
            const current = window.scrollY;
            if (current > headerHeight) {
                header.classList.add('is-scrolled');
                links.forEach((link) => {
                    Array.from(link.querySelectorAll('span')).forEach((span) => {
                        span.style.transitionDelay = '0ms';
                    });
                });
            } else {
                header.classList.remove('is-scrolled');
                links.forEach((link) => {
                    Array.from(link.querySelectorAll('span')).forEach((span) => {
                        span.style.transitionDelay = '0ms';
                    });
                });
            }
        };

        updateScrollState();

        window.addEventListener('scroll', () => {
            const current = window.scrollY;
            const diff = current - lastScrollY;

            updateScrollState();

            if (current <= 0) {
                header.classList.remove('is-hidden');
            } else if (diff > threshold) {
                header.classList.add('is-hidden');
            } else if (diff < -threshold) {
                header.classList.remove('is-hidden');
            }

            lastScrollY = current;
        }, { passive: true });
    }

    const cards = document.querySelectorAll('.logo-card, .smart-card, .smart-content-item, .stage-img-mobile');
    if (cards.length > 0) {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });

        cards.forEach((card) => observer.observe(card));
    }

    /*
     * Система анимаций при скролле:
     * - Анимации играют при первом заходе и при переходе через меню
     * - Мгновенный показ (без анимаций):
     *     • кнопка «Назад» браузера (back_forward)
     *     • кнопка «← Все проекты» на странице project-detail.html
     */

    // Используем флаг, вычисленный в самом начале DOMContentLoaded
    // (до этого места sessionStorage уже был прочитан и очищен)
    const shouldPlayScrollAnimations = _shouldAnim;

    // Мгновенный показ при !shouldPlayScrollAnimations — вызываем после
    // определения функции showScrollSectionsWithoutAnim (ниже по коду)
    // через requestAnimationFrame чтобы DOM успел построиться
    if (!shouldPlayScrollAnimations) {
        requestAnimationFrame(() => showScrollSectionsWithoutAnim());
    }

    /**
     * Функция для мгновенного показа всех анимируемых элементов без анимации
     */
    function showScrollSectionsWithoutAnim() {
        // Hero верхних секций — мгновенный показ
        document.querySelectorAll('.hero.hero-home').forEach(el => el.classList.add('hero-restored'));
        const hs = document.querySelector('.hero.hero-services');
        if (hs) {
            hs.classList.remove('hero-animated');
            hs.querySelectorAll('.hero-title, .hero-label, .hero-desc, .hero-buttons, .title-lines span, .hero-bg')
              .forEach(el => { el.style.transition = 'none'; el.style.animation = 'none'; el.style.opacity = '1'; el.style.transform = 'none'; });
            requestAnimationFrame(() => {
                hs.querySelectorAll('.hero-title, .hero-label, .hero-desc, .hero-buttons, .title-lines span, .hero-bg')
                  .forEach(el => { el.style.transition = ''; el.style.animation = ''; });
            });
        }


        // Показываем элементы секции about-intro
        const aboutIntro = document.querySelector('.section-intro');
        if (aboutIntro) {
            const aboutEls = aboutIntro.querySelectorAll(
                '.intro-title, .intro-desc, .intro-photo-wrap, .intro-badge-mirror'
            );
            aboutEls.forEach((el) => {
                el.style.transition = 'none';
                el.classList.add('intro-in-view');
            });
            requestAnimationFrame(() => {
                aboutEls.forEach((el) => { el.style.transition = ''; });
            });
        }

        // Показываем элементы секции services2-below
        const companyContainer = document.querySelector('.company-container');
        if (companyContainer) {
            const sel = '.company-label, .company-title, .company-image-wrap, .company-subtitle, .company-text-block .company-text, .company-signature-img, .company-stats .stat-item';
            const elements = companyContainer.querySelectorAll(sel);

            elements.forEach((el) => {
                el.style.transition = 'none';
                el.classList.add('company-in-view');
            });

            requestAnimationFrame(() => {
                elements.forEach((el) => el.style.transition = '');
            });
        }

        // Статистика — финальные значения без анимации
        document.querySelectorAll('.stat-number[data-end]').forEach((el) => {
            const end = parseInt(el.getAttribute('data-end'), 10);
            const suffix = el.getAttribute('data-suffix') || '';
            el.textContent = end + suffix;
        });

        // Показываем секцию clients-marquee
        const clientsMarquee = document.querySelector('.section-clients-marquee');
        const clientsDividerEl = document.querySelector('.clients-divider');
        const clientsTrackWrap = document.querySelector('.clients-track-wrap');
        if (clientsMarquee) {
            clientsMarquee.style.transition = 'none';
            clientsDividerEl && (clientsDividerEl.style.transition = 'none');
            clientsTrackWrap && (clientsTrackWrap.style.transition = 'none');
            clientsMarquee.classList.add('clients-marquee-in-view');
            clientsDividerEl?.classList.add('clients-divider-in-view');
            requestAnimationFrame(() => {
                clientsMarquee.style.transition = '';
                clientsDividerEl && (clientsDividerEl.style.transition = '');
                clientsTrackWrap && (clientsTrackWrap.style.transition = '');
            });
        }

        // Показываем элементы секции design6
        const d6 = document.querySelector('.section-advantages');
        if (d6) {
            const elements = d6.querySelectorAll('.advantages-divider, .advantages-heading, .advantage-cards .advantage-card, .advantages-image');

            elements.forEach((el) => {
                el.style.transition = 'none';
                el.classList.add('advantages-in-view');
                if (el.classList.contains('advantage-card')) {
                    el.classList.add('advantages-animation-done');
                }
            });

            requestAnimationFrame(() => {
                elements.forEach((el) => el.style.transition = '');
            });
        }

        // Показываем секцию CTA
        const ctaContainer = document.querySelector('.section-cta .cta-container');
        if (ctaContainer) {
            ctaContainer.style.transition = 'none';
            ctaContainer.classList.add('cta-animated');
            requestAnimationFrame(() => {
                ctaContainer.style.transition = '';
            });
        }

        // Показываем элементы services page без анимации
        const srvSelectors = [
            '.spacer-lead', '.spacer-rule', '.spacer-sub', '.spacer-side-label',
            '.strategy-intro .company-label', '.strategy-heading', '.strategy-intro-bold', '.strategy-intro-text', '.strategy-card-wrap', '.smart-card',
            '.section-smart-cards .smart-cards-label',
            '.industries-heading', '.industry-card',
            '.stages-experience-title', '.stages-experience-text', '.stages-side-label', '.stage-card-wrap',
            '.approach-label', '.approach-title', '.approach-text', '.approach-cta',
            '.cw-heading', '.cw-circle-wrap', '.cw-item'
        ];
        srvSelectors.forEach((sel) => {
            document.querySelectorAll(sel).forEach((el) => {
                el.style.transition = 'none';
                el.classList.add('srv-in-view');
            });
        });
        const stagesMediaEl = document.querySelector('.stages-media');
        if (stagesMediaEl) {
            stagesMediaEl.style.transition = 'none';
            stagesMediaEl.classList.add('stages-media-in-view');
            requestAnimationFrame(() => { stagesMediaEl.style.transition = ''; });
        }
        requestAnimationFrame(() => {
            srvSelectors.forEach((sel) => {
                document.querySelectorAll(sel).forEach((el) => {
                    el.style.transition = '';
                });
            });
        });

        // Контакты и карьера — форма/фото
        const contactCareerSelectors = ['.contact-info-left', '.contact-form-card', '.career-apply-content', '.career-apply-photo'];
        contactCareerSelectors.forEach((sel) => {
            document.querySelectorAll(sel).forEach((el) => {
                el.style.transition = 'none';
                el.classList.add('contact-in-view');
            });
        });
        requestAnimationFrame(() => {
            contactCareerSelectors.forEach((sel) => {
                document.querySelectorAll(sel).forEach((el) => {
                    el.style.transition = '';
                });
            });
        });
    }

    /**
     * Обработка события pageshow - срабатывает при восстановлении страницы из bfcache
     * (например, при нажатии кнопки "Назад" в некоторых браузерах)
     */
    window.addEventListener('pageshow', function (e) {
        if (e.persisted) {
            showScrollSectionsWithoutAnim();
            // Hero: при восстановлении из bfcache показываем контент сразу, без повторной анимации
            const heroHome = document.querySelector('.hero.hero-home');
            if (heroHome) {
                heroHome.classList.add('hero-restored');
            }
        }
    });

    // ========== Анимация секции services2-below ==========
    const sectionServices2Below = document.querySelector('.section-company');
    const companyContainer = document.querySelector('.company-container');

    if (sectionServices2Below && companyContainer) {
        const animatedElements = companyContainer.querySelectorAll(
            '.company-label, .company-title, .company-image-wrap, .company-subtitle, .company-text-block .company-text, .company-signature-img, .company-stats .stat-item'
        );


        if (shouldPlayScrollAnimations) {
            // threshold: 0.05 — триггер при 5% видимости элемента, без задержек
            const companyObserver = new IntersectionObserver((entries, obs) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('company-in-view');
                        obs.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.05, rootMargin: '0px 0px 0px 0px' });

            animatedElements.forEach((el) => companyObserver.observe(el));
        } else {
            // Сразу показываем все элементы БЕЗ анимации
            const allAnimated = companyContainer.querySelectorAll(
                '.company-label, .company-title, .company-image-wrap, .company-subtitle, .company-text-block .company-text, .company-signature-img, .company-stats .stat-item'
            );
            allAnimated.forEach((el) => {
                el.style.transition = 'none';
                el.classList.add('company-in-view');
            });

            requestAnimationFrame(() => {
                allAnimated.forEach((el) => {
                    el.style.transition = '';
                });
            });
        }
    }

    // ========== Анимация секции CTA ==========
    const ctaContainer = document.querySelector('.section-cta .cta-container');
    if (ctaContainer) {
        if (shouldPlayScrollAnimations) {
            const isMobile = window.innerWidth <= 568;
            const ctaRootMargin = isMobile ? '0px 0px 60% 0px' : '0px 0px 18% 0px';
            const ctaObserver = new IntersectionObserver((entries, obs) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('cta-animated');
                        obs.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.05,
                rootMargin: ctaRootMargin
            });
            ctaObserver.observe(ctaContainer);
        } else {
            ctaContainer.style.transition = 'none';
            ctaContainer.classList.add('cta-animated');
            requestAnimationFrame(() => {
                ctaContainer.style.transition = '';
            });
        }
    }

    // ========== Анимация счёта статистики (20, 30+) ==========
    const statsContainer = document.querySelector('.company-stats');
    const statNumbers = document.querySelectorAll('.stat-number[data-end]');

    function animateStatNumber(el, end, suffix, duration) {
        const start = 1;
        const startTime = performance.now();
        suffix = suffix || '';

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(1, elapsed / duration);
            const current = Math.floor(start + (end - start) * progress);
            el.textContent = current + suffix;
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                el.textContent = end + suffix;
            }
        }
        el.textContent = start + suffix;
        requestAnimationFrame(update);
    }

    function setStatsToFinal() {
        statNumbers.forEach((el) => {
            const end = parseInt(el.getAttribute('data-end'), 10);
            const suffix = el.getAttribute('data-suffix') || '';
            el.textContent = end + suffix;
        });
    }

    if (statsContainer && statNumbers.length > 0) {
        if (shouldPlayScrollAnimations) {
            // rootMargin '0px' — счётчик стартует строго при 5% видимости, синхронно с fade-in
            const statsObserver = new IntersectionObserver((entries, obs) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        obs.unobserve(entry.target);
                        statNumbers.forEach((el) => {
                            const end = parseInt(el.getAttribute('data-end'), 10);
                            const suffix = el.getAttribute('data-suffix') || '';
                            animateStatNumber(el, end, suffix, 1000);
                        });
                    }
                });
            }, { threshold: 0.05, rootMargin: '0px 0px 0px 0px' });
            statsObserver.observe(statsContainer);
        } else {
            setStatsToFinal();
        }
    }


    // ========== Анимация секции about-intro ==========
    const sectionAboutIntro = document.querySelector('.section-intro');

    if (sectionAboutIntro) {
        const aboutAnimatedEls = sectionAboutIntro.querySelectorAll(
            '.intro-title, .intro-desc, .intro-photo-wrap, .intro-badge-mirror'
        );

        if (shouldPlayScrollAnimations) {
            const aboutObserver = new IntersectionObserver((entries, obs) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('intro-in-view');
                        obs.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.05,
                rootMargin: window.innerWidth <= 568 ? '0px 0px -8% 0px' : '0px 0px 12% 0px'
            });

            aboutAnimatedEls.forEach((el) => aboutObserver.observe(el));
        } else {
            aboutAnimatedEls.forEach((el) => {
                el.style.transition = 'none';
                el.classList.add('intro-in-view');
            });
            requestAnimationFrame(() => {
                aboutAnimatedEls.forEach((el) => { el.style.transition = ''; });
            });
        }
    }

    // ========== Анимация секции design6 ==========
    const sectionD6 = document.querySelector('.section-advantages');

    if (sectionD6) {
        const d6Animated = sectionD6.querySelectorAll('.advantages-divider');
        const advantagesHeading = sectionD6.querySelector('.advantages-heading');
        const advantagesImage = sectionD6.querySelector('.advantages-image');
        const advantageCards = sectionD6.querySelectorAll('.advantage-cards .advantage-card');

        if (shouldPlayScrollAnimations) {
            // Progressive disclosure: карточки — триггер при 50% видимости каждой
            advantageCards.forEach((card) => {
                const cardObserver = new IntersectionObserver((entries, obs) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            const el = entry.target;
                            el.classList.add('advantages-in-view');
                            obs.unobserve(el);
                            el.addEventListener('transitionend', function onDone(e) {
                                if (e.propertyName === 'transform' || e.propertyName === 'opacity') {
                                    el.classList.add('advantages-animation-done');
                                    el.removeEventListener('transitionend', onDone);
                                }
                            });
                        }
                    });
                }, { threshold: 0.5 });
                cardObserver.observe(card);
            });

            // Progressive disclosure: заголовок — триггер при 50% видимости
            if (advantagesHeading) {
                const headingObserver = new IntersectionObserver((entries, obs) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('advantages-in-view');
                            obs.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.5 });
                headingObserver.observe(advantagesHeading);
            }

            // Progressive disclosure: картинка — триггер при 50% видимости
            if (advantagesImage) {
                const imageObserver = new IntersectionObserver((entries, obs) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('advantages-in-view');
                            obs.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.5 });
                imageObserver.observe(advantagesImage);
            }

            // Остальные элементы секции
            const d6Observer = new IntersectionObserver((entries, obs) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('advantages-in-view');
                        obs.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.05,
                rootMargin: '0px 0px 18% 0px'
            });

            d6Animated.forEach((el) => d6Observer.observe(el));
        } else {
            // Сразу показываем все элементы БЕЗ анимации
            d6Animated.forEach((el) => {
                el.style.transition = 'none';
                el.classList.add('advantages-in-view');
            });
            advantageCards.forEach((el) => {
                el.style.transition = 'none';
                el.classList.add('advantages-in-view', 'advantages-animation-done');
            });
            if (advantagesHeading) {
                advantagesHeading.style.transition = 'none';
                advantagesHeading.classList.add('advantages-in-view');
            }
            if (advantagesImage) {
                advantagesImage.style.transition = 'none';
                advantagesImage.classList.add('advantages-in-view');
            }
            requestAnimationFrame(() => {
                d6Animated.forEach((el) => { el.style.transition = ''; });
                advantageCards.forEach((el) => { el.style.transition = ''; });
                advantagesHeading && (advantagesHeading.style.transition = '');
                advantagesImage && (advantagesImage.style.transition = '');
            });
        }
    }

    // ========== Анимация секции clients-marquee (триггер — clients-divider, 50% видимости) ==========
    const sectionClientsMarquee = document.querySelector('.section-clients-marquee');
    const clientsDivider = document.querySelector('.clients-divider');

    if (sectionClientsMarquee && clientsDivider) {
        if (shouldPlayScrollAnimations) {
            const dividerObserver = new IntersectionObserver((entries, obs) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('clients-divider-in-view');
                        sectionClientsMarquee.classList.add('clients-marquee-in-view');
                        obs.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });
            dividerObserver.observe(clientsDivider);
        } else {
            sectionClientsMarquee.style.transition = 'none';
            sectionClientsMarquee.classList.add('clients-marquee-in-view');
            clientsDivider.classList.add('clients-divider-in-view');
            requestAnimationFrame(() => {
                sectionClientsMarquee.style.transition = '';
            });
        }
    }

    // ========== SERVICES PAGE — Scroll-in animations ==========

    // section-spacer: наблюдаем всю секцию (надёжнее, чем мелкие элементы)
    const sectionSpacer = document.querySelector('.section-spacer');
    if (sectionSpacer) {
        const spacerEls = sectionSpacer.querySelectorAll('.spacer-lead, .spacer-rule, .spacer-sub, .spacer-side-label');
        const addSrvInView = () => spacerEls.forEach((el) => el.classList.add('srv-in-view'));

        if (shouldPlayScrollAnimations) {
            const spacerObserver = new IntersectionObserver((entries, obs) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        addSrvInView();
                        obs.unobserve(entry.target);
                    }
                });
            }, { threshold: 0, rootMargin: '50px 0px 50px 0px' });
            spacerObserver.observe(sectionSpacer);
            // На случай если секция уже в зоне видимости при загрузке
            requestAnimationFrame(() => {
                const rect = sectionSpacer.getBoundingClientRect();
                if (rect.top < window.innerHeight + 50) addSrvInView();
            });
        } else {
            spacerEls.forEach((el) => {
                el.style.transition = 'none';
                el.classList.add('srv-in-view');
            });
            requestAnimationFrame(() => spacerEls.forEach((el) => { el.style.transition = ''; }));
        }
    }

    if (shouldPlayScrollAnimations) {
        const isMobileSrv = window.innerWidth <= 568;
        const srvRootMargin = isMobileSrv ? '0px 0px 60% 0px' : '0px 0px 8% 0px';

        const makeSrvObserver = () => new IntersectionObserver((entries, obs) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('srv-in-view');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.05, rootMargin: srvRootMargin });

        // остальные элементы services (strategy, industries и т.д.) — spacer уже обработан выше

        // section-strategy и section-smart-cards — intro (каждый блок при 50% видимости)
        const strategyIntroOpts = { threshold: 0.5, rootMargin: srvRootMargin };
        const strategyIntroEls = document.querySelectorAll('.strategy-intro .company-label, .strategy-heading, .strategy-intro-bold, .strategy-intro-text, .section-smart-cards .smart-cards-label');
        const smartSideLabel = document.querySelector('.section-smart-cards .smart-side-label');
        if (strategyIntroEls.length || smartSideLabel) {
            const strategyIntroObs = new IntersectionObserver((entries, obs) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('srv-in-view');
                        obs.unobserve(entry.target);
                    }
                });
            }, strategyIntroOpts);
            strategyIntroEls.forEach((el) => strategyIntroObs.observe(el));
            if (smartSideLabel) strategyIntroObs.observe(smartSideLabel);
        }

        // section-strategy — cards (staggered one-by-one)
        const strategyCards = document.querySelectorAll('.strategy-card-wrap');
        if (strategyCards.length) {
            const strategyTrigger = strategyCards[0].closest('.strategy-cards') || strategyCards[0].parentElement;
            let strategyFired = false;
            const strategyObs = new IntersectionObserver((entries, obs) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !strategyFired) {
                        strategyFired = true;
                        obs.unobserve(entry.target);
                        strategyCards.forEach((card, i) => {
                            setTimeout(() => card.classList.add('srv-in-view'), i * 200);
                        });
                    }
                });
            }, { threshold: 0.05, rootMargin: srvRootMargin });
            strategyObs.observe(strategyTrigger);
        }

        // section-industries — заголовок при 50%; карточки: >1024 поочерёдно по сетке, ≤1024 каждая при своей видимости
        const industriesSection = document.querySelector('.section-industries');
        if (industriesSection) {
            const industriesOpts = { threshold: 0.5, rootMargin: srvRootMargin };
            const industriesHeading = industriesSection.querySelector('.industries-heading');
            const industriesGrid = industriesSection.querySelector('.industries-grid');
            const industryCards = industriesSection.querySelectorAll('.industry-card');
            if (industriesHeading) {
                const industriesHeadingObs = new IntersectionObserver((entries, obs) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('srv-in-view');
                            obs.unobserve(entry.target);
                        }
                    });
                }, industriesOpts);
                industriesHeadingObs.observe(industriesHeading);
            }
            const industriesWide = window.innerWidth > 1024;
            if (industryCards.length) {
                if (industriesWide && industriesGrid) {
                    let industriesFired = false;
                    const industriesCardsObs = new IntersectionObserver((entries, obs) => {
                        entries.forEach((entry) => {
                            if (entry.isIntersecting && !industriesFired) {
                                industriesFired = true;
                                obs.unobserve(entry.target);
                                industryCards.forEach((card, i) => {
                                    setTimeout(() => card.classList.add('srv-in-view'), i * 120);
                                });
                            }
                        });
                    }, industriesOpts);
                    industriesCardsObs.observe(industriesGrid);
                } else {
                    const industriesCardsObs = new IntersectionObserver((entries, obs) => {
                        entries.forEach((entry) => {
                            if (entry.isIntersecting) {
                                entry.target.classList.add('srv-in-view');
                                obs.unobserve(entry.target);
                            }
                        });
                    }, industriesOpts);
                    industryCards.forEach((card) => industriesCardsObs.observe(card));
                }
            }
        }

        // section-smart-cards — карточки (триггер при 50% видимости; intro = strategy-intro, наблюдаем выше)
        const smartCardsSection = document.querySelector('.section-smart-cards');
        if (smartCardsSection) {
            const smartCardsOpts = { threshold: 0.5, rootMargin: srvRootMargin };
            // Карточки SMART — выше 1024: поочерёдный старт по сетке; ≤1024: каждая при своей видимости
            const smartCardsGrid = smartCardsSection.querySelector('.smart-cards-grid');
            const smartCards = smartCardsSection.querySelectorAll('.smart-card');
            const isWide = window.innerWidth > 1024;
            if (smartCards.length) {
                if (window.innerWidth <= 1024) {
                    // Мобайл/планшет: карусель управляет видимостью, observer не нужен — сразу показываем
                    smartCards.forEach((card) => {
                        card.style.transition = 'none';
                        card.classList.add('srv-in-view');
                        requestAnimationFrame(() => { card.style.transition = ''; });
                    });
                } else if (isWide) {
                    // Десктоп: каждая карточка появляется когда 50% её видно на экране
                    const smartCardsObs = new IntersectionObserver((entries, obs) => {
                        entries.forEach((entry) => {
                            if (entry.isIntersecting) {
                                entry.target.classList.add('srv-in-view');
                                obs.unobserve(entry.target);
                            }
                        });
                    }, { threshold: 0.5 });
                    smartCards.forEach((card) => smartCardsObs.observe(card));
                } else {
                    const smartCardsObs = new IntersectionObserver((entries, obs) => {
                        entries.forEach((entry) => {
                            if (entry.isIntersecting) {
                                entry.target.classList.add('srv-in-view');
                                obs.unobserve(entry.target);
                            }
                        });
                    }, smartCardsOpts);
                    smartCards.forEach((card) => smartCardsObs.observe(card));
                }
            }
        }

        // stages header (staggered) — триггер при ~15% видимости (раньше 50% — элемент успевает появиться до полной прокрутки)
        const stagesHeaderEls = document.querySelectorAll('.stages-experience-title, .stages-experience-text, .stages-side-label');
        if (stagesHeaderEls.length) {
            const stagesHeaderObs = new IntersectionObserver((entries, obs) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('srv-in-view');
                        obs.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.15, rootMargin: '0px 0px 0px 0px' });
            stagesHeaderEls.forEach((el, i) => {
                stagesHeaderObs.observe(el);
            });
        }

        // section-stages — cards: каждая карточка анимируется при входе в viewport
        const stageCardWraps = document.querySelectorAll('.stage-card-wrap');
        if (stageCardWraps.length) {
            const stagesCardsObs = new IntersectionObserver((entries, obs) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('srv-in-view');
                        obs.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.01, rootMargin: '0px 0px 0px 0px' });
            stageCardWraps.forEach((card) => stagesCardsObs.observe(card));
        }

        // stages-media — вылет сбоку
        const stagesMedia = document.querySelector('.stages-media');
        if (stagesMedia) {
            const stagesMediaObs = new IntersectionObserver((entries, obs) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('stages-media-in-view');
                        obs.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.05, rootMargin: srvRootMargin });
            stagesMediaObs.observe(stagesMedia);
        }

        // section-approach
        const individualEls = document.querySelectorAll('.approach-label, .approach-title, .approach-text, .approach-cta');
        if (individualEls.length) {
            const obs = makeSrvObserver();
            individualEls.forEach((el) => obs.observe(el));
        }

    }

    // career-why-section (career.html) — scroll-reveal для орбитального блока
    const careerSection = document.querySelector('.career-why-section');
    if (careerSection && careerSection.querySelector('.cw-orbit')) {
        const careerShiftYOpts    = { threshold: 0, rootMargin: '0px 0px 260px 0px' };
        const careerHeadingOpts   = { threshold: 0, rootMargin: '0px 0px 0px 160px' };
        const careerOrbitItemOpts = { threshold: 0.05, rootMargin: '0px 0px 0px 0px' };
        const isCareerOrbitWide   = window.innerWidth >= 1025;

        const careerHeading    = careerSection.querySelector('.cw-heading');
        const careerItems      = careerSection.querySelectorAll('.cw-item');
        const careerCircleWrap = careerSection.querySelector('.cw-circle-wrap');

        const attachObs = (el, opts) => {
            if (!el) return;
            const obs = new IntersectionObserver((entries, o) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('srv-in-view');
                        o.unobserve(entry.target);
                    }
                });
            }, opts);
            obs.observe(el);
        };

        attachObs(careerHeading,    careerHeadingOpts);
        attachObs(careerCircleWrap, { threshold: 0.01, rootMargin: '0px 0px 260px 0px' });

        const careerTabletItemOpts = { threshold: 0.5, rootMargin: '0px' };
        const isTablet = !isCareerOrbitWide && window.innerWidth > 568;
        const itemOpts = isCareerOrbitWide ? careerOrbitItemOpts
                       : isTablet          ? careerTabletItemOpts
                       :                     careerShiftYOpts;
        careerItems.forEach((el) => attachObs(el, itemOpts));
    }

    // career.html — позиционирование карточек на окружности (568–1024px)
    function positionCwItemsOnCircle() {
        const section = document.querySelector('.career-why-section');
        if (!section) return;

        const iw         = window.innerWidth;
        const orbGroup   = section.querySelector('.cw-orbital-group');
        const circleWrap = section.querySelector('.cw-circle-wrap');
        const items      = [...section.querySelectorAll('.cw-item')];

        if (!orbGroup || !circleWrap || !items.length) return;

        if (iw <= 568 || iw > 1024) {
            items.forEach(item => {
                item.style.cssText = '';
                const textEl = item.querySelector('.cw-text');
                if (textEl) textEl.style.cssText = '';
            });
            orbGroup.style.height = '';
            return;
        }

        const r    = circleWrap.offsetWidth / 2;
        const orbW = orbGroup.offsetWidth;
        const cx   = 0;
        const cy   = circleWrap.offsetTop + r;

        const iconSz   = 54;
        const iconHalf = iconSz / 2;
        const gap      = 12;
        const angleDeg = [-68, -30, 5, 35, 70];

        items.forEach((item, i) => {
            const rad  = angleDeg[i] * Math.PI / 180;
            const px   = cx + r * Math.cos(rad);
            const py   = cy + r * Math.sin(rad);
            const itemLeft = px - iconHalf;
            const itemW    = orbW - itemLeft - 16;
            const textMaxW = orbW - (px + iconHalf + gap) - 16;

            item.style.position  = 'absolute';
            item.style.left      = itemLeft + 'px';
            item.style.top       = py + 'px';
            item.style.transform = 'translateY(-50%)';
            item.style.margin    = '0';
            item.style.width     = itemW + 'px';

            const textEl = item.querySelector('.cw-text');
            if (textEl) textEl.style.maxWidth = Math.max(textMaxW, 120) + 'px';
        });

        requestAnimationFrame(() => {
            let maxBottom = cy + r + 24;
            items.forEach(item => {
                const itemBottom = parseFloat(item.style.top) + item.offsetHeight / 2;
                if (itemBottom > maxBottom) maxBottom = itemBottom;
            });
            orbGroup.style.height = (maxBottom + 24) + 'px';
        });
    }

    positionCwItemsOnCircle();

    let _cwResizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(_cwResizeTimer);
        _cwResizeTimer = setTimeout(positionCwItemsOnCircle, 80);
    }, { passive: true });

    const stagesMedia = document.querySelector('.stages-media');
    const stagesImages = stagesMedia ? Array.from(stagesMedia.querySelectorAll('.stages-image')) : [];
    const stageCards = Array.from(document.querySelectorAll('.stage-card-wrap'));

    if (stagesMedia && stagesImages.length > 0) {
        const setActiveStageImage = (index) => {
            const safeIndex = Math.min(index, stagesImages.length - 1);
            stagesImages.forEach((img, idx) => {
                img.classList.toggle('is-active', idx === safeIndex);
            });
        };

        const updateStagesSticky = () => {
            const mediaWidth = stagesMedia.getBoundingClientRect().width;
            if (!mediaWidth) return;

            const heights = stagesImages.map((img) => {
                if (img.naturalWidth > 0) {
                    return (img.naturalHeight / img.naturalWidth) * mediaWidth;
                }
                return img.getBoundingClientRect().height;
            }).filter((height) => height > 0);

            if (heights.length === 0) return;

            const maxHeight = Math.max(...heights);
            stagesMedia.style.setProperty('--stages-media-half', `${Math.round(maxHeight / 2)}px`);
            stagesMedia.style.setProperty('--stages-media-height', `${Math.round(maxHeight)}px`);
        };


        const bindImageLoad = (img) => {
            if (img.complete) {
                updateStagesSticky();
            } else {
                img.addEventListener('load', updateStagesSticky);
            }
        };

        stagesImages.forEach((img) => bindImageLoad(img));
        window.addEventListener('resize', updateStagesSticky, { passive: true });
        setActiveStageImage(0);

        if (stageCards.length > 0) {
            let rafId = null;
            const firstImage = stagesImages[0];
            const headerRight = document.querySelector('.stages-header-right');

            // Pre-calculate natural document-relative centers for each card target.
            // These are measured once (and on resize) so sticky positioning does NOT
            // affect them — getBoundingClientRect() on a stuck card returns the stuck
            // viewport position, not the real scroll position.
            let cardDocCenters = [];
            const measureCardDocCenters = () => {
                // Temporarily lift sticky so getBoundingClientRect reflects true document position
                stageCards.forEach(c => { c.style.position = 'relative'; });
                cardDocCenters = stageCards.map((card, index) => {
                    let target = card;
                    const list = card.querySelector('.stage-list');
                    if (list) target = list;
                    const rect = target.getBoundingClientRect();
                    // Последняя карточка: точка перехода выше (10% от верха), чтобы смена 4→5 была раньше
                    const frac = (index === stageCards.length - 1) ? 0.1 : 0.5;
                    return rect.top + window.scrollY + rect.height * frac;
                });
                stageCards.forEach(c => { c.style.position = ''; });
            };
            measureCardDocCenters();
            window.addEventListener('resize', measureCardDocCenters, { passive: true });
            const stagesHeaderRow = document.querySelector('.stages-header-row');
            const sideLabel = document.querySelector('.stages-section .stages-side-label');
            const stagesSection = document.querySelector('.stages-section');
            const HEADER_HEIGHT = parseInt(
                getComputedStyle(document.documentElement).getPropertyValue('--header-height')
            ) || 52;
            let lastScrollY = window.scrollY;

            // Смещаем sticky-элементы вниз под меню когда секция у верха экрана и скроллим вверх
            const mainHeader = document.querySelector('.main-header');
            const setStickyTop = (el, value) => { if (el) el.style.top = value; };
            // Широкий десктоп ≥1280px: двухколоночный заголовок выше — увеличенный отступ
            const CARD_TOP_WIDE = [140, 160, 180, 200, 220];
            const CARD_TOP_WIDE_UNDER_HEADER = [220, 240, 260, 280, 300];
            // Узкий десктоп 1025–1279px
            const CARD_TOP_NORMAL = [100, 120, 140, 160, 180];
            const CARD_TOP_UNDER_HEADER = [180, 200, 220, 240, 260];
            // Планшет и мобильный — малые значения совпадают с CSS (.stage-card:nth-child)
            const CARD_TOP_TABLET_NORMAL = [16, 36, 56, 76, 96];
            const CARD_TOP_TABLET_UNDER_HEADER = [96, 116, 136, 156, 176];
            const setStageCardsTop = (underHeader) => {
                const isTabletOrMobile = window.innerWidth <= 1024;
                const isWideDesktop = window.innerWidth >= 1280;
                const tops = isTabletOrMobile
                    ? (underHeader ? CARD_TOP_TABLET_UNDER_HEADER : CARD_TOP_TABLET_NORMAL)
                    : isWideDesktop
                        ? (underHeader ? CARD_TOP_WIDE_UNDER_HEADER : CARD_TOP_WIDE)
                        : (underHeader ? CARD_TOP_UNDER_HEADER : CARD_TOP_NORMAL);
                stageCards.forEach((card, i) => {
                    card.style.top = (tops[i] ?? tops[tops.length - 1]) + 'px';
                });
            };
            const updateHeaderRightTop = () => {
                if (!stagesSection) return;
                const isTabletOrMobile = window.innerWidth <= 1024;
                const sectionTop = stagesSection.getBoundingClientRect().top;
                const scrollingUp = window.scrollY < lastScrollY;
                lastScrollY = window.scrollY;
                const headerHidden = mainHeader && mainHeader.classList.contains('is-hidden');

                // На планшете/мобильном заголовки static — не управляем их top
                if (isTabletOrMobile) {
                    setStageCardsTop(false);
                    return;
                }

                if (headerHidden) {
                    // Хедер уехал вверх — возвращаем на исходное место
                    setStickyTop(headerRight, '20px');
                    setStickyTop(stagesHeaderRow, '20px');
                    setStickyTop(sideLabel, '20px');
                    setStageCardsTop(false);
                } else if (sectionTop <= HEADER_HEIGHT && scrollingUp) {
                    // Секция у верха и скроллим вверх — опускаем под хедер
                    setStickyTop(headerRight, (HEADER_HEIGHT + 20) + 'px');
                    setStickyTop(stagesHeaderRow, (HEADER_HEIGHT + 20) + 'px');
                    setStickyTop(sideLabel, (HEADER_HEIGHT + 20) + 'px');
                    setStageCardsTop(true);
                } else if (sectionTop > HEADER_HEIGHT) {
                    // Секция ещё не у верха — обычный отступ
                    setStickyTop(headerRight, '20px');
                    setStickyTop(stagesHeaderRow, '20px');
                    setStickyTop(sideLabel, '20px');
                    setStageCardsTop(false);
                }
            };

            window.addEventListener('scroll', updateHeaderRightTop, { passive: true });
            updateHeaderRightTop();

            const updateActiveByScroll = () => {
                const viewportCenter = window.innerHeight / 2;
                const scrollCenter = window.scrollY + viewportCenter;
                // Смещение вниз: переключаем изображение раньше, чтобы к моменту
                // когда карточка в центре экрана, анимация смены уже завершилась.
                const IMAGE_SWITCH_OFFSET = 180;
                const effectiveScrollCenter = scrollCenter + IMAGE_SWITCH_OFFSET;

                // Image switching: use natural document positions so sticky cards
                // don't confuse the "which card is in view" calculation.
                let closestIndex = 0;
                let closestDistance = Infinity;
                cardDocCenters.forEach((docCenter, index) => {
                    const distance = Math.abs(docCenter - effectiveScrollCenter);
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestIndex = index;
                    }
                });

                setActiveStageImage(closestIndex);

                // Скрываем sticky-текст и заголовок когда картинка (.stages-media) наезжает на них
                // Только на десктопе — на планшете/мобильном layout одноколонный и логика неприменима
                if (headerRight && stagesMedia && window.innerWidth > 1024) {
                    const textRect = headerRight.getBoundingClientRect();
                    const mediaRect = stagesMedia.getBoundingClientRect();
                    if (mediaRect.top < textRect.bottom + 20) {
                        headerRight.classList.add('stages-header-right--hidden');
                        if (stagesHeaderRow) stagesHeaderRow.classList.add('stages-header-row--hidden');
                    } else {
                        headerRight.classList.remove('stages-header-right--hidden');
                        if (stagesHeaderRow) stagesHeaderRow.classList.remove('stages-header-row--hidden');
                    }
                } else if (headerRight && window.innerWidth <= 1024) {
                    // На планшете/мобильном — всегда показываем
                    headerRight.classList.remove('stages-header-right--hidden');
                    if (stagesHeaderRow) stagesHeaderRow.classList.remove('stages-header-row--hidden');
                }

                // Virtual viewport positions for rotation animations:
                // cardDocCenter - scrollY gives exactly what getBoundingClientRect().top + height/2
                // would return for a NON-sticky card — unaffected by sticky clamping.
                const stagePositions = cardDocCenters.map(dc => dc - window.scrollY);
                const IMAGE_ANIM_EARLY_OFFSET = 140;
                const IMAGE1_ANIM_EARLY_OFFSET = 700;

                if (firstImage && stagePositions.length > 1) {
                    const transitionStart = stagePositions[0] - IMAGE1_ANIM_EARLY_OFFSET;
                    const transitionEnd = stagePositions[1];

                    if (viewportCenter >= transitionStart && viewportCenter <= transitionEnd) {
                        const progress = Math.min(1, Math.max(0, (viewportCenter - transitionStart) / (transitionEnd - transitionStart)));
                        const rotation = progress * -30;
                        firstImage.style.transform = `rotate(${rotation}deg)`;
                    } else if (viewportCenter < transitionStart) {
                        firstImage.style.transform = 'rotate(0deg)';
                    } else {
                        firstImage.style.transform = 'rotate(-30deg)';
                    }
                }

                // Анимация поворота второго изображения - начинается раньше
                if (stagesImages.length > 1 && stagePositions.length > 2) {
                    const secondImage = stagesImages[1];
                    const appearanceStart = stagePositions[0] - IMAGE_ANIM_EARLY_OFFSET;
                    const appearanceEnd = stagePositions[1]; // Полное появление
                    const disappearanceStart = stagePositions[1]; // Начало исчезновения
                    const disappearanceEnd = stagePositions[2]; // Полное исчезновение

                    if (viewportCenter >= appearanceStart && viewportCenter <= disappearanceEnd) {
                        let progress;
                        if (viewportCenter <= appearanceEnd) {
                            // Фаза появления - поворот от 0 до -30
                            progress = Math.min(1, Math.max(0, (viewportCenter - appearanceStart) / (appearanceEnd - appearanceStart)));
                            const rotation = -30 * progress;
                            secondImage.style.transform = `rotate(${rotation}deg)`;
                        } else {
                            // Фаза исчезновения - поворот от -30 до -50
                            progress = Math.min(1, Math.max(0, (viewportCenter - disappearanceStart) / (disappearanceEnd - disappearanceStart)));
                            const rotation = -30 + (progress * -20);
                            secondImage.style.transform = `rotate(${rotation}deg)`;
                        }
                    } else if (viewportCenter < appearanceStart) {
                        secondImage.style.transform = 'rotate(0deg)';
                    } else {
                        secondImage.style.transform = 'rotate(-50deg)';
                    }
                }

                // Анимация поворота третьего изображения - начало -25 (уменьшен)
                if (stagesImages.length > 2 && stagePositions.length > 3) {
                    const thirdImage = stagesImages[2];
                    const appearanceStart = stagePositions[1] - IMAGE_ANIM_EARLY_OFFSET;
                    const disappearanceEnd = stagePositions[3];

                    if (viewportCenter >= appearanceStart && viewportCenter <= disappearanceEnd) {
                        const progress = Math.min(1, Math.max(0, (viewportCenter - appearanceStart) / (disappearanceEnd - appearanceStart)));
                        const rotation = -25 + (progress * -35); // От -25 до -60 градусов
                        thirdImage.style.transform = `rotate(${rotation}deg)`;
                    } else if (viewportCenter < appearanceStart) {
                        thirdImage.style.transform = 'rotate(-25deg)';
                    } else {
                        thirdImage.style.transform = 'rotate(-60deg)';
                    }
                }

                // Анимация поворота четвертого изображения - начинается раньше
                if (stagesImages.length > 3 && stagePositions.length > 4) {
                    const fourthImage = stagesImages[3];
                    const appearanceStart = stagePositions[2] - IMAGE_ANIM_EARLY_OFFSET;
                    const disappearanceEnd = stagePositions[4]; // Полное исчезновение

                    if (viewportCenter >= appearanceStart && viewportCenter <= disappearanceEnd) {
                        // Поворот от -60 до -90 градусов с момента начала появления до полного исчезновения
                        // Начинается с -60 для плавного перехода от третьего изображения
                        const progress = Math.min(1, Math.max(0, (viewportCenter - appearanceStart) / (disappearanceEnd - appearanceStart)));
                        const rotation = -60 + (progress * -30); // От -60 до -90 градусов
                        fourthImage.style.transform = `rotate(${rotation}deg)`;
                    } else if (viewportCenter < appearanceStart) {
                        fourthImage.style.transform = 'rotate(-60deg)';
                    } else {
                        fourthImage.style.transform = 'rotate(-90deg)';
                    }
                }

                // Анимация поворота пятого изображения - начинается раньше
                if (stagesImages.length > 4 && stagePositions.length > 4) {
                    const fifthImage = stagesImages[4];
                    const appearanceStart = stagePositions[3] - IMAGE_ANIM_EARLY_OFFSET;
                    const appearanceEnd = stagePositions[4]; // Полное появление
                    // Поворот завершается раньше — на 55% пути между 4 и 5 карточкой
                    const rotationEnd = appearanceStart + (appearanceEnd - appearanceStart) * 0.55;

                    if (viewportCenter >= appearanceStart) {
                        // Поворот справа налево (по часовой стрелке) от -75 до -90 градусов
                        if (viewportCenter <= rotationEnd) {
                            const progress = Math.min(1, Math.max(0, (viewportCenter - appearanceStart) / (rotationEnd - appearanceStart)));
                            const rotation = -75 + (progress * -15); // От -75 до -90 градусов
                            fifthImage.style.transform = `rotate(${rotation}deg)`;
                        } else {
                            // После завершения поворота остается на -90 градусах
                            fifthImage.style.transform = 'rotate(-90deg)';
                        }
                    } else {
                        fifthImage.style.transform = 'rotate(-75deg)';
                    }
                }

                rafId = null;
            };

            const onScroll = () => {
                if (rafId) return;
                rafId = window.requestAnimationFrame(updateActiveByScroll);
            };

            window.addEventListener('scroll', onScroll, { passive: true });
            window.addEventListener('resize', onScroll, { passive: true });
            onScroll();
        }

    }

    // ========== PORTFOLIO FUNCTIONALITY ==========

    // Portfolio state
    let portfolioData = null;
    let selectedCategories = new Set();

    // Возвращает поле проекта/категории на текущем языке
    function projectField(obj, field) {
        const lang = (typeof I18n !== 'undefined') ? I18n.lang : 'ru';
        if (lang !== 'ru' && obj[field + '_' + lang] !== undefined) {
            return obj[field + '_' + lang];
        }
        return obj[field] || '';
    }

    /** Первый календарный год из project.year (диапазон «2007–2008» / «2007-2008» или одно число) */
    function projectStartYear(project) {
        const y = project && project.year != null ? String(project.year).trim() : '';
        if (!y) return 0;
        const m = y.match(/\d{4}/);
        return m ? parseInt(m[0], 10) : 0;
    }

    // Initialize portfolio if on projects page
    const portfolioSection = document.querySelector('.portfolio-section');
    if (portfolioSection) {
        // Отключаем автовосстановление скролла браузером — управляем сами
        if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

        // Кнопка «назад» браузера: bfcache — страница восстановлена из кеша
        window.addEventListener('pageshow', e => {
            if (e.persisted) {
                const saved = sessionStorage.getItem('sp-projects-scroll');
                if (saved !== null) {
                    sessionStorage.removeItem('sp-projects-scroll');
                    requestAnimationFrame(() => {
                        window.scrollTo({ top: parseInt(saved, 10), behavior: 'instant' });
                    });
                }
            }
        });

        initPortfolio();
        // При смене языка — перерисовываем фильтры и карточки
        document.addEventListener('i18n:ready', () => {
            if (portfolioData) {
                renderCategoryFilters();
                renderProjects();
            }
        });
    }

    async function initPortfolio() {
        try {
            // Load projects data
            const response = await fetch('/data/projects.json');
            if (!response.ok) {
                throw new Error('Failed to load projects data');
            }
            portfolioData = await response.json();
            if (Array.isArray(portfolioData.projects)) {
                portfolioData.projects.sort((a, b) => {
                    const yearDiff = projectStartYear(b) - projectStartYear(a);
                    if (yearDiff !== 0) return yearDiff;
                    const categoryA = projectField(a, 'category');
                    const categoryB = projectField(b, 'category');
                    return categoryA.localeCompare(categoryB);
                });
            }

            // Render filters and projects
            renderCategoryFilters();
            renderProjects();

            // Восстанавливаем позицию прокрутки при возврате со страницы проекта
            const savedScroll = sessionStorage.getItem('sp-projects-scroll');
            if (savedScroll !== null) {
                sessionStorage.removeItem('sp-projects-scroll');
                // requestAnimationFrame гарантирует, что layout уже рассчитан
                requestAnimationFrame(() => {
                    window.scrollTo({ top: parseInt(savedScroll, 10), behavior: 'instant' });
                });
            }
        } catch (error) {
            console.error('Error loading portfolio:', error);
            const grid = document.getElementById('projectsGrid');
            if (grid) {
                const msg = (typeof I18n !== 'undefined') ? I18n.t('projects.error_load') : 'Не удалось загрузить проекты. Пожалуйста, попробуйте позже.';
                grid.innerHTML = `<p style="text-align: center; color: rgba(77, 76, 76, 0.6);">${msg}</p>`;
            }
        }
    }

    function renderCategoryFilters() {
        const filtersContainer = document.getElementById('categoryFilters');
        if (!filtersContainer || !portfolioData) return;

        // Сохраняем активную категорию
        const activeBtn = filtersContainer.querySelector('.filter-btn.active');
        const activeCatId = activeBtn ? activeBtn.dataset.categoryId : 'all';

        filtersContainer.innerHTML = '';

        // Add "All" button
        const allLabel = (typeof I18n !== 'undefined') ? I18n.t('projects.filter_all') : 'Все';
        const allButton = createFilterButton('all', allLabel, activeCatId === 'all');
        filtersContainer.appendChild(allButton);

        // Add category buttons
        portfolioData.categories.forEach(category => {
            const name = projectField(category, 'name');
            const button = createFilterButton(category.id, name, activeCatId === category.id);
            filtersContainer.appendChild(button);
        });
    }

    function createFilterButton(id, name, isActive) {
        const button = document.createElement('button');
        button.className = 'filter-btn' + (isActive ? ' active' : '');
        button.textContent = name;
        button.dataset.categoryId = id;

        button.addEventListener('click', () => {
            handleFilterClick(button, id);
        });

        return button;
    }

    function handleFilterClick(button, categoryId) {
        // Only one category can be active at a time
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        button.classList.add('active');

        if (categoryId === 'all') {
            selectedCategories.clear();
        } else {
            selectedCategories.clear();
            selectedCategories.add(categoryId);
        }

        filterProjects();
    }

    function renderProjects() {
        const grid = document.getElementById('projectsGrid');
        if (!grid || !portfolioData) return;

        grid.innerHTML = '';

        portfolioData.projects.forEach((project, index) => {
            const card = createProjectCard(project, index);
            grid.appendChild(card);
        });

        // Восстанавливаем фильтрацию после перерисовки
        if (selectedCategories.size > 0) filterProjects();
        else updateFeaturedCard();
    }

    function createProjectCard(project, index) {
        const card = document.createElement('a');
        card.className = 'project-card';
        const _langPfx = (typeof I18n !== 'undefined' && I18n.lang !== 'ru') ? `/${I18n.lang}` : '';
        card.href = `${_langPfx}/project-detail.html?id=${project.id}`;
        card.dataset.category = project.category;
        card.style.animationDelay = `${index * 0.08}s`;

        // Сохраняем позицию прокрутки перед переходом на детальную страницу
        card.addEventListener('click', () => {
            sessionStorage.setItem('sp-projects-scroll', String(window.scrollY));
        });

        // Get category name in current language
        const category = portfolioData.categories.find(c => c.id === project.category);
        const categoryName = category ? projectField(category, 'name') : project.category;

        const title       = projectField(project, 'title');
        const shortDesc   = projectField(project, 'summary') || projectField(project, 'description').split('\n\n')[0];
        const moreLabel   = (typeof I18n !== 'undefined') ? I18n.t('projects.card_more') : 'Подробнее';

        card.innerHTML = `
            <div class="project-card-image">
                <div class="project-card-image-placeholder"><span>${title.charAt(0)}</span></div>
                <img src="${project.thumbnail.startsWith('/') ? project.thumbnail : '/' + project.thumbnail}" alt="${title}"
                     onload="this.style.opacity='1'"
                     onerror="this.remove()"
                     style="opacity:0;transition:opacity 0.4s ease, transform 1s cubic-bezier(0.33, 1, 0.68, 1)">
            </div>
            <div class="project-card-content">
                <div class="project-card-top">
                    <span class="project-card-label">[+ ${categoryName.toUpperCase()}]</span>
                    <span class="project-card-year">${project.year}</span>
                </div>
                <h3 class="project-card-title">${title}</h3>
                <p class="project-card-description">${shortDesc}</p>
                <div class="project-card-footer">
                    <span class="project-card-arrow">${moreLabel}</span>
                </div>
            </div>
        `;

        return card;
    }

    function filterProjects() {
        const cards = document.querySelectorAll('.project-card');

        cards.forEach(card => {
            const cardCategory = card.dataset.category;

            if (selectedCategories.size === 0 || selectedCategories.has(cardCategory)) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });

        updateFeaturedCard();
    }

    function updateFeaturedCard() {
        const cards = document.querySelectorAll('.project-card');
        let assigned = false;
        cards.forEach(card => {
            card.classList.remove('featured');
            if (!assigned && !card.classList.contains('hidden')) {
                card.classList.add('featured');
                assigned = true;
            }
        });
    }

    // ========== Clients marquee: drag-to-scroll + auto-scroll ==========
    const clientsTrackWrap = document.querySelector('.clients-track-wrap');
    const clientsTrack = document.querySelector('.clients-track');

    if (clientsTrackWrap && clientsTrack) {
        let position = 0;
        let lastTime = performance.now();
        let rafId = null;
        let isDragging = false;
        let dragStartX = 0;
        let dragStartPosition = 0;

        const getHalfWidth = () => clientsTrack.offsetWidth / 2;
        const speed = 28; // секунд на один цикл (как в оригинальной анимации)

        function applyTransform() {
            const half = getHalfWidth();
            while (position > 0) position -= half;
            while (position < -half) position += half;
            clientsTrack.style.transform = `translateX(${position}px)`;
        }

        function autoScroll(now) {
            if (!isDragging) {
                const delta = (now - lastTime) / 1000;
                const half = getHalfWidth();
                position -= (half / speed) * delta;
                applyTransform();
            }
            lastTime = now;
            rafId = requestAnimationFrame(autoScroll);
        }

        clientsTrackWrap.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            isDragging = true;
            dragStartX = e.clientX;
            dragStartPosition = position;
            clientsTrackWrap.classList.add('is-dragging');
        });

        const onMouseMove = (e) => {
            if (!isDragging) return;
            position = dragStartPosition + (e.clientX - dragStartX);
            applyTransform();
        };

        const onMouseUp = () => {
            if (!isDragging) return;
            isDragging = false;
            clientsTrackWrap.classList.remove('is-dragging');
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        document.addEventListener('mouseleave', onMouseUp);

        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            rafId = requestAnimationFrame(autoScroll);
        } else {
            applyTransform();
        }
    }

    // ── contacts page: slide-in animations ──
    const contactAnimEls = document.querySelectorAll('.contact-info-left, .contact-form-card');
    if (contactAnimEls.length) {
        const contactObserver = new IntersectionObserver((entries, obs) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('contact-in-view');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
        contactAnimEls.forEach((el) => contactObserver.observe(el));

        /* Переход с project-detail (кнопка CTA): якорь #contact-form-card */
        if (location.hash === '#contact-form-card') {
            const anchorEl = document.getElementById('contact-form-card');
            if (anchorEl) {
                const scrollToForm = () => anchorEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                requestAnimationFrame(() => requestAnimationFrame(scrollToForm));
            }
        }
    }

    // ── career page: slide-in анимация контента (слева) и фото (справа) ──
    const careerApplyEls = document.querySelectorAll('.career-apply-content, .career-apply-photo');
    if (careerApplyEls.length) {
        const careerApplyObserver = new IntersectionObserver((entries, obs) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('contact-in-view');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
        careerApplyEls.forEach((el) => careerApplyObserver.observe(el));
    }

    // ── Форма отправки резюме → Forminit SDK ──
    const careerForm   = document.getElementById('career-apply-form');
    const cfSubmit     = document.getElementById('cf-submit');
    const cfSubmitText = document.getElementById('cf-submit-text');
    const cfStatus     = document.getElementById('cf-status');
    const cfFileInput  = document.getElementById('cf-file');
    const cfFileText   = document.getElementById('cf-file-text');

    // Показываем имя выбранного файла в кнопке
    if (cfFileInput && cfFileText) {
        cfFileInput.addEventListener('change', () => {
            const file = cfFileInput.files[0];
            cfFileText.textContent = file ? file.name : 'Загрузить файл';
        });
    }

    if (careerForm) {
        careerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Базовая валидация
            const nameEl  = careerForm.querySelector('#cf-name');
            const emailEl = careerForm.querySelector('#cf-email');
            if (!nameEl.value.trim() || !emailEl.value.trim()) {
                showStatus('error', 'Пожалуйста, заполните имя и email.');
                return;
            }

            // Проверка reCAPTCHA
            if (typeof grecaptcha !== 'undefined' && !grecaptcha.getResponse()) {
                showStatus('error', 'Пожалуйста, подтвердите что вы не робот.');
                return;
            }

            // Состояние загрузки
            cfSubmit.disabled = true;
            cfSubmitText.textContent = 'Отправляем...';
            clearStatus();

            try {
                // Forminit SDK (загружен через <script> в career.html)
                const fi = new Forminit();
                const { data, error } = await fi.submit('bc1nza8tt7u', new FormData(careerForm));

                if (error) {
                    showStatus('error', error.message || 'Ошибка отправки. Попробуйте позже.');
                } else {
                    showStatus('success', '✓ Резюме отправлено! Мы свяжемся с вами в ближайшее время.');
                    careerForm.reset();
                    if (cfFileText) cfFileText.textContent = 'Загрузить файл';
                    if (typeof grecaptcha !== 'undefined') grecaptcha.reset();
                }
            } catch (err) {
                showStatus('error', 'Нет соединения. Проверьте интернет и попробуйте снова.');
            } finally {
                cfSubmit.disabled = false;
                cfSubmitText.textContent = 'Отправить резюме';
            }
        });
    }

    function showStatus(type, message) {
        if (!cfStatus) return;
        cfStatus.className = 'career-form-status ' + (type === 'success' ? 'is-success' : 'is-error');
        cfStatus.textContent = message;
    }

    function clearStatus() {
        if (!cfStatus) return;
        cfStatus.className = 'career-form-status';
        cfStatus.textContent = '';
    }

    // ── Contacts: авто-выбор отрасли при переходе со страницы проекта ──
    (function () {
        const industrySelect = document.getElementById('contact-industry');
        if (!industrySelect) return;

        const params = new URLSearchParams(window.location.search);
        const categoryId = params.get('industry');
        if (!categoryId) return;

        // Маппинг category id из projects.json → value опции в select
        const categoryMap = {
            'industry':       'Промышленность и производство',
            'it':             'Информационные технологии',
            'infrastructure': 'Строительство и инфраструктура',
            'energy':         'Энергетика',
            'finance':        'Финансы и банковское дело',
            'telecom':        'Телекоммуникации',
            'transport':      'Транспорт и логистика',
            'government':     'Государственный сектор и управление',
            'utilities':      'ЖКХ и коммунальная инфраструктура',
        };

        const targetValue = categoryMap[categoryId];
        if (!targetValue) return;

        // Ищем совпадающую опцию и выбираем её
        for (const option of industrySelect.options) {
            if (option.value === targetValue) {
                option.selected = true;
                // Снимаем disabled со placeholder-опции если она была выбрана
                industrySelect.dispatchEvent(new Event('change'));
                break;
            }
        }

        // Плавно прокручиваем к форме
        const formCard = document.querySelector('.contact-form-card');
        if (formCard) {
            setTimeout(() => {
                formCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 400);
        }
    })();

    // ═══ contacts page: отправка формы через Forminit SDK ═══
    const contactForm       = document.getElementById('contact-inquiry-form');
    const contactStatusEl   = document.getElementById('contact-status');
    const contactSubmitBtn  = contactForm ? contactForm.querySelector('.contact-submit-btn') : null;
    const contactSubmitText = contactForm ? contactForm.querySelector('.contact-submit-text') : null;

    function showContactStatus(type, message) {
        if (!contactStatusEl) return;
        contactStatusEl.className = 'contact-form-status ' + (type === 'success' ? 'is-success' : 'is-error');
        contactStatusEl.textContent = message;
    }

    function clearContactStatus() {
        if (!contactStatusEl) return;
        contactStatusEl.className = 'contact-form-status';
        contactStatusEl.textContent = '';
    }

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Базовая валидация
            const nameEl  = contactForm.querySelector('#contact-name');
            const emailEl = contactForm.querySelector('#contact-email');
            if (!nameEl.value.trim() || !emailEl.value.trim()) {
                showContactStatus('error', 'Пожалуйста, заполните имя и email.');
                return;
            }

            // Проверка reCAPTCHA
            if (typeof grecaptcha !== 'undefined' && !grecaptcha.getResponse()) {
                showContactStatus('error', 'Пожалуйста, подтвердите, что вы не робот.');
                return;
            }

            // Блокируем кнопку на время отправки
            if (contactSubmitBtn) contactSubmitBtn.disabled = true;
            if (contactSubmitText) contactSubmitText.textContent = 'Отправляем...';
            clearContactStatus();

            try {
                // Forminit SDK (скрипт подключён в contacts.html)
                const fi = new Forminit();
                const { data, error } = await fi.submit('bc1nza8tt7u', new FormData(contactForm));

                if (error) {
                    showContactStatus('error', error.message || 'Ошибка отправки. Попробуйте позже.');
                } else {
                    showContactStatus('success', '✓ Запрос отправлен! Мы свяжемся с вами в ближайшее время.');
                    contactForm.reset();
                    if (typeof grecaptcha !== 'undefined') grecaptcha.reset();
                }
            } catch (err) {
                showContactStatus('error', 'Нет соединения. Проверьте интернет и попробуйте снова.');
            } finally {
                if (contactSubmitBtn) contactSubmitBtn.disabled = false;
                if (contactSubmitText) contactSubmitText.textContent = 'Отправить запрос';
            }
        });
    }

    // Кнопка «Наверх» — появляется когда футер виден
    const footer = document.querySelector('.site-footer');
    const scrollToTopBtn = document.createElement('button');
    scrollToTopBtn.className = 'scroll-to-top';
    scrollToTopBtn.setAttribute('aria-label', 'Прокрутить наверх');
    scrollToTopBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>';
    document.body.appendChild(scrollToTopBtn);

    if (footer) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                scrollToTopBtn.classList.toggle('is-visible', entry.isIntersecting);
            });
        }, { threshold: 0.3 });
        observer.observe(footer);
    }

    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ── Карусель SMART-карточек (мобайл ≤568px и планшет 569–1024px) ────────
    function initSmartCarousel() {
        if (window.innerWidth > 1024) return;
        const grid = document.querySelector('.smart-cards-grid');
        if (!grid) return;
        const cards = [...grid.querySelectorAll('.smart-card')];
        if (!cards.length) return;

        const isTablet = window.innerWidth > 568;

        // Снимаем начальное анимационное состояние (opacity:0 / translateY)
        cards.forEach(c => c.classList.add('srv-in-view'));

        // Dot-навигация
        const dotsWrap = document.querySelector('.smart-carousel-dots');
        if (dotsWrap) {
            cards.forEach((_, i) => {
                const btn = document.createElement('button');
                btn.className = 'dot' + (i === 0 ? ' active' : '');
                btn.setAttribute('aria-label', `Карточка ${i + 1}`);
                btn.addEventListener('click', () => {
                    let target;
                    if (isTablet) {
                        const maxScroll = grid.scrollWidth - grid.offsetWidth;
                        target = (i >= cards.length - 2)
                            ? maxScroll
                            : i * (cardW + gapPx);
                    } else {
                        target = padL + i * (cardW + gapPx) + cardW / 2 - gridW / 2;
                    }
                    grid.scrollTo({ left: target, behavior: 'smooth' });
                });
                dotsWrap.appendChild(btn);
            });
        }

        // Геометрия карусели (вычисляется один раз, стабильна)
        const gcs    = getComputedStyle(grid);
        const padL   = parseFloat(gcs.paddingLeft);
        const gapPx  = parseFloat(gcs.gap) || 12;
        const cardW  = cards[0].offsetWidth;   // offsetWidth до первого scroll-события
        const gridW  = grid.offsetWidth;

        // Планшет: последняя позиция — R и T по центру экрана.
        // Используем margin-right на последней карточке (не влияет на flex %-ширину),
        // чтобы maxScroll = позиция центрирования последних двух карточек.
        if (isTablet && cards.length >= 2) {
            const step       = cardW + gapPx;
            const twoCardsW  = 2 * cardW + gapPx;
            const centerOff  = Math.max(0, (gridW - twoCardsW) / 2);
            const targetLast = Math.max(0, padL + (cards.length - 2) * step - centerOff);
            const neededScrollW = targetLast + gridW;
            const extraMargin = Math.max(0, neededScrollW - grid.scrollWidth);
            if (extraMargin > 0) {
                const lastCard = cards[cards.length - 1];
                const curMar = parseFloat(getComputedStyle(lastCard).marginRight) || 0;
                lastCard.style.marginRight = (curMar + extraMargin) + 'px';
            }
        }

        // Обновление состояния карусели (3D-эффект для всех диапазонов)
        function updateCards() {
            let activeIdx = 0;
            let minDist   = Infinity;
            const maxDist = cardW + gapPx;

            if (isTablet) {
                // Планшет: плавный 3D — от 90° (полностью за краем) до 0° (полностью видима)
                const step    = cardW + gapPx;
                const visLeft  = grid.scrollLeft;
                const visRight = grid.scrollLeft + gridW;
                activeIdx = Math.round(grid.scrollLeft / step);

                cards.forEach((card, i) => {
                    const cLeft  = padL + i * step;
                    const cRight = cLeft + cardW;
                    let t;
                    if (cLeft >= visLeft && cRight <= visRight) {
                        t = 0; // полностью видима — строго плоская
                    } else if (cRight <= visLeft) {
                        t = (cRight - visLeft) / step; // слева от вьюпорта (отрицательное)
                    } else if (cLeft >= visRight) {
                        t = (cLeft - visRight) / step; // справа от вьюпорта (положительное)
                    } else if (cLeft < visLeft) {
                        t = (cLeft - visLeft) / step;  // частично слева
                    } else {
                        t = (cRight - visRight) / step; // частично справа
                    }
                    t = Math.max(-1.2, Math.min(1.2, t));
                    const rotY  = t * 90;
                    const scale = 1 - Math.abs(t) * 0.13;
                    const alpha = Math.max(0.65, 1 - Math.abs(t) * 0.35);
                    const tx    = -t * Math.min(30, gridW * 0.08);
                    card.style.transform = `translateX(${tx}px) perspective(1200px) rotateY(${rotY}deg) scale(${scale})`;
                    card.style.opacity   = alpha;
                });
            } else {
                // Мобайл: центр вьюпорта
                const viewMid = grid.scrollLeft + gridW / 2;

                cards.forEach((card, i) => {
                    const cardCenter = padL + i * (cardW + gapPx) + cardW / 2;
                    const dist       = cardCenter - viewMid;
                    const t          = Math.max(-1.2, Math.min(1.2, dist / maxDist));
                    const rotY  = t * 55;
                    const scale = 1 - Math.abs(t) * 0.13;
                    const alpha = Math.max(0.65, 1 - Math.abs(t) * 0.35);
                    const tx    = -t * Math.min(30, gridW * 0.08);
                    card.style.transform = `translateX(${tx}px) perspective(1200px) rotateY(${rotY}deg) scale(${scale})`;
                    card.style.opacity   = alpha;
                    if (Math.abs(dist) < minDist) { minDist = Math.abs(dist); activeIdx = i; }
                });
            }

            if (dotsWrap) {
                dotsWrap.querySelectorAll('.dot').forEach((d, i) =>
                    d.classList.toggle('active', i === activeIdx)
                );
            }
        }

        // rAF-обёртка: гарантирует вызов updateCards ровно 1 раз за кадр (60fps)
        let rafPending = false;
        function scheduleUpdate() {
            if (rafPending) return;
            rafPending = true;
            requestAnimationFrame(() => { rafPending = false; updateCards(); });
        }

        grid.addEventListener('scroll', scheduleUpdate, { passive: true });
        grid.addEventListener('scrollend', scheduleUpdate, { passive: true });

        // Планшет: последние карточки докручиваются до упора (без peek слева)
        if (isTablet) {
            grid.addEventListener('scrollend', () => {
                const step     = cardW + gapPx;
                const snapIdx  = Math.round(grid.scrollLeft / step);
                const maxScroll = grid.scrollWidth - grid.offsetWidth;
                if (snapIdx >= cards.length - 2 && grid.scrollLeft < maxScroll - 1) {
                    grid.scrollTo({ left: maxScroll, behavior: 'smooth' });
                }
            }, { passive: true });
        }

        updateCards();

        // Drag-поддержка мышью (удобно на тачпаде)
        let isDown = false, startX = 0, startScroll = 0;
        grid.addEventListener('mousedown', e => {
            isDown = true; startX = e.pageX; startScroll = grid.scrollLeft;
        });
        window.addEventListener('mouseup', () => { isDown = false; });
        grid.addEventListener('mousemove', e => {
            if (!isDown) return;
            e.preventDefault();
            grid.scrollLeft = startScroll - (e.pageX - startX);
        }, { passive: false });
    }
    initSmartCarousel();

    // ─── Тёмная тема ─────────────────────────────────────────────────────────
    // По умолчанию — светлая; тема ОС не используется. Выбор пользователя
    // хранится в localStorage (sp-theme) и подставляется на всех страницах.
    (function initTheme() {
        const html        = document.documentElement;
        const btn         = document.querySelector('.theme-toggle');
        const STORAGE_KEY = 'sp-theme';

        function applyTheme(theme) {
            const t = theme === 'dark' ? 'dark' : 'light';
            html.setAttribute('data-theme', t);
            html.style.colorScheme = t;
            localStorage.setItem(STORAGE_KEY, t);
        }

        if (btn) {
            btn.addEventListener('click', () => {
                const current = html.getAttribute('data-theme') || 'light';
                applyTheme(current === 'dark' ? 'light' : 'dark');
            });
        }

        // Re-apply on bfcache restore (back/forward navigation on real hosting)
        window.addEventListener('pageshow', function(e) {
            if (e.persisted) {
                applyTheme(localStorage.getItem(STORAGE_KEY) || 'light');
            }
        });
    })();

    // ── Lang dropdown: открытие/закрытие на < 1024px ─────────────
    (function () {
        const wraps = document.querySelectorAll('.lang-switcher-wrap');

        function closeWrap(w) {
            w.classList.remove('is-open');
            w.style.minHeight = '';
            w.style.minWidth  = '';
        }

        wraps.forEach(wrap => {
            wrap.addEventListener('click', e => {
                if (window.innerWidth > 1024) return;
                const btn = e.target.closest('.lang-btn');
                if (!btn) return;
                e.stopPropagation();
                if (!wrap.classList.contains('is-open')) {
                    // Первый клик — открываем список, не переключаем язык
                    e.preventDefault();
                    wrap.style.minHeight = wrap.offsetHeight + 'px';
                    wrap.style.minWidth  = wrap.offsetWidth  + 'px';
                    wrap.classList.add('is-open');
                } else {
                    // Список уже открыт — закрываем и позволяем переключение
                    closeWrap(wrap);
                }
            });
        });

        // pointerdown надёжно закрывает на тач-устройствах (iOS click-outside bug)
        document.addEventListener('pointerdown', e => {
            if (window.innerWidth > 1024) return;
            if (!e.target.closest('.lang-switcher-wrap')) {
                wraps.forEach(closeWrap);
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 1024) wraps.forEach(closeWrap);
        });
    })();

});
