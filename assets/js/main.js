/**
 * Delmar Nazarene Church - Main JavaScript
 * =========================================
 *
 * This file contains all the interactive functionality for the website.
 * It's written in vanilla JavaScript for maximum compatibility and performance.
 *
 * Features:
 * - Mobile navigation toggle
 * - Dropdown menu handling
 * - Smooth scrolling
 * - Sticky header behavior
 * - Accessibility enhancements
 * - Form validation helpers
 */

'use strict';

// ============================================
// Configuration
// ============================================
const CONFIG = {
    breakpoints: {
        mobile: 640,
        tablet: 768,
        desktop: 1024,
        wide: 1280
    },
    animationDuration: 300,
    scrollOffset: 80, // Account for sticky header
    debounceDelay: 150
};

// ============================================
// Utility Functions
// ============================================

/**
 * Debounce function to limit how often a function can fire
 * @param {Function} func - The function to debounce
 * @param {number} wait - The debounce delay in milliseconds
 * @returns {Function} - The debounced function
 */
function debounce(func, wait = CONFIG.debounceDelay) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Check if an element is in the viewport
 * @param {HTMLElement} element - The element to check
 * @param {number} offset - Offset from viewport edge
 * @returns {boolean} - Whether the element is visible
 */
function isInViewport(element, offset = 0) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= -offset &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + offset &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Get current breakpoint based on window width
 * @returns {string} - Current breakpoint name
 */
function getCurrentBreakpoint() {
    const width = window.innerWidth;
    if (width < CONFIG.breakpoints.mobile) return 'xs';
    if (width < CONFIG.breakpoints.tablet) return 'mobile';
    if (width < CONFIG.breakpoints.desktop) return 'tablet';
    if (width < CONFIG.breakpoints.wide) return 'desktop';
    return 'wide';
}

// ============================================
// Mobile Navigation
// ============================================
const MobileNav = {
    isOpen: false,
    toggleButton: null,
    nav: null,
    closeButton: null,
    focusableElements: null,
    lastFocusedElement: null,

    init() {
        this.toggleButton = document.querySelector('.mobile-menu-toggle');
        this.nav = document.querySelector('.mobile-nav');
        this.closeButton = document.querySelector('.mobile-nav-close');

        if (!this.toggleButton || !this.nav) return;

        // Event listeners
        this.toggleButton.addEventListener('click', () => this.toggle());

        if (this.closeButton) {
            this.closeButton.addEventListener('click', () => this.close());
        }

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Close when clicking outside
        this.nav.addEventListener('click', (e) => {
            if (e.target === this.nav) {
                this.close();
            }
        });

        // Close on window resize if open and going to desktop
        window.addEventListener('resize', debounce(() => {
            if (this.isOpen && window.innerWidth >= CONFIG.breakpoints.desktop) {
                this.close();
            }
        }));

        // Handle submenu toggles
        this.initSubmenus();
    },

    initSubmenus() {
        const submenuToggles = this.nav?.querySelectorAll('.mobile-nav-submenu-toggle');
        submenuToggles?.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                const parent = toggle.closest('li');
                const submenu = parent.querySelector('.mobile-nav-submenu');

                if (submenu) {
                    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
                    toggle.setAttribute('aria-expanded', !isExpanded);
                    submenu.style.display = isExpanded ? 'none' : 'block';
                }
            });
        });
    },

    toggle() {
        this.isOpen ? this.close() : this.open();
    },

    open() {
        this.isOpen = true;
        this.lastFocusedElement = document.activeElement;

        this.nav.classList.add('open');
        this.toggleButton.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';

        // Focus management
        this.focusableElements = this.nav.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (this.focusableElements.length > 0) {
            this.focusableElements[0].focus();
        }

        // Trap focus within mobile nav
        this.trapFocus();
    },

    close() {
        this.isOpen = false;

        this.nav.classList.remove('open');
        this.toggleButton.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';

        // Restore focus
        if (this.lastFocusedElement) {
            this.lastFocusedElement.focus();
        }
    },

    trapFocus() {
        const firstFocusable = this.focusableElements[0];
        const lastFocusable = this.focusableElements[this.focusableElements.length - 1];

        const handleTabKey = (e) => {
            if (!this.isOpen || e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        };

        document.addEventListener('keydown', handleTabKey);
    }
};

// ============================================
// Desktop Navigation Dropdowns
// ============================================
const DesktopNav = {
    init() {
        const navItems = document.querySelectorAll('.nav-item');

        navItems.forEach(item => {
            const link = item.querySelector('.nav-link.has-dropdown');
            const dropdown = item.querySelector('.nav-dropdown');

            if (!link || !dropdown) return;

            // Keyboard navigation
            link.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const isExpanded = link.getAttribute('aria-expanded') === 'true';
                    this.toggleDropdown(link, dropdown, !isExpanded);
                }

                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.toggleDropdown(link, dropdown, true);
                    const firstLink = dropdown.querySelector('a');
                    if (firstLink) firstLink.focus();
                }
            });

            // Arrow key navigation within dropdown
            dropdown.addEventListener('keydown', (e) => {
                const links = dropdown.querySelectorAll('a');
                const currentIndex = Array.from(links).indexOf(document.activeElement);

                if (e.key === 'ArrowDown' && currentIndex < links.length - 1) {
                    e.preventDefault();
                    links[currentIndex + 1].focus();
                }

                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (currentIndex > 0) {
                        links[currentIndex - 1].focus();
                    } else {
                        link.focus();
                        this.toggleDropdown(link, dropdown, false);
                    }
                }

                if (e.key === 'Escape') {
                    link.focus();
                    this.toggleDropdown(link, dropdown, false);
                }
            });
        });
    },

    toggleDropdown(link, dropdown, isOpen) {
        link.setAttribute('aria-expanded', isOpen);
        dropdown.setAttribute('aria-hidden', !isOpen);
    }
};

// ============================================
// Smooth Scrolling
// ============================================
const SmoothScroll = {
    init() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const targetId = anchor.getAttribute('href');

                // Skip if it's just "#" or empty
                if (targetId === '#' || !targetId) return;

                const targetElement = document.querySelector(targetId);

                if (targetElement) {
                    e.preventDefault();

                    const offsetTop = targetElement.getBoundingClientRect().top + window.pageYOffset;
                    const scrollPosition = offsetTop - CONFIG.scrollOffset;

                    window.scrollTo({
                        top: scrollPosition,
                        behavior: 'smooth'
                    });

                    // Update URL without jumping
                    history.pushState(null, null, targetId);

                    // Set focus for accessibility
                    targetElement.setAttribute('tabindex', '-1');
                    targetElement.focus();
                }
            });
        });
    }
};

// ============================================
// Sticky Header
// ============================================
const StickyHeader = {
    header: null,
    lastScrollY: 0,
    isHidden: false,

    init() {
        this.header = document.querySelector('.site-header');
        if (!this.header) return;

        window.addEventListener('scroll', debounce(() => this.handleScroll(), 10));
    },

    handleScroll() {
        const currentScrollY = window.scrollY;

        // Add shadow when scrolled
        if (currentScrollY > 10) {
            this.header.classList.add('scrolled');
        } else {
            this.header.classList.remove('scrolled');
        }

        // Optional: Hide header on scroll down, show on scroll up
        // Uncomment if you want this behavior
        /*
        if (currentScrollY > this.lastScrollY && currentScrollY > 200) {
            if (!this.isHidden) {
                this.header.style.transform = 'translateY(-100%)';
                this.isHidden = true;
            }
        } else {
            if (this.isHidden) {
                this.header.style.transform = 'translateY(0)';
                this.isHidden = false;
            }
        }
        this.lastScrollY = currentScrollY;
        */
    }
};

// ============================================
// Scroll Animations (Intersection Observer)
// ============================================
const ScrollAnimations = {
    init() {
        // Check if IntersectionObserver is supported
        if (!('IntersectionObserver' in window)) return;

        const animatedElements = document.querySelectorAll('[data-animate]');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const animation = entry.target.dataset.animate || 'fadeInUp';
                    entry.target.classList.add(`animate-${animation}`);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        animatedElements.forEach(el => observer.observe(el));
    }
};

// ============================================
// Form Helpers
// ============================================
const FormHelpers = {
    init() {
        // Auto-resize textareas
        document.querySelectorAll('textarea[data-auto-resize]').forEach(textarea => {
            textarea.addEventListener('input', () => {
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
            });
        });

        // Form validation feedback
        document.querySelectorAll('form[data-validate]').forEach(form => {
            form.addEventListener('submit', (e) => this.validateForm(e, form));
        });

        // Real-time validation
        document.querySelectorAll('[data-validate-field]').forEach(field => {
            field.addEventListener('blur', () => this.validateField(field));
        });
    },

    validateForm(e, form) {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        if (!isValid) {
            e.preventDefault();
            // Focus first invalid field
            const firstInvalid = form.querySelector('.is-invalid');
            if (firstInvalid) firstInvalid.focus();
        }
    },

    validateField(field) {
        const value = field.value.trim();
        const type = field.type;
        let isValid = true;
        let errorMessage = '';

        // Required check
        if (field.required && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }

        // Email validation
        if (type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
        }

        // Phone validation
        if (type === 'tel' && value) {
            const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
            if (!phoneRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid phone number';
            }
        }

        // Update field state
        this.setFieldState(field, isValid, errorMessage);

        return isValid;
    },

    setFieldState(field, isValid, errorMessage) {
        const formGroup = field.closest('.form-group');
        const errorElement = formGroup?.querySelector('.form-error');

        if (isValid) {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
            if (errorElement) errorElement.textContent = '';
        } else {
            field.classList.remove('is-valid');
            field.classList.add('is-invalid');
            if (errorElement) errorElement.textContent = errorMessage;
        }
    }
};

// ============================================
// Accessibility Helpers
// ============================================
const A11yHelpers = {
    init() {
        // Add skip link functionality
        const skipLink = document.querySelector('.skip-link');
        if (skipLink) {
            skipLink.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(skipLink.getAttribute('href'));
                if (target) {
                    target.setAttribute('tabindex', '-1');
                    target.focus();
                }
            });
        }

        // Announce dynamic content to screen readers
        this.createLiveRegion();

        // Handle reduced motion preference
        this.handleReducedMotion();
    },

    createLiveRegion() {
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.classList.add('sr-only');
        liveRegion.id = 'live-region';
        document.body.appendChild(liveRegion);
    },

    announce(message) {
        const liveRegion = document.getElementById('live-region');
        if (liveRegion) {
            liveRegion.textContent = message;
            // Clear after announcement
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        }
    },

    handleReducedMotion() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

        const updateMotionPreference = () => {
            if (prefersReducedMotion.matches) {
                document.documentElement.classList.add('reduced-motion');
            } else {
                document.documentElement.classList.remove('reduced-motion');
            }
        };

        updateMotionPreference();
        prefersReducedMotion.addEventListener('change', updateMotionPreference);
    }
};

// ============================================
// Back to Top Button
// ============================================
const BackToTop = {
    button: null,

    init() {
        this.button = document.querySelector('.back-to-top');
        if (!this.button) return;

        window.addEventListener('scroll', debounce(() => this.toggleVisibility()));
        this.button.addEventListener('click', () => this.scrollToTop());
    },

    toggleVisibility() {
        if (window.scrollY > 500) {
            this.button.classList.add('visible');
        } else {
            this.button.classList.remove('visible');
        }
    },

    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
};

// ============================================
// Image Lazy Loading
// ============================================
const LazyLoad = {
    init() {
        if ('loading' in HTMLImageElement.prototype) {
            // Browser supports native lazy loading
            document.querySelectorAll('img[data-src]').forEach(img => {
                img.src = img.dataset.src;
                img.loading = 'lazy';
            });
        } else {
            // Fallback for older browsers
            this.useFallback();
        }
    },

    useFallback() {
        const images = document.querySelectorAll('img[data-src]');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px'
        });

        images.forEach(img => observer.observe(img));
    }
};

// ============================================
// Initialize Everything
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Core functionality
    MobileNav.init();
    DesktopNav.init();
    SmoothScroll.init();
    StickyHeader.init();

    // Enhancements
    ScrollAnimations.init();
    FormHelpers.init();
    A11yHelpers.init();
    BackToTop.init();
    LazyLoad.init();

    // Mark page as loaded for CSS transitions
    document.body.classList.add('page-loaded');

    console.log('Delmar Nazarene Church website initialized');
});

// ============================================
// Export for potential module usage
// ============================================
// Uncomment if using ES modules
// export { MobileNav, DesktopNav, SmoothScroll, A11yHelpers };
