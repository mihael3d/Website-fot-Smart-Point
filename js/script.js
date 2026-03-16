document.addEventListener('DOMContentLoaded', () => {
    // hero-home: hero-animated в HTML, анимация при каждой загрузке
    // hero-services (services.html) — анимация при каждом посещении
    const heroServices = document.querySelector('.hero.hero-services');
    if (heroServices) {
        heroServices.classList.add('hero-animated');
    }

    // Hero section logic handled above

    const header = document.querySelector('.main-header');
    const links = document.querySelectorAll('.main-nav a');
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    const menuOverlay = document.querySelector('.menu-overlay');

    function closeMenu() {
        mobileMenuToggle.classList.remove('active');
        mainNav.classList.remove('is-open');
        if (menuOverlay) menuOverlay.classList.remove('is-active');
        lockScroll(false);
    }

    function lockScroll(lock) {
        document.documentElement.style.overflow = lock ? 'hidden' : '';
        document.body.style.overflow = lock ? 'hidden' : '';
        document.body.classList.toggle('menu-open', lock);
    }

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

        // Close menu when clicking on a link
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                const isActive = link.classList.contains('active') || link.closest('li')?.classList.contains('active');
                if (isActive) {
                    e.preventDefault();
                    closeMenu();
                } else {
                    closeMenu();
                }
            });
        });
    }

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
     * - Анимации запускаются ТОЛЬКО при первом посещении страницы в сессии
     * - При возврате назад (back_forward) или повторном посещении - контент сразу виден
     * - Используем sessionStorage для отслеживания в рамках одной сессии браузера
     */

    const navEntry = performance.getEntriesByType('navigation')[0];
    const navType = navEntry ? navEntry.type : '';
    const isReload = navType === 'reload';
    const isBackForward = navType === 'back_forward';

    const pageKey = 'scrollAnimPlayed_' + (location.pathname || location.href);

    let pageVisited = false;
    try {
        pageVisited = sessionStorage.getItem(pageKey) === '1';
    } catch (e) {
        console.warn('SessionStorage недоступен:', e);
    }

    // Анимации появления показываются всегда, при любом сценарии посещения
    const shouldPlayScrollAnimations = true;

    // При повторном посещении — показываем сразу без анимации
    if (!shouldPlayScrollAnimations) {
        // Вызов после загрузки DOM
        document.addEventListener('DOMContentLoaded', showScrollSectionsWithoutAnim);
        // Подстраховка если DOMContentLoaded уже сработал
        if (document.readyState !== 'loading') showScrollSectionsWithoutAnim();
    }


    // Отмечаем страницу как посещенную
    if (!pageVisited) {
        try {
            sessionStorage.setItem(pageKey, '1');
        } catch (e) {
            console.warn('Не удалось сохранить в sessionStorage:', e);
        }
    }

    /**
     * Функция для мгновенного показа всех анимируемых элементов без анимации
     */
    function showScrollSectionsWithoutAnim() {


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
        if (clientsMarquee) {
            clientsMarquee.style.transition = 'none';
            clientsMarquee.classList.add('clients-marquee-in-view');
            requestAnimationFrame(() => {
                clientsMarquee.style.transition = '';
            });
        }

        // Показываем элементы секции design6
        const d6 = document.querySelector('.section-advantages');
        if (d6) {
            const elements = d6.querySelectorAll('.advantages-divider, .advantages-heading, .advantage-cards .advantage-card, .advantages-image');

            elements.forEach((el) => {
                el.style.transition = 'none';
                el.classList.add('advantages-in-view');
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
            const isMobile = window.innerWidth <= 768;
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
                rootMargin: window.innerWidth <= 768 ? '0px 0px -8% 0px' : '0px 0px 12% 0px'
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
        const d6Animated = sectionD6.querySelectorAll('.advantages-divider, .advantages-heading, .advantage-cards .advantage-card, .advantages-image');

        if (shouldPlayScrollAnimations) {
            // Запускаем анимации через IntersectionObserver
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
            // ВАЖНО: Отключаем transitions перед добавлением классов!
            d6Animated.forEach((el) => {
                // Временно отключаем transition
                el.style.transition = 'none';
                // Добавляем класс (элемент станет видимым)
                el.classList.add('advantages-in-view');
            });

            // Возвращаем transitions после рендеринга
            requestAnimationFrame(() => {
                d6Animated.forEach((el) => {
                    el.style.transition = '';
                });
            });
        }
    }

    // ========== Анимация секции clients-marquee ==========
    const sectionClientsMarquee = document.querySelector('.section-clients-marquee');

    if (sectionClientsMarquee) {
        if (shouldPlayScrollAnimations) {
            const isMobileMarquee = window.innerWidth <= 768;
            const marqueeRootMargin = isMobileMarquee ? '0px 0px 60% 0px' : '0px 0px 18% 0px';
            const marqueeObserver = new IntersectionObserver((entries, obs) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('clients-marquee-in-view');
                        obs.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.05, rootMargin: marqueeRootMargin });
            marqueeObserver.observe(sectionClientsMarquee);
        } else {
            sectionClientsMarquee.style.transition = 'none';
            sectionClientsMarquee.classList.add('clients-marquee-in-view');
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
        const isMobileSrv = window.innerWidth <= 768;
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
        const strategyIntroEls = document.querySelectorAll('.strategy-intro .company-label, .strategy-heading, .strategy-intro-bold, .strategy-intro-text');
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
                if (isWide && smartCardsGrid) {
                    let smartCardsFired = false;
                    const smartCardsObs = new IntersectionObserver((entries, obs) => {
                        entries.forEach((entry) => {
                            if (entry.isIntersecting && !smartCardsFired) {
                                smartCardsFired = true;
                                obs.unobserve(entry.target);
                                smartCards.forEach((card, i) => {
                                    setTimeout(() => card.classList.add('srv-in-view'), i * 200);
                                });
                            }
                        });
                    }, smartCardsOpts);
                    smartCardsObs.observe(smartCardsGrid);
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

        // stages header (staggered)
        const stagesHeaderEls = document.querySelectorAll('.stages-experience-title, .stages-experience-text, .stages-side-label');
        if (stagesHeaderEls.length) {
            const stagesHeaderTrigger = stagesHeaderEls[0].closest('.stages-main, .stages-with-label') || stagesHeaderEls[0].parentElement;
            let stagesHeaderFired = false;
            const stagesHeaderObs = new IntersectionObserver((entries, obs) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !stagesHeaderFired) {
                        stagesHeaderFired = true;
                        obs.unobserve(entry.target);
                        stagesHeaderEls.forEach((el, i) => {
                            setTimeout(() => el.classList.add('srv-in-view'), i * 150);
                        });
                    }
                });
            }, { threshold: 0.05, rootMargin: srvRootMargin });
            stagesHeaderObs.observe(stagesHeaderTrigger);
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

        // career-why-section (career.html) — триггер: 5% для heading/items, 1% для circle
        const careerWhyEls = document.querySelectorAll('.cw-heading, .cw-item');
        const careerCircleWrap = document.querySelector('.cw-circle-wrap');
        if (careerWhyEls.length) {
            const careerWhyObs = new IntersectionObserver((entries, obs) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('srv-in-view');
                        obs.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.05 });
            careerWhyEls.forEach((el) => careerWhyObs.observe(el));
        }
        if (careerCircleWrap) {
            const circleObs = new IntersectionObserver((entries, obs) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('srv-in-view');
                        obs.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.01, rootMargin: '0px 0px 15% 0px' });
            circleObs.observe(careerCircleWrap);
        }
    }

    /* Why Choose Us Tabs */
    const wcuTabs = document.querySelectorAll('.wcu-tab');
    const wcuContents = document.querySelectorAll('.wcu-content');

    if (wcuTabs.length > 0) {
        wcuTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetId = tab.getAttribute('data-target');
                const targetContent = document.getElementById(targetId);

                // If already active, do nothing
                if (tab.classList.contains('active')) return;

                // 1. Find currently active tab & content
                const currentTab = document.querySelector('.wcu-tab.active');
                const currentContent = document.querySelector('.wcu-content.active');

                // Update Tabs immediately for responsiveness
                if (currentTab) currentTab.classList.remove('active');
                tab.classList.add('active');

                // 2. Handle Content Animation
                const isMobile = window.innerWidth <= 768;
                const wrapper = document.querySelector('.wcu-content-wrapper');

                if (currentContent) {
                    if (isMobile) {
                        // Mobile: fix height, instant switch
                        if (wrapper) wrapper.style.minHeight = wrapper.offsetHeight + 'px';
                        currentContent.classList.remove('active');
                        if (targetContent) {
                            targetContent.classList.add('active');
                        }
                        // Release fixed height after paint
                        requestAnimationFrame(() => {
                            if (wrapper) wrapper.style.minHeight = '';
                        });
                    } else {
                        // Desktop: animated transition
                        currentContent.classList.remove('active');
                        currentContent.classList.add('leaving');

                        // Wait for smokeOut animation (500ms)
                        setTimeout(() => {
                            currentContent.classList.remove('leaving');
                            // Show new content
                            if (targetContent) {
                                targetContent.classList.add('active');
                            }
                        }, 480);
                    }
                } else {
                    // No current content? Just show new one (initial load safety)
                    if (targetContent) {
                        targetContent.classList.add('active');
                    }
                }
            });
        });
    }

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
            const HEADER_HEIGHT = 80;
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
                            // Фаза появления - поворот от 0 до -25
                            progress = Math.min(1, Math.max(0, (viewportCenter - appearanceStart) / (appearanceEnd - appearanceStart)));
                            const rotation = -25 * progress;
                            secondImage.style.transform = `rotate(${rotation}deg)`;
                        } else {
                            // Фаза исчезновения - поворот от -25 до -45
                            progress = Math.min(1, Math.max(0, (viewportCenter - disappearanceStart) / (disappearanceEnd - disappearanceStart)));
                            const rotation = -25 + (progress * -20);
                            secondImage.style.transform = `rotate(${rotation}deg)`;
                        }
                    } else if (viewportCenter < appearanceStart) {
                        secondImage.style.transform = 'rotate(0deg)';
                    } else {
                        secondImage.style.transform = 'rotate(-45deg)';
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

    // Initialize portfolio if on projects page
    const portfolioSection = document.querySelector('.portfolio-section');
    if (portfolioSection) {
        initPortfolio();
    }

    async function initPortfolio() {
        try {
            // Load projects data
            const response = await fetch('data/projects.json');
            if (!response.ok) {
                throw new Error('Failed to load projects data');
            }
            portfolioData = await response.json();

            // Render filters and projects
            renderCategoryFilters();
            renderProjects();
        } catch (error) {
            console.error('Error loading portfolio:', error);
            const grid = document.getElementById('projectsGrid');
            if (grid) {
                grid.innerHTML = '<p style="text-align: center; color: rgba(77, 76, 76, 0.6);">Не удалось загрузить проекты. Пожалуйста, попробуйте позже.</p>';
            }
        }
    }

    function renderCategoryFilters() {
        const filtersContainer = document.getElementById('categoryFilters');
        if (!filtersContainer || !portfolioData) return;

        // Add "All" button
        const allButton = createFilterButton('all', 'Все', true);
        filtersContainer.appendChild(allButton);

        // Add category buttons
        portfolioData.categories.forEach(category => {
            const button = createFilterButton(category.id, category.name, false);
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
    }

    function createProjectCard(project, index) {
        const card = document.createElement('a');
        card.className = 'project-card';
        card.href = `project-detail.html?id=${project.id}`;
        card.dataset.category = project.category;
        card.style.animationDelay = `${index * 0.08}s`;

        // Get category name
        const category = portfolioData.categories.find(c => c.id === project.category);
        const categoryName = category ? category.name : project.category;

        card.innerHTML = `
            <div class="project-card-image">
                <div class="project-card-image-placeholder"><span>${project.title.charAt(0)}</span></div>
                <img src="${project.thumbnail}" alt="${project.title}"
                     onload="this.style.opacity='1'"
                     onerror="this.remove()"
                     style="opacity:0;transition:opacity 0.4s ease, transform 1s cubic-bezier(0.33, 1, 0.68, 1)">
            </div>
            <div class="project-card-content">
                <div class="project-card-top">
                    <span class="project-card-label">[+ ${categoryName.toUpperCase()}]</span>
                    <span class="project-card-year">${project.year}</span>
                </div>
                <h3 class="project-card-title">${project.title}</h3>
                <p class="project-card-description">${project.shortDescription}</p>
                <div class="project-card-footer">
                    <span class="project-card-arrow">Подробнее</span>
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
    }

    function openProjectDetail(projectId) {
        // Navigate to project detail page with project ID
        window.location.href = `project-detail.html?id=${projectId}`;
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

});
