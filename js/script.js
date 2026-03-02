/**
 * Vie Communities - Landing Page Interactions
 * Luxury Real Estate Developer
 */

/**
 * Loading Screen Module
 * Waits for all assets to load before revealing content
 */
const LoadingScreen = {
    screen: null,
    minLoadTime: 1500,
    startTime: Date.now(),

    init() {
        this.screen = document.getElementById('loadingScreen');
        if (!this.screen) return;

        // Wait for all assets to load
        window.addEventListener('load', () => this.handleLoaded());
    },

    handleLoaded() {
        const elapsed = Date.now() - this.startTime;
        const remainingTime = Math.max(0, this.minLoadTime - elapsed);

        // Ensure minimum display time for smooth UX
        setTimeout(() => {
            this.screen.classList.add('loaded');
        }, remainingTime);
    }
};

// Initialize loading screen immediately
LoadingScreen.init();

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all modules
    Navigation.init();
    ScrollAnimations.init();
    CounterAnimation.init();
    FormHandler.init();
    SmoothScroll.init();
    Modal.init();
});

/**
 * Navigation Module
 * Handles navbar scroll effects
 */
const Navigation = {
    navbar: null,
    scrollThreshold: 50,

    init() {
        this.navbar = document.querySelector('.navbar');
        if (!this.navbar) return;

        window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
        this.handleScroll(); // Initial check
    },

    handleScroll() {
        const isScrolled = window.scrollY > this.scrollThreshold;
        this.navbar.classList.toggle('scrolled', isScrolled);
    }
};

/**
 * Scroll Animations Module
 * Handles reveal animations on scroll
 */
const ScrollAnimations = {
    elements: [],
    observer: null,

    init() {
        this.elements = document.querySelectorAll('[data-animate]');
        if (this.elements.length === 0) return;

        const options = {
            root: null,
            rootMargin: '0px 0px -100px 0px',
            threshold: 0.1
        };

        this.observer = new IntersectionObserver(this.handleIntersection.bind(this), options);

        this.elements.forEach(element => {
            this.observer.observe(element);
        });
    },

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add staggered delay for cards
                const parent = entry.target.closest('.features-grid');
                if (parent) {
                    const cards = parent.querySelectorAll('.feature-card');
                    cards.forEach((card, index) => {
                        setTimeout(() => {
                            card.classList.add('animate');
                        }, index * 150);
                    });
                } else {
                    entry.target.classList.add('animate');
                }

                this.observer.unobserve(entry.target);
            }
        });
    }
};

/**
 * Counter Animation Module
 * Animates statistics numbers
 */
const CounterAnimation = {
    counters: [],
    observer: null,
    duration: 800,

    init() {
        this.counters = document.querySelectorAll('[data-count]');
        if (this.counters.length === 0) return;

        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.5
        };

        this.observer = new IntersectionObserver(this.handleIntersection.bind(this), options);

        this.counters.forEach(counter => {
            this.observer.observe(counter);
        });
    },

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.animateCounter(entry.target);
                this.observer.unobserve(entry.target);
            }
        });
    },

    animateCounter(element) {
        const target = parseInt(element.dataset.count, 10);
        const startTime = performance.now();

        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / this.duration, 1);

            // Easing function (ease-out cubic)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(easeOut * target);

            element.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target;
            }
        };

        requestAnimationFrame(updateCounter);
    }
};

/**
 * Form Handler Module
 * Handles form validation and submission
 */
const FormHandler = {
    form: null,
    submitBtn: null,

    init() {
        this.form = document.getElementById('leadForm');
        this.submitBtn = this.form?.querySelector('.submit-btn');

        if (!this.form) return;

        this.form.addEventListener('submit', this.handleSubmit.bind(this));

        // Add input event listeners for real-time validation feedback
        const inputs = this.form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('blur', this.validateField.bind(this));
            input.addEventListener('input', () => {
                if (input.classList.contains('error')) {
                    this.validateField({ target: input });
                }
            });
        });
    },

    validateField(event) {
        const field = event.target;
        const isValid = field.checkValidity();

        field.classList.toggle('error', !isValid && field.value !== '');
        return isValid;
    },

    validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    async handleSubmit(event) {
        event.preventDefault();

        // Validate all fields
        const inputs = this.form.querySelectorAll('input[required], select[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!input.checkValidity()) {
                input.classList.add('error');
                isValid = false;
            }
        });

        // Additional email validation
        const emailField = this.form.querySelector('#email');
        if (emailField && !this.validateEmail(emailField.value)) {
            emailField.classList.add('error');
            isValid = false;
        }

        if (!isValid) {
            this.shakeButton();
            return;
        }

        // Show loading state
        this.submitBtn.classList.add('loading');
        this.submitBtn.disabled = true;

        try {
            // Submit to Formspree
            await this.submitToFormspree();

            // Show success state
            this.submitBtn.classList.remove('loading');
            this.submitBtn.classList.add('success');

            // Show success modal
            setTimeout(() => {
                Modal.show();
                this.resetForm();
            }, 800);

        } catch (error) {
            console.error('Form submission error:', error);
            this.submitBtn.classList.remove('loading');
            this.submitBtn.disabled = false;
            this.showError('Something went wrong. Please try again.');
        }
    },

    async submitToFormspree() {
        const formData = new FormData(this.form);
        const response = await fetch('https://formspree.io/f/xlgwobgz', {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Form submission failed');
        }

        return response.json();
    },

    resetForm() {
        this.form.reset();
        this.submitBtn.classList.remove('loading', 'success');
        this.submitBtn.disabled = false;

        // Reset labels
        const labels = this.form.querySelectorAll('label');
        labels.forEach(label => {
            const input = document.getElementById(label.getAttribute('for'));
            if (input) {
                input.classList.remove('error');
            }
        });
    },

    shakeButton() {
        this.submitBtn.style.animation = 'shake 0.5s ease';
        setTimeout(() => {
            this.submitBtn.style.animation = '';
        }, 500);
    },

    showError(message) {
        // Could implement a toast notification here
        console.error(message);
    }
};

/**
 * Smooth Scroll Module
 * Handles smooth scrolling to sections
 */
const SmoothScroll = {
    init() {
        const scrollTriggers = document.querySelectorAll('[data-scroll-to]');

        scrollTriggers.forEach(trigger => {
            trigger.addEventListener('click', (event) => {
                event.preventDefault();
                const targetId = trigger.dataset.scrollTo;
                const targetElement = document.getElementById(targetId);

                if (targetElement) {
                    const headerOffset = 80;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.scrollY - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
};

/**
 * Modal Module
 * Handles success modal
 */
const Modal = {
    modal: null,
    closeBtn: null,
    confirmBtn: null,

    init() {
        this.modal = document.getElementById('successModal');
        this.closeBtn = document.getElementById('modalClose');
        this.confirmBtn = document.getElementById('modalBtn');

        if (!this.modal) return;

        this.closeBtn?.addEventListener('click', this.hide.bind(this));
        this.confirmBtn?.addEventListener('click', this.hide.bind(this));

        // Close on backdrop click
        this.modal.addEventListener('click', (event) => {
            if (event.target === this.modal) {
                this.hide();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.modal.classList.contains('active')) {
                this.hide();
            }
        });
    },

    show() {
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    hide() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
    }
};

/**
 * Add shake animation keyframes dynamically
 */
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-8px); }
        40% { transform: translateX(8px); }
        60% { transform: translateX(-4px); }
        80% { transform: translateX(4px); }
    }

    .form-group input.error,
    .form-group select.error {
        border-bottom-color: #c0392b;
    }

    .form-group input.error ~ .input-line,
    .form-group select.error ~ .input-line {
        background: #c0392b;
        width: 100%;
    }
`;
document.head.appendChild(style);

/**
 * Parallax effect for hero section (subtle)
 */
const ParallaxEffect = {
    heroContent: null,

    init() {
        this.heroContent = document.querySelector('.hero-content');
        if (!this.heroContent) return;

        // Only enable on desktop
        if (window.matchMedia('(min-width: 768px)').matches) {
            window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
        }
    },

    handleScroll() {
        const scrolled = window.scrollY;
        const heroHeight = window.innerHeight;

        if (scrolled < heroHeight) {
            const opacity = 1 - (scrolled / heroHeight) * 0.5;
            const translateY = scrolled * 0.3;

            this.heroContent.style.opacity = opacity;
            this.heroContent.style.transform = `translateY(${translateY}px)`;
        }
    }
};

// Initialize parallax after DOM loads
document.addEventListener('DOMContentLoaded', () => {
    ParallaxEffect.init();
    CustomCursor.init();
});

/**
 * Custom Cursor
 * Grey circle that expands on clickable elements
 */
const CustomCursor = {
    cursor: null,

    init() {
        if ('ontouchstart' in window) return;

        this.cursor = document.createElement('div');
        this.cursor.className = 'custom-cursor';
        document.body.appendChild(this.cursor);

        document.addEventListener('mousemove', (e) => {
            this.cursor.style.left = `${e.clientX}px`;
            this.cursor.style.top = `${e.clientY}px`;
            this.cursor.classList.add('visible');
        });

        document.addEventListener('mouseleave', () => {
            this.cursor.classList.remove('visible');
        });

        document.querySelectorAll('a, button, input, select, [data-scroll-to]').forEach(el => {
            el.addEventListener('mouseenter', () => this.cursor.classList.add('hover'));
            el.addEventListener('mouseleave', () => this.cursor.classList.remove('hover'));
        });
    }
};


