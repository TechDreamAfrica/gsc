// Services Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Category filtering functionality
    const categoryCards = document.querySelectorAll('.category-card');
    const serviceSections = document.querySelectorAll('.service-section');

    categoryCards.forEach(card => {
        card.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            
            // Remove active class from all cards
            categoryCards.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked card
            this.classList.add('active');
            
            // Smooth scroll to the corresponding section
            const targetSection = document.getElementById(category);
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const elementsToAnimate = document.querySelectorAll(
        '.service-detail, .package-card, .category-card'
    );
    
    elementsToAnimate.forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });

    // Package selection functionality
    const packageCards = document.querySelectorAll('.package-card');
    
    packageCards.forEach(card => {
        const button = card.querySelector('.btn-package');
        
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const packageName = card.querySelector('h3').textContent;
            const packagePrice = card.querySelector('.amount').textContent;
            
            // Create a more detailed contact message
            const message = `I'm interested in the ${packageName} (${packagePrice}/month). Please provide more details about this package and schedule a consultation.`;
            
            // Redirect to contact section with pre-filled message
            const contactUrl = `index.html#contact?package=${encodeURIComponent(packageName)}&message=${encodeURIComponent(message)}`;
            window.location.href = contactUrl;
        });
    });

    // Service quote buttons functionality
    const quoteButtons = document.querySelectorAll('.service-detail .btn-primary');
    
    quoteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const serviceCard = this.closest('.service-detail');
            const serviceName = serviceCard.querySelector('h3').textContent;
            const servicePrice = serviceCard.querySelector('.price').textContent;
            
            const message = `I would like to get a quote for ${serviceName}. The starting price mentioned is ${servicePrice}. Please provide a detailed quote based on my specific requirements.`;
            
            // Redirect to contact section
            const contactUrl = `index.html#contact?service=${encodeURIComponent(serviceName)}&message=${encodeURIComponent(message)}`;
            window.location.href = contactUrl;
        });
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Active section highlighting
    function updateActiveSection() {
        const sections = document.querySelectorAll('.service-section[id]');
        const categories = document.querySelectorAll('.category-card');
        
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 150;
            const sectionHeight = section.offsetHeight;
            
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });
        
        categories.forEach(category => {
            category.classList.remove('active');
            if (category.getAttribute('data-category') === current) {
                category.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', updateActiveSection);

    // Search functionality (if search input exists)
    const searchInput = document.querySelector('.service-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const serviceDetails = document.querySelectorAll('.service-detail');
            
            serviceDetails.forEach(service => {
                const title = service.querySelector('h3').textContent.toLowerCase();
                const description = service.querySelector('p').textContent.toLowerCase();
                const features = Array.from(service.querySelectorAll('.service-features li'))
                    .map(li => li.textContent.toLowerCase())
                    .join(' ');
                
                const searchContent = `${title} ${description} ${features}`;
                
                if (searchContent.includes(searchTerm)) {
                    service.style.display = 'block';
                    service.style.opacity = '1';
                } else {
                    service.style.display = 'none';
                    service.style.opacity = '0';
                }
            });
        });
    }

    // Price calculator (basic implementation)
    function createPriceCalculator() {
        const calculatorHTML = `
            <div class="price-calculator" id="price-calculator">
                <div class="calculator-content">
                    <h3>Service Price Calculator</h3>
                    <div class="calculator-form">
                        <div class="form-group">
                            <label>Business Size:</label>
                            <select id="business-size">
                                <option value="1">Small (1-10 employees)</option>
                                <option value="1.5">Medium (11-50 employees)</option>
                                <option value="2">Large (50+ employees)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Services Needed:</label>
                            <div class="checkbox-group">
                                <label><input type="checkbox" value="800" data-service="Bookkeeping"> Basic Bookkeeping ($800/month)</label>
                                <label><input type="checkbox" value="1200" data-service="Financial Statements"> Financial Statements ($1,200)</label>
                                <label><input type="checkbox" value="500" data-service="Payroll"> Payroll Management ($500/month)</label>
                                <label><input type="checkbox" value="2500" data-service="Strategy"> Business Strategy ($2,500)</label>
                            </div>
                        </div>
                        <div class="calculator-result">
                            <strong>Estimated Monthly Cost: $<span id="total-cost">0</span></strong>
                        </div>
                        <button type="button" class="btn btn-primary" onclick="requestQuote()">Request Detailed Quote</button>
                    </div>
                    <button class="calculator-close" onclick="closeCalculator()">&times;</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', calculatorHTML);
    }

    // Add calculator trigger button
    const calculatorTrigger = document.createElement('button');
    calculatorTrigger.className = 'calculator-trigger';
    calculatorTrigger.innerHTML = '<i class="fas fa-calculator"></i> Price Calculator';
    calculatorTrigger.style.cssText = `
        position: fixed;
        bottom: 100px;
        right: 30px;
        background: var(--gradient-primary);
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 25px;
        cursor: pointer;
        font-weight: 500;
        box-shadow: var(--shadow-medium);
        z-index: 1000;
        transition: all 0.3s ease;
    `;
    
    calculatorTrigger.addEventListener('click', () => {
        if (!document.getElementById('price-calculator')) {
            createPriceCalculator();
        }
        document.getElementById('price-calculator').style.display = 'flex';
    });
    
    document.body.appendChild(calculatorTrigger);

    // Testimonials slider (if testimonials section exists)
    const testimonialSlider = document.querySelector('.testimonials-slider');
    if (testimonialSlider) {
        let currentSlide = 0;
        const slides = testimonialSlider.querySelectorAll('.testimonial-slide');
        const totalSlides = slides.length;

        function showSlide(index) {
            slides.forEach((slide, i) => {
                slide.style.display = i === index ? 'block' : 'none';
            });
        }

        function nextSlide() {
            currentSlide = (currentSlide + 1) % totalSlides;
            showSlide(currentSlide);
        }

        function prevSlide() {
            currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
            showSlide(currentSlide);
        }

        // Auto-advance slides
        setInterval(nextSlide, 5000);

        // Navigation buttons
        const prevBtn = testimonialSlider.querySelector('.prev-btn');
        const nextBtn = testimonialSlider.querySelector('.next-btn');
        
        if (prevBtn) prevBtn.addEventListener('click', prevSlide);
        if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    }

    // FAQ accordion functionality
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all other FAQ items
            faqItems.forEach(otherItem => {
                otherItem.classList.remove('active');
                otherItem.querySelector('.faq-answer').style.maxHeight = '0';
            });
            
            // Toggle current item
            if (!isActive) {
                item.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });

    // Service comparison functionality
    const compareButtons = document.querySelectorAll('.compare-service');
    let comparisonList = [];

    compareButtons.forEach(button => {
        button.addEventListener('click', function() {
            const serviceCard = this.closest('.service-detail');
            const serviceName = serviceCard.querySelector('h3').textContent;
            
            if (comparisonList.includes(serviceName)) {
                comparisonList = comparisonList.filter(item => item !== serviceName);
                this.textContent = 'Add to Compare';
                this.classList.remove('comparing');
            } else if (comparisonList.length < 3) {
                comparisonList.push(serviceName);
                this.textContent = 'Remove from Compare';
                this.classList.add('comparing');
            } else {
                showNotification('You can only compare up to 3 services at a time.', 'info');
            }

            updateComparisonPanel();
        });
    });

    function updateComparisonPanel() {
        let panel = document.getElementById('comparison-panel');
        
        if (comparisonList.length === 0) {
            if (panel) panel.remove();
            return;
        }

        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'comparison-panel';
            panel.innerHTML = `
                <div class="comparison-content">
                    <h4>Service Comparison</h4>
                    <div class="comparison-list"></div>
                    <div class="comparison-actions">
                        <button class="btn btn-primary" onclick="viewComparison()">Compare Services</button>
                        <button class="btn btn-secondary" onclick="clearComparison()">Clear All</button>
                    </div>
                </div>
            `;
            panel.style.cssText = `
                position: fixed;
                bottom: 30px;
                left: 30px;
                background: white;
                padding: 1.5rem;
                border-radius: 12px;
                box-shadow: var(--shadow-heavy);
                z-index: 1000;
                max-width: 300px;
            `;
            document.body.appendChild(panel);
        }

        const list = panel.querySelector('.comparison-list');
        list.innerHTML = comparisonList.map(service => `
            <div class="comparison-item">
                <span>${service}</span>
                <button onclick="removeFromComparison('${service}')">&times;</button>
            </div>
        `).join('');
    }

    // Make functions global for onclick handlers
    window.closeCalculator = function() {
        const calculator = document.getElementById('price-calculator');
        if (calculator) calculator.style.display = 'none';
    };

    window.requestQuote = function() {
        const selectedServices = Array.from(document.querySelectorAll('#price-calculator input[type="checkbox"]:checked'))
            .map(cb => cb.getAttribute('data-service'));
        
        const message = `I would like a detailed quote for the following services: ${selectedServices.join(', ')}. Please contact me to discuss my specific requirements.`;
        
        window.location.href = `index.html#contact?message=${encodeURIComponent(message)}`;
    };

    window.removeFromComparison = function(serviceName) {
        comparisonList = comparisonList.filter(item => item !== serviceName);
        updateComparisonPanel();
        
        // Update button state
        const buttons = document.querySelectorAll('.compare-service');
        buttons.forEach(button => {
            const card = button.closest('.service-detail');
            const cardServiceName = card.querySelector('h3').textContent;
            if (cardServiceName === serviceName) {
                button.textContent = 'Add to Compare';
                button.classList.remove('comparing');
            }
        });
    };

    window.clearComparison = function() {
        comparisonList = [];
        updateComparisonPanel();
        
        document.querySelectorAll('.compare-service').forEach(button => {
            button.textContent = 'Add to Compare';
            button.classList.remove('comparing');
        });
    };

    window.viewComparison = function() {
        // Create comparison modal or redirect to comparison page
        showNotification('Comparison feature coming soon!', 'info');
    };

    // Price calculator functionality
    window.updatePriceCalculation = function() {
        const businessSizeMultiplier = parseFloat(document.getElementById('business-size').value);
        const selectedServices = Array.from(document.querySelectorAll('#price-calculator input[type="checkbox"]:checked'));
        
        let total = 0;
        selectedServices.forEach(service => {
            total += parseFloat(service.value);
        });
        
        total *= businessSizeMultiplier;
        document.getElementById('total-cost').textContent = total.toLocaleString();
    };

    // Add event listeners for price calculator when it's created
    document.addEventListener('change', function(e) {
        if (e.target.closest('#price-calculator')) {
            updatePriceCalculation();
        }
    });
});

// Notification system (reuse from main script if not already loaded)
function showNotification(message, type) {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        max-width: 400px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        ${type === 'success' ? 'background: #10b981;' : 
          type === 'error' ? 'background: #ef4444;' : 
          'background: #3b82f6;'}
    `;
    
    notification.querySelector('button').style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 1.2rem;
        margin-left: 1rem;
        cursor: pointer;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}
