// Whitelist of authorized admin emails
const AUTHORIZED_EMAILS = [
    'globalsmileconsulting@gmail.com',
    'admin@globalsmileconsulting.com'
];

function isAuthorizedEmail(email) {
    return AUTHORIZED_EMAILS.includes(email.toLowerCase().trim());
}

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
    loadAboutSections();
});

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await auth.signOut();
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
});

// Show/hide icon field based on section type
document.getElementById('sectionType').addEventListener('change', (e) => {
    const iconGroup = document.getElementById('iconGroup');
    if (e.target.value === 'vision' || e.target.value === 'mission' || e.target.value === 'values') {
        iconGroup.style.display = 'block';
    } else {
        iconGroup.style.display = 'none';
    }
});

// Modal functions
function openModal(aboutId = null) {
    const modal = document.getElementById('aboutModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('aboutForm');

    if (aboutId) {
        modalTitle.textContent = 'Edit About Section';
        loadAboutData(aboutId);
    } else {
        modalTitle.textContent = 'Add About Section';
        form.reset();
        document.getElementById('aboutId').value = '';
    }

    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('aboutModal').style.display = 'none';
    document.getElementById('aboutForm').reset();
    document.getElementById('aboutId').value = '';
}

// Add new button
document.getElementById('addNewBtn').addEventListener('click', () => {
    openModal();
});

// Load about data for editing
async function loadAboutData(aboutId) {
    try {
        const doc = await db.collection('about').doc(aboutId).get();
        if (doc.exists) {
            const data = doc.data();
            document.getElementById('aboutId').value = aboutId;
            document.getElementById('sectionType').value = data.sectionType;
            document.getElementById('title').value = data.title;
            document.getElementById('content').value = data.content;
            document.getElementById('icon').value = data.icon || '';
            document.getElementById('order').value = data.order || 0;

            // Trigger change event to show/hide icon field
            document.getElementById('sectionType').dispatchEvent(new Event('change'));
        }
    } catch (error) {
        console.error('Error loading about data:', error);
        alert('Error loading data: ' + error.message);
    }
}

// Form submission
document.getElementById('aboutForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const aboutId = document.getElementById('aboutId').value;
    const aboutData = {
        sectionType: document.getElementById('sectionType').value,
        title: document.getElementById('title').value,
        content: document.getElementById('content').value,
        icon: document.getElementById('icon').value,
        order: parseInt(document.getElementById('order').value) || 0,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        if (aboutId) {
            // Update existing
            await db.collection('about').doc(aboutId).update(aboutData);
            alert('About section updated successfully!');
        } else {
            // Create new
            aboutData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('about').add(aboutData);
            alert('About section added successfully!');
        }

        closeModal();
        loadAboutSections();
    } catch (error) {
        console.error('Error saving about section:', error);
        alert('Error saving: ' + error.message);
    }
});

// Load all about sections
async function loadAboutSections() {
    const tableBody = document.getElementById('aboutTableBody');

    try {
        const snapshot = await db.collection('about').orderBy('order').get();

        if (snapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="5" class="empty-cell">No about sections found. Click "Add New Section" to create one.</td></tr>';
            return;
        }

        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const contentPreview = data.content.substring(0, 100) + (data.content.length > 100 ? '...' : '');

            html += `
                <tr>
                    <td><span class="badge">${data.sectionType}</span></td>
                    <td>${data.title}</td>
                    <td>${contentPreview}</td>
                    <td>${data.order}</td>
                    <td class="action-buttons">
                        <button class="btn-icon btn-edit" onclick="openModal('${doc.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-delete" onclick="deleteAboutSection('${doc.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
    } catch (error) {
        console.error('Error loading about sections:', error);
        tableBody.innerHTML = '<tr><td colspan="5" class="error-cell">Error loading data: ' + error.message + '</td></tr>';
    }
}

// Delete about section
async function deleteAboutSection(aboutId) {
    if (!confirm('Are you sure you want to delete this about section?')) {
        return;
    }

    try {
        await db.collection('about').doc(aboutId).delete();
        alert('About section deleted successfully!');
        loadAboutSections();
    } catch (error) {
        console.error('Error deleting about section:', error);
        alert('Error deleting: ' + error.message);
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('aboutModal');
    if (event.target === modal) {
        closeModal();
    }
}
