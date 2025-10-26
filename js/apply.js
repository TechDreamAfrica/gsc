// Application Form Management

let currentStep = 1;
let selectedService = null;
let formData = {};

// Service-specific form fields configuration
const serviceFields = {
    'Business Registration': [
        { name: 'businessName', label: 'Business Name', type: 'text', required: true },
        { name: 'businessType', label: 'Business Type', type: 'select', required: true, options: ['Sole Proprietorship', 'Partnership', 'Limited Liability Company', 'Other'] },
        { name: 'natureOfBusiness', label: 'Nature of Business', type: 'textarea', required: true },
        { name: 'numberOfPartners', label: 'Number of Partners/Directors', type: 'number', required: false }
    ],
    'Passport Application': [
        { name: 'passportType', label: 'Passport Type', type: 'select', required: true, options: ['New Passport', 'Renewal', 'Replacement'] },
        { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
        { name: 'placeOfBirth', label: 'Place of Birth', type: 'text', required: true },
        { name: 'nationality', label: 'Nationality', type: 'text', required: true, value: 'Ghanaian' },
        { name: 'idCardNumber', label: 'Ghana Card Number', type: 'text', required: true }
    ],
    'FDA Certification': [
        { name: 'productName', label: 'Product Name', type: 'text', required: true },
        { name: 'productCategory', label: 'Product Category', type: 'select', required: true, options: ['Food', 'Beverage', 'Cosmetics', 'Medical Device', 'Other'] },
        { name: 'manufacturerName', label: 'Manufacturer Name', type: 'text', required: true },
        { name: 'certificationPurpose', label: 'Purpose of Certification', type: 'textarea', required: true }
    ],
    'Accounting Services': [
        { name: 'companyName', label: 'Company Name', type: 'text', required: true },
        { name: 'serviceType', label: 'Service Type', type: 'select', required: true, options: ['Bookkeeping', 'Tax Preparation', 'Payroll Management', 'Financial Audit', 'Financial Planning'] },
        { name: 'businessSize', label: 'Business Size', type: 'select', required: true, options: ['Small (1-10 employees)', 'Medium (11-50 employees)', 'Large (50+ employees)'] },
        { name: 'startDate', label: 'Preferred Start Date', type: 'date', required: false }
    ],
    'HR Services': [
        { name: 'companyName', label: 'Company Name', type: 'text', required: true },
        { name: 'hrServiceType', label: 'HR Service Needed', type: 'select', required: true, options: ['Recruitment', 'Employee Training', 'HR Policies Development', 'Performance Management', 'Other'] },
        { name: 'numberOfEmployees', label: 'Current Number of Employees', type: 'number', required: true },
        { name: 'urgency', label: 'Urgency Level', type: 'select', required: true, options: ['Urgent (Within 1 week)', 'Soon (1-2 weeks)', 'Flexible (More than 2 weeks)'] }
    ],
    'default': [
        { name: 'serviceDetails', label: 'Please describe your requirements', type: 'textarea', required: true }
    ]
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    loadAvailableServices();
});

// Load services from Firebase
async function loadAvailableServices() {
    const servicesGrid = document.getElementById('servicesGrid');

    try {
        // Check if Firebase is available
        if (typeof db === 'undefined') {
            // If Firebase not configured, load default services
            loadDefaultServices();
            return;
        }

        const snapshot = await db.collection('services')
            .where('featured', '==', true)
            .orderBy('category')
            .orderBy('order')
            .get();

        if (snapshot.empty) {
            loadDefaultServices();
            return;
        }

        let html = '';
        snapshot.forEach(doc => {
            const service = doc.data();
            html += createServiceCard(service);
        });

        servicesGrid.innerHTML = html;

        // Add click handlers
        document.querySelectorAll('.service-selection-card').forEach(card => {
            card.addEventListener('click', () => selectService(card));
        });

    } catch (error) {
        console.error('Error loading services:', error);
        loadDefaultServices();
    }
}

// Load default services if Firebase not available
function loadDefaultServices() {
    const servicesGrid = document.getElementById('servicesGrid');
    const defaultServices = [
        { title: 'Business Registration', icon: 'fa-building', description: 'Register your business with ORC and obtain necessary certifications', pricing: 'Starting from GHS 500' },
        { title: 'Passport Application', icon: 'fa-passport', description: 'Assistance with Ghana passport application and processing', pricing: 'Contact for pricing' },
        { title: 'FDA Certification', icon: 'fa-certificate', description: 'Food and Drugs Authority certification assistance', pricing: 'Starting from GHS 800' },
        { title: 'Accounting Services', icon: 'fa-calculator', description: 'Professional bookkeeping, tax preparation, and financial services', pricing: 'Starting from GHS 400/month' },
        { title: 'HR Services', icon: 'fa-users', description: 'Recruitment, training, and human resource management', pricing: 'Starting from GHS 800' },
        { title: 'EPA Certification', icon: 'fa-leaf', description: 'Environmental Protection Agency certification support', pricing: 'Contact for pricing' },
        { title: 'Marketing Services', icon: 'fa-bullhorn', description: 'Market research, promotion, and advertising services', pricing: 'Starting from GHS 600' },
        { title: 'Legal Documentation', icon: 'fa-file-contract', description: 'Contract drafting, affidavits, and legal document support', pricing: 'Starting from GHS 150' }
    ];

    let html = '';
    defaultServices.forEach(service => {
        html += createServiceCard(service);
    });

    servicesGrid.innerHTML = html;

    // Add click handlers
    document.querySelectorAll('.service-selection-card').forEach(card => {
        card.addEventListener('click', () => selectService(card));
    });
}

// Create service card HTML
function createServiceCard(service) {
    return `
        <div class="service-selection-card" data-service="${service.title}">
            <div class="service-icon">
                <i class="fas ${service.icon}"></i>
            </div>
            <h3>${service.title}</h3>
            <p>${service.description}</p>
            <div class="service-price">${service.pricing || 'Contact for pricing'}</div>
        </div>
    `;
}

// Select a service
function selectService(card) {
    // Remove previous selection
    document.querySelectorAll('.service-selection-card').forEach(c => c.classList.remove('selected'));

    // Add selection to clicked card
    card.classList.add('selected');

    // Store selected service
    selectedService = {
        title: card.dataset.service,
        description: card.querySelector('p').textContent
    };

    // Move to next step after short delay
    setTimeout(() => {
        goToStep(2);
        loadServiceSpecificFields();
    }, 300);
}

// Load service-specific fields
function loadServiceSpecificFields() {
    const container = document.getElementById('serviceSpecificFields');
    const fields = serviceFields[selectedService.title] || serviceFields['default'];

    document.getElementById('selectedServiceTitle').textContent = `Application for ${selectedService.title}`;
    document.getElementById('selectedServiceDescription').textContent = selectedService.description;

    let html = '<div class="form-section"><h3><i class="fas fa-file-alt"></i> Service-Specific Information</h3>';

    fields.forEach(field => {
        html += '<div class="form-group">';
        html += `<label for="${field.name}">${field.label} ${field.required ? '*' : ''}</label>`;

        if (field.type === 'select') {
            html += `<select id="${field.name}" ${field.required ? 'required' : ''}>`;
            html += '<option value="">Select an option</option>';
            field.options.forEach(option => {
                html += `<option value="${option}">${option}</option>`;
            });
            html += '</select>';
        } else if (field.type === 'textarea') {
            html += `<textarea id="${field.name}" rows="3" ${field.required ? 'required' : ''}></textarea>`;
        } else {
            html += `<input type="${field.type}" id="${field.name}" ${field.required ? 'required' : ''} ${field.value ? `value="${field.value}"` : ''}>`;
        }

        html += '</div>';
    });

    html += '</div>';
    container.innerHTML = html;
}

// Go to specific step
function goToStep(step) {
    // Validate current step before moving forward
    if (step > currentStep) {
        if (step === 2 && !selectedService) {
            alert('Please select a service first');
            return;
        }

        if (step === 3) {
            if (!validateForm()) {
                return;
            }
            populateReview();
        }
    }

    // Hide all steps
    document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));

    // Show target step
    document.getElementById(`step${step}`).classList.add('active');

    // Update step indicators
    document.querySelectorAll('.step-number').forEach((num, index) => {
        num.classList.remove('active', 'completed');
        if (index + 1 < step) {
            num.classList.add('completed');
            num.innerHTML = '<i class="fas fa-check"></i>';
        } else if (index + 1 === step) {
            num.classList.add('active');
            num.textContent = index + 1;
        } else {
            num.textContent = index + 1;
        }
    });

    currentStep = step;

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Validate form
function validateForm() {
    const form = document.getElementById('applicationForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return false;
    }

    // Collect form data
    formData = {
        service: selectedService.title,
        fullName: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        altPhone: document.getElementById('altPhone').value,
        address: document.getElementById('address').value,
        additionalNotes: document.getElementById('additionalNotes').value,
        serviceSpecific: {}
    };

    // Collect service-specific fields
    const fields = serviceFields[selectedService.title] || serviceFields['default'];
    fields.forEach(field => {
        const element = document.getElementById(field.name);
        if (element) {
            formData.serviceSpecific[field.name] = element.value;
        }
    });

    return true;
}

// Populate review section
function populateReview() {
    document.getElementById('reviewService').textContent = formData.service;
    document.getElementById('reviewName').textContent = formData.fullName;
    document.getElementById('reviewEmail').textContent = formData.email;
    document.getElementById('reviewPhone').textContent = formData.phone;
    document.getElementById('reviewAddress').textContent = formData.address;

    // Service-specific fields
    const container = document.getElementById('reviewServiceFields');
    const fields = serviceFields[selectedService.title] || serviceFields['default'];

    let html = '<div class="review-section"><h3>Service Details</h3><div class="review-grid">';

    fields.forEach(field => {
        const value = formData.serviceSpecific[field.name];
        if (value) {
            html += `<div><strong>${field.label}:</strong> <span>${value}</span></div>`;
        }
    });

    html += '</div></div>';
    container.innerHTML = html;

    // Additional notes
    if (formData.additionalNotes) {
        document.getElementById('reviewNotesSection').style.display = 'block';
        document.getElementById('reviewNotes').textContent = formData.additionalNotes;
    } else {
        document.getElementById('reviewNotesSection').style.display = 'none';
    }
}

// Submit application
async function submitApplication() {
    const agreeTerms = document.getElementById('agreeTerms');
    if (!agreeTerms.checked) {
        alert('Please agree to the terms and conditions');
        return;
    }

    try {
        // Generate reference number
        const refNumber = 'GSC-' + Date.now().toString(36).toUpperCase();

        // Prepare application data
        const applicationData = {
            ...formData,
            referenceNumber: refNumber,
            status: 'pending',
            submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdAt: new Date().toISOString()
        };

        // Save to Firebase
        if (typeof db !== 'undefined') {
            await db.collection('applications').add(applicationData);
        } else {
            // If Firebase not available, just log to console
            console.log('Application submitted:', applicationData);
        }

        // Show success message
        document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
        document.getElementById('successMessage').style.display = 'block';
        document.getElementById('applicationRef').textContent = refNumber;

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
        console.error('Error submitting application:', error);
        alert('There was an error submitting your application. Please try again or contact us directly.');
    }
}
