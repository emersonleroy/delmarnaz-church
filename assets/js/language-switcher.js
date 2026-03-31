/**
 * Delmar Nazarene Church - Language Switcher
 * ==========================================
 *
 * Handles language switching between English (/en/, /pages/),
 * Haitian Creole (/ht/), and French (/fr/).
 *
 * URL mapping logic:
 *   EN homepage  : /en/                        → /ht/  or /fr/
 *   EN sub-pages : /pages/about/staff.html     → /ht/pages/about/staff.html
 *   HT sub-pages : /ht/pages/about/staff.html  → /pages/about/staff.html
 *   FR sub-pages : /fr/pages/about/staff.html  → /ht/pages/about/staff.html
 */

'use strict';

const LanguageSwitcher = {
    // Configuration
    config: {
        // Available languages with their properties
        languages: {
            en: {
                code: 'en',
                name: 'English',
                nativeName: 'English',
                dir: 'ltr',
                enabled: true,
                path: '/en/'
            },
            ht: {
                code: 'ht',
                name: 'Haitian Creole',
                nativeName: 'Kreyòl Ayisyen',
                dir: 'ltr',
                enabled: true,
                path: '/ht/'
            },
            fr: {
                code: 'fr',
                name: 'French',
                nativeName: 'Français',
                dir: 'ltr',
                enabled: true,
                path: '/fr/'
            }
        },
        defaultLanguage: 'en',
        storageKey: 'delmar-preferred-language'
    },

    // Current language state
    currentLanguage: 'en',

    /**
     * Initialize the language switcher
     */
    init() {
        // Get stored preference or detect from URL/browser
        this.currentLanguage = this.detectCurrentLanguage();

        // Set up language switcher buttons
        this.setupButtons();

        // Store the current language preference
        this.storePreference(this.currentLanguage);

        // Set document language attribute
        this.updateDocumentLanguage();

        console.log(`Language Switcher initialized. Current language: ${this.currentLanguage}`);
    },

    /**
     * Detect the current language from URL or stored preference
     * @returns {string} - The detected language code
     */
    detectCurrentLanguage() {
        // First, check URL path
        const pathMatch = window.location.pathname.match(/^\/(en|ht|fr)\//);
        if (pathMatch && this.config.languages[pathMatch[1]]) {
            return pathMatch[1];
        }

        // Then check stored preference
        const stored = localStorage.getItem(this.config.storageKey);
        if (stored && this.config.languages[stored]) {
            return stored;
        }

        // Finally, try to detect from browser
        return this.detectBrowserLanguage();
    },

    /**
     * Detect language from browser settings
     * @returns {string} - The detected language code or default
     */
    detectBrowserLanguage() {
        const browserLangs = navigator.languages || [navigator.language || navigator.userLanguage];

        for (const lang of browserLangs) {
            const primaryLang = lang.split('-')[0].toLowerCase();

            // Special handling for Haitian Creole
            if (lang.toLowerCase().includes('ht') || lang.toLowerCase().includes('haitian')) {
                if (this.config.languages.ht.enabled) {
                    return 'ht';
                }
            }

            // Check if we support and have enabled this language
            if (this.config.languages[primaryLang]?.enabled) {
                return primaryLang;
            }
        }

        return this.config.defaultLanguage;
    },

    /**
     * Set up click handlers for language buttons
     */
    setupButtons() {
        const buttons = document.querySelectorAll('.lang-btn');

        buttons.forEach(button => {
            const langCode = button.dataset.lang;

            if (!langCode) return;

            const langConfig = this.config.languages[langCode];

            // Update button state
            if (langConfig) {
                // Mark active language
                if (langCode === this.currentLanguage) {
                    button.classList.add('active');
                    button.setAttribute('aria-current', 'true');
                } else {
                    button.classList.remove('active');
                    button.removeAttribute('aria-current');
                }

                // Handle disabled languages
                if (!langConfig.enabled) {
                    button.classList.add('disabled');
                    button.setAttribute('aria-disabled', 'true');
                    button.setAttribute('title', `${langConfig.name} - Coming Soon`);
                } else {
                    button.classList.remove('disabled');
                    button.removeAttribute('aria-disabled');
                    button.setAttribute('title', langConfig.nativeName);
                }
            }

            // Add click handler
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLanguageChange(langCode);
            });
        });
    },

    /**
     * Handle language change request
     * @param {string} langCode - The language code to switch to
     */
    handleLanguageChange(langCode) {
        const langConfig = this.config.languages[langCode];

        // Check if language exists and is enabled
        if (!langConfig) {
            console.warn(`Language "${langCode}" not found`);
            return;
        }

        if (!langConfig.enabled) {
            // Show coming soon message for disabled languages
            this.showComingSoonMessage(langConfig);
            return;
        }

        // Don't do anything if already on this language
        if (langCode === this.currentLanguage) {
            return;
        }

        // Switch language
        this.switchLanguage(langCode);
    },

    /**
     * Switch to a new language, preserving the equivalent page.
     *
     * URL structure:
     *   English homepage  → /en/
     *   English sub-pages → /pages/about/staff.html   (no /en/ prefix)
     *   HT/FR homepage    → /ht/  or  /fr/
     *   HT/FR sub-pages   → /ht/pages/...  or  /fr/pages/...
     *
     * @param {string} langCode - The language code to switch to
     */
    switchLanguage(langCode) {
        this.storePreference(langCode);

        const currentPath = window.location.pathname;

        // Case 1: currently on /ht/... or /fr/... (language-prefixed)
        const htFrMatch = currentPath.match(/^\/(ht|fr)(\/.*)?$/);

        // Case 2: currently on /en/ homepage
        const enHomeMatch = /^\/en\/?(?:index\.html)?$/.test(currentPath);

        // Determine the language-agnostic page path
        let pagePath;
        if (htFrMatch) {
            // Strip /ht or /fr prefix → e.g. /pages/about/staff.html or /
            pagePath = htFrMatch[2] || '/';
        } else if (enHomeMatch) {
            pagePath = '/';
        } else {
            // English sub-page with no language prefix → /pages/about/staff.html
            pagePath = currentPath;
        }

        // Normalise bare index
        if (pagePath === '/index.html') pagePath = '/';

        // Build the target URL
        let newPath;
        if (pagePath === '/') {
            // Homepage for any language
            newPath = '/' + langCode + '/';
        } else if (langCode === 'en') {
            // English sub-pages live directly at /pages/... (no /en/ prefix)
            newPath = pagePath;
        } else {
            // HT / FR sub-pages live at /ht/pages/... or /fr/pages/...
            newPath = '/' + langCode + pagePath;
        }

        window.location.href = newPath;
    },

    /**
     * Store language preference in localStorage
     * @param {string} langCode - The language code to store
     */
    storePreference(langCode) {
        try {
            localStorage.setItem(this.config.storageKey, langCode);
        } catch (e) {
            console.warn('Could not store language preference:', e);
        }
    },

    /**
     * Get stored language preference
     * @returns {string|null} - The stored language code or null
     */
    getStoredPreference() {
        try {
            return localStorage.getItem(this.config.storageKey);
        } catch (e) {
            console.warn('Could not retrieve language preference:', e);
            return null;
        }
    },

    /**
     * Update document language attribute and direction
     */
    updateDocumentLanguage() {
        const langConfig = this.config.languages[this.currentLanguage];

        if (langConfig) {
            document.documentElement.lang = langConfig.code;
            document.documentElement.dir = langConfig.dir;
        }
    },

    /**
     * Show coming soon message for disabled languages
     * @param {Object} langConfig - The language configuration object
     */
    showComingSoonMessage(langConfig) {
        // Create and show a toast notification
        const toast = document.createElement('div');
        toast.className = 'language-toast';
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="toast-content">
                <strong>${langConfig.nativeName}</strong>
                <p>Coming soon! / Byento! / Bientôt!</p>
            </div>
        `;

        // Add toast styles if not already present
        if (!document.getElementById('toast-styles')) {
            const styles = document.createElement('style');
            styles.id = 'toast-styles';
            styles.textContent = `
                .language-toast {
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%) translateY(100px);
                    background: #1e3a5f;
                    color: white;
                    padding: 1rem 1.5rem;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                    z-index: 10000;
                    opacity: 0;
                    transition: all 0.3s ease;
                }
                .language-toast.visible {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                }
                .toast-content strong {
                    display: block;
                    font-size: 1rem;
                    margin-bottom: 0.25rem;
                }
                .toast-content p {
                    margin: 0;
                    font-size: 0.875rem;
                    opacity: 0.9;
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('visible');
        });

        // Remove after delay
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    },

    /**
     * Get translation for a key (for future use with JS-based translations)
     * @param {string} key - The translation key
     * @param {Object} params - Optional parameters for interpolation
     * @returns {string} - The translated string
     */
    translate(key, params = {}) {
        // This will be expanded in Phase 2/3 to support actual translations
        // For now, it just returns the key
        console.warn('Translation system not yet implemented. Key:', key);
        return key;
    },

    /**
     * Get current language configuration
     * @returns {Object} - The current language config
     */
    getCurrentLanguageConfig() {
        return this.config.languages[this.currentLanguage];
    },

    /**
     * Check if a language is enabled
     * @param {string} langCode - The language code to check
     * @returns {boolean} - Whether the language is enabled
     */
    isLanguageEnabled(langCode) {
        return this.config.languages[langCode]?.enabled || false;
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    LanguageSwitcher.init();
});

// Make available globally for potential use in other scripts
window.LanguageSwitcher = LanguageSwitcher;
