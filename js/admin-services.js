// Whitelist of authorized admin emails
const AUTHORIZED_EMAILS = ["globalsmileconsulting@gmail.com", "admin@globalsmileconsulting.com"];
function isAuthorizedEmail(email) { return AUTHORIZED_EMAILS.includes(email.toLowerCase().trim()); }

// Check authentication with email whitelist only
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'admin-login.html';
        return;
    }

    // Verify email is authorized (no admin claim check needed)
    if (!isAuthorizedEmail(user.email)) {
        await auth.signOut();
        alert('Unauthorized: This email is not authorized to access the admin panel');
        window.location.href = 'admin-login.html';
        return;
    }

    // User is authenticated and whitelisted - grant access
    document.getElementById('adminEmail').textContent = user.email;
    loadServices();
});

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await auth.signOut();
        window.location.href = 'admin-login.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
});

// Modal functions
function openModal(serviceId = null) {
    const modal = document.getElementById('serviceModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('serviceForm');

    if (serviceId) {
        modalTitle.textContent = 'Edit Service';
        loadServiceData(serviceId);
    } else {
        modalTitle.textContent = 'Add Service';
        form.reset();
        document.getElementById('serviceId').value = '';
    }

    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('serviceModal').style.display = 'none';
    document.getElementById('serviceForm').reset();
    document.getElementById('serviceId').value = '';
}

// Add new button
document.getElementById('addNewBtn').addEventListener('click', () => {
    openModal();
});

// Load service data for editing
async function loadServiceData(serviceId) {
    try {
        const doc = await db.collection('services').doc(serviceId).get();
        if (doc.exists) {
            const data = doc.data();
            document.getElementById('serviceId').value = serviceId;
            document.getElementById('category').value = data.category;
            document.getElementById('icon').value = data.icon;
            document.getElementById('title').value = data.title;
            document.getElementById('description').value = data.description;
            document.getElementById('features').value = data.features ? data.features.join('\n') : '';
            document.getElementById('pricing').value = data.pricing || '';
            document.getElementById('order').value = data.order || 0;
            document.getElementById('featured').checked = data.featured || false;
        }
    } catch (error) {
        console.error('Error loading service data:', error);
        alert('Error loading data: ' + error.message);
    }
}

// Form submission
document.getElementById('serviceForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const serviceId = document.getElementById('serviceId').value;
    const featuresText = document.getElementById('features').value;
    const featuresArray = featuresText.split('\n').filter(f => f.trim() !== '');

    const serviceData = {
        category: document.getElementById('category').value,
        icon: document.getElementById('icon').value,
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        features: featuresArray,
        pricing: document.getElementById('pricing').value,
        order: parseInt(document.getElementById('order').value) || 0,
        featured: document.getElementById('featured').checked,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        if (serviceId) {
            // Update existing
            await db.collection('services').doc(serviceId).update(serviceData);
            alert('Service updated successfully!');
        } else {
            // Create new
            serviceData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('services').add(serviceData);
            alert('Service added successfully!');
        }

        closeModal();
        loadServices();
    } catch (error) {
        console.error('Error saving service:', error);
        alert('Error saving: ' + error.message);
    }
});

// Load all services
async function loadServices() {
    const tableBody = document.getElementById('servicesTableBody');

    try {
        const snapshot = await db.collection('services').orderBy('category').orderBy('order').get();

        if (snapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="6" class="empty-cell">No services found. Click "Add New Service" to create one.</td></tr>';
            return;
        }

        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const descPreview = data.description.substring(0, 80) + (data.description.length > 80 ? '...' : '');

            html += `
                <tr>
                    <td><span class="badge badge-${data.category}">${data.category}</span></td>
                    <td>
                        ${data.title}
                        ${data.featured ? '<span class="badge badge-featured">Featured</span>' : ''}
                    </td>
                    <td>${descPreview}</td>
                    <td>${data.pricing || 'N/A'}</td>
                    <td>${data.order}</td>
                    <td class="action-buttons">
                        <button class="btn-icon btn-edit" onclick="openModal('${doc.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-delete" onclick="deleteService('${doc.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
    } catch (error) {
        console.error('Error loading services:', error);
        tableBody.innerHTML = '<tr><td colspan="6" class="error-cell">Error loading data: ' + error.message + '</td></tr>';
    }
}

// Delete service
async function deleteService(serviceId) {
    if (!confirm('Are you sure you want to delete this service?')) {
        return;
    }

    try {
        await db.collection('services').doc(serviceId).delete();
        alert('Service deleted successfully!');
        loadServices();
    } catch (error) {
        console.error('Error deleting service:', error);
        alert('Error deleting: ' + error.message);
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('serviceModal');
    if (event.target === modal) {
        closeModal();
    }
}
