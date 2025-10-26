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
    loadStatistics();
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
function openModal(statId = null) {
    const modal = document.getElementById('statModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('statForm');

    if (statId) {
        modalTitle.textContent = 'Edit Statistic';
        loadStatData(statId);
    } else {
        modalTitle.textContent = 'Add Statistic';
        form.reset();
        document.getElementById('statId').value = '';
    }

    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('statModal').style.display = 'none';
    document.getElementById('statForm').reset();
    document.getElementById('statId').value = '';
}

// Add new button
document.getElementById('addNewBtn').addEventListener('click', () => {
    openModal();
});

// Load statistic data for editing
async function loadStatData(statId) {
    try {
        const doc = await db.collection('statistics').doc(statId).get();
        if (doc.exists) {
            const data = doc.data();
            document.getElementById('statId').value = statId;
            document.getElementById('label').value = data.label;
            document.getElementById('value').value = data.value;
            document.getElementById('suffix').value = data.suffix || '';
            document.getElementById('icon').value = data.icon || '';
            document.getElementById('order').value = data.order || 0;
        }
    } catch (error) {
        console.error('Error loading statistic data:', error);
        alert('Error loading data: ' + error.message);
    }
}

// Form submission
document.getElementById('statForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const statId = document.getElementById('statId').value;
    const statData = {
        label: document.getElementById('label').value,
        value: parseInt(document.getElementById('value').value),
        suffix: document.getElementById('suffix').value || '',
        icon: document.getElementById('icon').value || '',
        order: parseInt(document.getElementById('order').value) || 0,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        if (statId) {
            // Update existing
            await db.collection('statistics').doc(statId).update(statData);
            alert('Statistic updated successfully!');
        } else {
            // Create new
            statData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('statistics').add(statData);
            alert('Statistic added successfully!');
        }

        closeModal();
        loadStatistics();
    } catch (error) {
        console.error('Error saving statistic:', error);
        alert('Error saving: ' + error.message);
    }
});

// Load all statistics
async function loadStatistics() {
    const tableBody = document.getElementById('statsTableBody');

    try {
        const snapshot = await db.collection('statistics').orderBy('order').get();

        if (snapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="6" class="empty-cell">No statistics found. Click "Add New Statistic" to create one.</td></tr>';
            return;
        }

        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const displayValue = data.value + (data.suffix || '');

            html += `
                <tr>
                    <td>${data.label}</td>
                    <td>${data.value}</td>
                    <td><strong>${displayValue}</strong></td>
                    <td>${data.icon ? '<i class="fas ' + data.icon + '"></i>' : 'N/A'}</td>
                    <td>${data.order}</td>
                    <td class="action-buttons">
                        <button class="btn-icon btn-edit" onclick="openModal('${doc.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-delete" onclick="deleteStatistic('${doc.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
    } catch (error) {
        console.error('Error loading statistics:', error);
        tableBody.innerHTML = '<tr><td colspan="6" class="error-cell">Error loading data: ' + error.message + '</td></tr>';
    }
}

// Delete statistic
async function deleteStatistic(statId) {
    if (!confirm('Are you sure you want to delete this statistic?')) {
        return;
    }

    try {
        await db.collection('statistics').doc(statId).delete();
        alert('Statistic deleted successfully!');
        loadStatistics();
    } catch (error) {
        console.error('Error deleting statistic:', error);
        alert('Error deleting: ' + error.message);
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('statModal');
    if (event.target === modal) {
        closeModal();
    }
}
