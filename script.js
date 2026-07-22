/* ========================================
   El Patio - Landing Page Scripts
   Interactividad: scroll animations, menu tabs,
   mobile menu, form → WhatsApp, header scroll
   ======================================== */

(function () {
    'use strict';

    // --- Header Scroll ---
    const header = document.getElementById('main-header');
    let lastScroll = 0;

    function handleHeaderScroll() {
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
        if (currentScroll > 60) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        lastScroll = currentScroll;
    }

    window.addEventListener('scroll', handleHeaderScroll, { passive: true });
    handleHeaderScroll();

    // --- Mobile Menu ---
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileNav = document.querySelector('.mobile-nav');
    const mobileNavLinks = mobileNav.querySelectorAll('a');

    function toggleMobileMenu() {
        mobileMenuBtn.classList.toggle('active');
        mobileNav.classList.toggle('active');
        document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
    }

    function closeMobileMenu() {
        mobileMenuBtn.classList.remove('active');
        mobileNav.classList.remove('active');
        document.body.style.overflow = '';
    }

    mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    mobileNavLinks.forEach(function (link) {
        link.addEventListener('click', closeMobileMenu);
    });

    // --- Menu Tabs ---
    const menuTabs = document.querySelectorAll('.menu-tab');
    const menuContents = document.querySelectorAll('.menu-content');

    menuTabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            const targetId = this.getAttribute('data-tab');

            // Update active tab
            menuTabs.forEach(function (t) { t.classList.remove('active'); });
            this.classList.add('active');

            // Update active content
            menuContents.forEach(function (content) {
                content.classList.remove('active');
                if (content.id === targetId) {
                    content.classList.add('active');
                    // Re-trigger animations for newly visible cards
                    const cards = content.querySelectorAll('[data-animate]');
                    cards.forEach(function (card, index) {
                        card.classList.remove('visible');
                        setTimeout(function () {
                            card.classList.add('visible');
                        }, 80 * index);
                    });
                }
            });
        });
    });

    // --- Scroll Animations (Intersection Observer) ---
    function initScrollAnimations() {
        var animatedElements = document.querySelectorAll('[data-animate]');

        if ('IntersectionObserver' in window) {
            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry, index) {
                    if (entry.isIntersecting) {
                        // Staggered delay based on sibling index
                        var siblings = entry.target.parentElement.querySelectorAll('[data-animate]');
                        var siblingIndex = Array.prototype.indexOf.call(siblings, entry.target);
                        var delay = siblingIndex * 100;

                        setTimeout(function () {
                            entry.target.classList.add('visible');
                        }, delay);

                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -40px 0px'
            });

            animatedElements.forEach(function (el) {
                observer.observe(el);
            });
        } else {
            // Fallback: just show everything
            animatedElements.forEach(function (el) {
                el.classList.add('visible');
            });
        }
    }

    // Initialize after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initScrollAnimations);
    } else {
        initScrollAnimations();
    }

    // --- Smooth Scroll for Anchor Links ---
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            var targetId = this.getAttribute('href');
            if (targetId === '#') return;

            var targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                var headerHeight = header.offsetHeight || 80;
                var targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Carrusel Infinito: Así se ve el lugar ---
    (function initCarousel() {
        var track = document.querySelector('.carrusel-track');
        var prevBtn = document.querySelector('.carrusel-prev');
        var nextBtn = document.querySelector('.carrusel-next');
        var dotsContainer = document.querySelector('.carrusel-dots');
        if (!track || !prevBtn || !nextBtn) return;

        var originalSlides = track.querySelectorAll('.carrusel-slide');
        var realCount = originalSlides.length;
        var slideWidth = 0;

        // --- Clonar primera y última para el loop infinito ---
        var firstClone = originalSlides[0].cloneNode(true);
        var lastClone = originalSlides[realCount - 1].cloneNode(true);
        track.insertBefore(lastClone, originalSlides[0]);
        track.appendChild(firstClone);

        var allSlides = track.querySelectorAll('.carrusel-slide');
        var totalSlides = allSlides.length; // realCount + 2

        function getSlideWidth() {
            if (allSlides.length > 0) {
                var slide = allSlides[0];
                var style = window.getComputedStyle(slide);
                var marginLeft = parseFloat(style.marginLeft) || 0;
                var marginRight = parseFloat(style.marginRight) || 0;
                var gap = parseFloat(window.getComputedStyle(track).gap) || 16;
                slideWidth = slide.offsetWidth + marginLeft + marginRight + gap;
            }
        }

        function getRealIndex(scrollLeft) {
            // rawIndex 0 = clone del último → dot real = último
            // rawIndex 1..realCount = slides reales → dot = rawIndex - 1
            // rawIndex realCount+1 = clone del primero → dot = 0
            var rawIndex = Math.round(scrollLeft / slideWidth);
            return ((rawIndex - 1) % realCount + realCount) % realCount;
        }

        function updateDots() {
            if (!dotsContainer) return;
            var dotIndex = getRealIndex(track.scrollLeft);
            dotsContainer.querySelectorAll('.carrusel-dot').forEach(function (dot, i) {
                dot.classList.toggle('active', i === dotIndex);
            });
        }

        function scrollToReal(index) {
            // index 0 = primer slide real, se muestra en posición 1
            getSlideWidth();
            if (slideWidth <= 0) {
                slideWidth = allSlides[0].offsetWidth + 16;
            }
            track.scrollTo({ left: (index + 1) * slideWidth, behavior: 'smooth' });
        }

        // --- Manejar loop infinito en scroll (el truco del clon) ---
        function handleInfiniteScroll() {
            getSlideWidth();
            if (slideWidth <= 0) return;

            var rawIndex = Math.round(track.scrollLeft / slideWidth);

            if (rawIndex === 0) {
                // Llegó al clone del último → saltar al último real
                track.style.scrollBehavior = 'auto';
                track.scrollLeft = slideWidth * realCount;
                track.style.scrollBehavior = 'smooth';
            } else if (rawIndex === totalSlides - 1) {
                // Llegó al clone del primero → saltar al primer real
                track.style.scrollBehavior = 'auto';
                track.scrollLeft = slideWidth;
                track.style.scrollBehavior = 'smooth';
            }

            updateDots();
        }

        // --- Construir dots (solo para slides reales) ---
        if (dotsContainer && realCount > 0) {
            for (var i = 0; i < realCount; i++) {
                (function (idx) {
                    var dot = document.createElement('button');
                    dot.className = 'carrusel-dot' + (i === 0 ? ' active' : '');
                    dot.setAttribute('aria-label', 'Ir a imagen ' + (idx + 1));
                    dot.addEventListener('click', function () { scrollToReal(idx); });
                    dotsContainer.appendChild(dot);
                })(i);
            }
        }

        // --- Botones: siguiente/anterior ---
        prevBtn.addEventListener('click', function () {
            getSlideWidth();
            if (slideWidth <= 0) return;
            track.scrollBy({ left: -slideWidth, behavior: 'smooth' });
        });

        nextBtn.addEventListener('click', function () {
            getSlideWidth();
            if (slideWidth <= 0) return;
            track.scrollBy({ left: slideWidth, behavior: 'smooth' });
        });

        // --- Scroll listener para el loop ---
        track.addEventListener('scroll', handleInfiniteScroll);

        // --- Recalcular en resize ---
        window.addEventListener('resize', function () {
            getSlideWidth();
        });

        // --- Inicializar en el primer slide real ---
        setTimeout(function () {
            getSlideWidth();
            if (slideWidth > 0) {
                track.style.scrollBehavior = 'auto';
                track.scrollLeft = slideWidth;
                track.style.scrollBehavior = 'smooth';
            }
            updateDots();
        }, 200);
    })();

    // --- Reservation Form → WhatsApp ---
    var reservationForm = document.getElementById('reservation-form');

    if (reservationForm) {
        reservationForm.addEventListener('submit', function (e) {
            e.preventDefault();

            var name = document.getElementById('name').value.trim();
            var phone = document.getElementById('phone').value.trim();
            var date = document.getElementById('date').value;
            var time = document.getElementById('time').value;
            var guests = document.getElementById('guests').value;
            var message = document.getElementById('message').value.trim();

            if (!name || !phone || !date || !time || !guests) {
                alert('Por favor, completá todos los campos obligatorios.');
                return;
            }

            // Format date nicely
            var dateObj = new Date(date + 'T12:00:00');
            var months = [
                'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
            ];
            var days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
            var formattedDate = days[dateObj.getDay()] + ' ' + dateObj.getDate() + ' de ' + months[dateObj.getMonth()];

            // Build WhatsApp message
            var whatsappMessage = 'Hola! Quiero hacer una reserva en El Patio 🌿\n\n';
            whatsappMessage += '👤 *' + name + '*\n';
            whatsappMessage += '📱 Teléfono: ' + phone + '\n';
            whatsappMessage += '📅 Fecha: ' + formattedDate + '\n';
            whatsappMessage += '🕐 Horario: ' + time + '\n';
            whatsappMessage += '👥 Personas: ' + guests + '\n';

            if (message) {
                whatsappMessage += '\n💬 *Mensaje:* ' + message + '\n';
            }

            whatsappMessage += '\n¡Gracias!';

            // Encode for URL
            var encodedMessage = encodeURIComponent(whatsappMessage);
            var whatsappUrl = 'https://wa.me/5491157165416?text=' + encodedMessage;

            window.open(whatsappUrl, '_blank');
        });
    }

    // --- Active nav link on scroll ---
    var sections = document.querySelectorAll('section[id]');

    function updateActiveNav() {
        var scrollPos = window.pageYOffset + 150;

        sections.forEach(function (section) {
            var top = section.offsetTop;
            var height = section.offsetHeight;
            var id = section.getAttribute('id');
            var navLink = document.querySelector('.desktop-nav a[href="#' + id + '"]');

            if (navLink) {
                if (scrollPos >= top && scrollPos < top + height) {
                    navLink.style.color = 'var(--color-primary)';
                } else {
                    navLink.style.color = '';
                }
            }
        });
    }

    window.addEventListener('scroll', updateActiveNav, { passive: true });

    // --- Set minimum date for reservation form ---
    var dateInput = document.getElementById('date');
    if (dateInput) {
        var today = new Date();
        var year = today.getFullYear();
        var month = String(today.getMonth() + 1).padStart(2, '0');
        var day = String(today.getDate()).padStart(2, '0');
        dateInput.setAttribute('min', year + '-' + month + '-' + day);
    }

    // --- WhatsApp float: hide on scroll down, show on scroll up ---
    var whatsappFloat = document.querySelector('.whatsapp-float');
    var prevScrollPos = window.pageYOffset;

    function handleWhatsAppVisibility() {
        if (!whatsappFloat) return;

        var currentScrollPos = window.pageYOffset;

        if (currentScrollPos > 300) {
            if (currentScrollPos > prevScrollPos) {
                // Scrolling down
                whatsappFloat.style.opacity = '0';
                whatsappFloat.style.pointerEvents = 'none';
                whatsappFloat.style.transform = 'translateY(20px)';
            } else {
                // Scrolling up
                whatsappFloat.style.opacity = '1';
                whatsappFloat.style.pointerEvents = 'auto';
                whatsappFloat.style.transform = 'translateY(0)';
            }
        } else {
            whatsappFloat.style.opacity = '1';
            whatsappFloat.style.pointerEvents = 'auto';
            whatsappFloat.style.transform = 'translateY(0)';
        }

        prevScrollPos = currentScrollPos;
    }

    window.addEventListener('scroll', handleWhatsAppVisibility, { passive: true });

})();
