
document.addEventListener("DOMContentLoaded", () => {


    window.addEventListener('load', () => {
        const loader = document.getElementById('loader');
        // Adding a tiny delay so the animation is visible briefly
        setTimeout(() => {
            loader.classList.add('hidden');
        }, 2000);
    });


    // 2. Scroll Progress Monitoring Bar
    const progressBar = document.getElementById("scroll-progress");
    if (progressBar) {
        window.addEventListener("scroll", () => {
            const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (windowHeight > 0) {
                const scrolled = (window.scrollY / windowHeight) * 100;
                progressBar.style.width = `${scrolled}%`;
            }
        });
    }

    // 3. Scroll Intersection Reveal Logic
    const revealElements = document.querySelectorAll(".reveal");
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active");
                revealObserver.unobserve(entry.target); // Trigger only once
            }
        });
    }, {
        threshold: 0.08,
        rootMargin: "0px 0px -40px 0px"
    });

    revealElements.forEach(el => revealObserver.observe(el));

    // Dynamic current year generator
    const yearEl = document.getElementById("year");
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }
});