// Firebase Data Loading for Public Pages
// This file contains functions to load data from Firebase Firestore

// Wait for Firebase to be initialized
document.addEventListener('DOMContentLoaded', () => {
    // Check if Firebase is available
    if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
        loadFirebaseData();
    }
});

async function loadFirebaseData() {
    try {
        // Load statistics
        await loadStatistics();

        // Load services (if on services page)
        if (document.getElementById('servicesTableBody') || document.querySelector('.services-detailed')) {
            await loadServicesData();
        }

        // Load packages (if on services page)
        if (document.querySelector('.packages-grid')) {
            await loadPackagesData();
        }

        // Load about sections (if on home page)
        if (document.querySelector('.about-content')) {
            await loadAboutData();
        }
    } catch (error) {
        console.error('Error loading Firebase data:', error);
    }
}

// Load Statistics
async function loadStatistics() {
    try {
        const snapshot = await db.collection('statistics').orderBy('order').get();

        if (snapshot.empty) return;

        const statsContainer = document.querySelector('.about-stats');
        if (!statsContainer) return;

        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const displayValue = data.value + (data.suffix || '');

            html += `
                <div class="stat">
                    <h3>${displayValue}</h3>
                    <p>${data.label}</p>
                </div>
            `;
        });

        statsContainer.innerHTML = html;

        // Re-initialize counter animations
        const stats = document.querySelectorAll('.stat');
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const statNumber = entry.target.querySelector('h3');
                    const text = statNumber.textContent;
                    const targetNumber = parseInt(text.replace(/[^0-9]/g, ''));
                    if (!isNaN(targetNumber)) {
                        animateCounter(statNumber, targetNumber);
                    }
                    statsObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        stats.forEach(stat => statsObserver.observe(stat));
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// Load Services Data
async function loadServicesData() {
    try {
        const snapshot = await db.collection('services')
            .orderBy('category')
            .orderBy('order')
            .get();

        if (snapshot.empty) return;

        // Group services by category
        const servicesByCategory = {};
        snapshot.forEach(doc => {
            const data = doc.data();
            if (!servicesByCategory[data.category]) {
                servicesByCategory[data.category] = [];
            }
            servicesByCategory[data.category].push(data);
        });

        // Render services by category sections
        Object.keys(servicesByCategory).forEach(category => {
            const section = document.getElementById(category);
            if (!section) return;

            const servicesContainer = section.querySelector('.services-detailed');
            if (!servicesContainer) return;

            let html = '';
            servicesByCategory[category].forEach(service => {
                const featuresHtml = service.features
                    ? service.features.map(f => `<li><i class="fas fa-check"></i> ${f}</li>`).join('')
                    : '';

                html += `
                    <div class="service-detail">
                        <div class="service-content">
                            <div class="service-icon">
                                <i class="fas ${service.icon}"></i>
                            </div>
                            <h3>${service.title}</h3>
                            <p>${service.description}</p>
                            ${featuresHtml ? `<ul class="service-features">${featuresHtml}</ul>` : ''}
                            ${service.pricing ? `
                                <div class="service-pricing">
                                    <span class="price">${service.pricing}</span>
                                    <a href="#contact" class="btn btn-primary">Get Quote</a>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            });

            servicesContainer.innerHTML = html;
        });
    } catch (error) {
        console.error('Error loading services:', error);
    }
}

// Load Packages Data
async function loadPackagesData() {
    try {
        const snapshot = await db.collection('packages').orderBy('order').get();

        if (snapshot.empty) return;

        const packagesGrid = document.querySelector('.packages-grid');
        if (!packagesGrid) return;

        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const periodText = {
                'month': '/month',
                'quarter': '/quarter',
                'year': '/year',
                'one-time': 'one-time'
            }[data.period] || '';

            const featuresHtml = data.features
                ? data.features.map(f => `<li><i class="fas fa-check"></i> ${f}</li>`).join('')
                : '';

            html += `
                <div class="package-card ${data.featured ? 'featured' : ''}">
                    ${data.featured ? '<div class="package-ribbon">Most Popular</div>' : ''}
                    <div class="package-header">
                        <h3>${data.name}</h3>
                        <div class="package-price">
                            <span class="currency">$</span>
                            <span class="amount">${data.price}</span>
                            <span class="period">${periodText}</span>
                        </div>
                    </div>
                    ${data.description ? `<p class="package-description">${data.description}</p>` : ''}
                    <div class="package-features">
                        <ul>${featuresHtml}</ul>
                    </div>
                    <a href="#contact" class="btn btn-package">${data.buttonText || 'Choose Package'}</a>
                </div>
            `;
        });

        packagesGrid.innerHTML = html;
    } catch (error) {
        console.error('Error loading packages:', error);
    }
}

// Load About Data
async function loadAboutData() {
    try {
        const snapshot = await db.collection('about').orderBy('order').get();

        if (snapshot.empty) return;

        snapshot.forEach(doc => {
            const data = doc.data();

            // Update content based on section type
            switch(data.sectionType) {
                case 'main':
                    const aboutText = document.querySelector('.about-text');
                    if (aboutText) {
                        aboutText.innerHTML = `<p>${data.content}</p>`;
                    }
                    break;

                case 'vision':
                    const visionCard = document.querySelector('.vm-card:first-child');
                    if (visionCard) {
                        visionCard.innerHTML = `
                            <h3><i class="fas ${data.icon || 'fa-eye'}"></i> ${data.title}</h3>
                            <p>${data.content}</p>
                        `;
                    }
                    break;

                case 'mission':
                    const missionCard = document.querySelector('.vm-card:last-child');
                    if (missionCard) {
                        missionCard.innerHTML = `
                            <h3><i class="fas ${data.icon || 'fa-bullseye'}"></i> ${data.title}</h3>
                            <p>${data.content}</p>
                        `;
                    }
                    break;

                case 'approach':
                    const approachText = document.querySelector('.approach-text');
                    if (approachText) {
                        const h2 = approachText.querySelector('h2');
                        const features = approachText.querySelector('.approach-features');
                        approachText.innerHTML = `
                            ${h2 ? h2.outerHTML : '<h2>' + data.title + '</h2>'}
                            <p>${data.content}</p>
                            ${features ? features.outerHTML : ''}
                        `;
                    }
                    break;
            }
        });
    } catch (error) {
        console.error('Error loading about data:', error);
    }
}

// Counter animation function (if not already defined)
if (typeof animateCounter !== 'function') {
    function animateCounter(element, target, duration = 2000) {
        let start = 0;
        const suffix = element.textContent.replace(/[0-9]/g, '');
        const increment = target / (duration / 16);

        const timer = setInterval(() => {
            start += increment;
            element.textContent = Math.floor(start) + suffix;

            if (start >= target) {
                element.textContent = target + suffix;
                clearInterval(timer);
            }
        }, 16);
    }
}
