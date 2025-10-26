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
    loadPackages();
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
function openModal(packageId = null) {
    const modal = document.getElementById('packageModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('packageForm');

    if (packageId) {
        modalTitle.textContent = 'Edit Package';
        loadPackageData(packageId);
    } else {
        modalTitle.textContent = 'Add Package';
        form.reset();
        document.getElementById('packageId').value = '';
        document.getElementById('buttonText').value = 'Choose Package';
    }

    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('packageModal').style.display = 'none';
    document.getElementById('packageForm').reset();
    document.getElementById('packageId').value = '';
}

// Add new button
document.getElementById('addNewBtn').addEventListener('click', () => {
    openModal();
});

// Load package data for editing
async function loadPackageData(packageId) {
    try {
        const doc = await db.collection('packages').doc(packageId).get();
        if (doc.exists) {
            const data = doc.data();
            document.getElementById('packageId').value = packageId;
            document.getElementById('name').value = data.name;
            document.getElementById('price').value = data.price;
            document.getElementById('period').value = data.period;
            document.getElementById('description').value = data.description || '';
            document.getElementById('features').value = data.features ? data.features.join('\n') : '';
            document.getElementById('order').value = data.order || 0;
            document.getElementById('featured').checked = data.featured || false;
            document.getElementById('buttonText').value = data.buttonText || 'Choose Package';
        }
    } catch (error) {
        console.error('Error loading package data:', error);
        alert('Error loading data: ' + error.message);
    }
}

// Form submission
document.getElementById('packageForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const packageId = document.getElementById('packageId').value;
    const featuresText = document.getElementById('features').value;
    const featuresArray = featuresText.split('\n').filter(f => f.trim() !== '');

    const packageData = {
        name: document.getElementById('name').value,
        price: parseFloat(document.getElementById('price').value),
        period: document.getElementById('period').value,
        description: document.getElementById('description').value,
        features: featuresArray,
        order: parseInt(document.getElementById('order').value) || 0,
        featured: document.getElementById('featured').checked,
        buttonText: document.getElementById('buttonText').value || 'Choose Package',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        if (packageId) {
            // Update existing
            await db.collection('packages').doc(packageId).update(packageData);
            alert('Package updated successfully!');
        } else {
            // Create new
            packageData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('packages').add(packageData);
            alert('Package added successfully!');
        }

        closeModal();
        loadPackages();
    } catch (error) {
        console.error('Error saving package:', error);
        alert('Error saving: ' + error.message);
    }
});

// Load all packages
async function loadPackages() {
    const grid = document.getElementById('packagesGrid');

    try {
        const snapshot = await db.collection('packages').orderBy('order').get();

        if (snapshot.empty) {
            grid.innerHTML = '<div class="empty-message">No packages found. Click "Add New Package" to create one.</div>';
            return;
        }

        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const periodText = {
                'month': '/month',
                'quarter': '/quarter',
                'year': '/year',
                'one-time': 'one-time'
            }[data.period] || '';

            const featuresHtml = data.features.map(f => `<li><i class="fas fa-check"></i> ${f}</li>`).join('');

            html += `
                <div class="package-card-admin ${data.featured ? 'featured' : ''}">
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
                    <div class="package-actions">
                        <button class="btn btn-edit" onclick="openModal('${doc.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-delete" onclick="deletePackage('${doc.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        });

        grid.innerHTML = html;
    } catch (error) {
        console.error('Error loading packages:', error);
        grid.innerHTML = '<div class="error-message">Error loading packages: ' + error.message + '</div>';
    }
}

// Delete package
async function deletePackage(packageId) {
    if (!confirm('Are you sure you want to delete this package?')) {
        return;
    }

    try {
        await db.collection('packages').doc(packageId).delete();
        alert('Package deleted successfully!');
        loadPackages();
    } catch (error) {
        console.error('Error deleting package:', error);
        alert('Error deleting: ' + error.message);
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('packageModal');
    if (event.target === modal) {
        closeModal();
    }
}
