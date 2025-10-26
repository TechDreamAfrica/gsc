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
    loadApplications();
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

// Status filter
document.getElementById('statusFilter').addEventListener('change', (e) => {
    loadApplications(e.target.value);
});

// Load all applications
async function loadApplications(statusFilter = 'all') {
    const tableBody = document.getElementById('applicationsTableBody');

    try {
        let query = db.collection('applications').orderBy('submittedAt', 'desc');

        if (statusFilter !== 'all') {
            query = query.where('status', '==', statusFilter);
        }

        const snapshot = await query.get();

        // Update stats
        updateStats(snapshot);

        if (snapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="7" class="empty-cell">No applications found.</td></tr>';
            return;
        }

        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const date = data.submittedAt ? data.submittedAt.toDate().toLocaleDateString() : 'N/A';

            html += `
                <tr>
                    <td><strong>${data.referenceNumber || 'N/A'}</strong></td>
                    <td>${data.service || 'N/A'}</td>
                    <td>${data.fullName || 'N/A'}</td>
                    <td>
                        <div>${data.email || 'N/A'}</div>
                        <div style="font-size: 0.85em; color: #64748b;">${data.phone || 'N/A'}</div>
                    </td>
                    <td>${date}</td>
                    <td>
                        <select class="status-select" data-id="${doc.id}" onchange="updateStatus('${doc.id}', this.value)">
                            <option value="pending" ${data.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="processing" ${data.status === 'processing' ? 'selected' : ''}>Processing</option>
                            <option value="completed" ${data.status === 'completed' ? 'selected' : ''}>Completed</option>
                            <option value="rejected" ${data.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                        </select>
                    </td>
                    <td class="action-buttons">
                        <button class="btn-icon btn-edit" onclick="viewApplication('${doc.id}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon btn-delete" onclick="deleteApplication('${doc.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
    } catch (error) {
        console.error('Error loading applications:', error);
        tableBody.innerHTML = '<tr><td colspan="7" class="error-cell">Error loading applications: ' + error.message + '</td></tr>';
    }
}

// Update stats
function updateStats(snapshot) {
    let pending = 0, processing = 0, completed = 0;

    snapshot.forEach(doc => {
        const status = doc.data().status;
        if (status === 'pending') pending++;
        else if (status === 'processing') processing++;
        else if (status === 'completed') completed++;
    });

    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('processingCount').textContent = processing;
    document.getElementById('completedCount').textContent = completed;
    document.getElementById('totalCount').textContent = snapshot.size;
}

// Update application status
async function updateStatus(applicationId, newStatus) {
    try {
        await db.collection('applications').doc(applicationId).update({
            status: newStatus,
            statusUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Reload applications to update stats
        const statusFilter = document.getElementById('statusFilter').value;
        loadApplications(statusFilter);

        showNotification('Status updated successfully', 'success');
    } catch (error) {
        console.error('Error updating status:', error);
        showNotification('Error updating status: ' + error.message, 'error');
    }
}

// View application details
async function viewApplication(applicationId) {
    try {
        const doc = await db.collection('applications').doc(applicationId).get();
        if (!doc.exists) {
            alert('Application not found');
            return;
        }

        const data = doc.data();
        const detailsContainer = document.getElementById('applicationDetails');

        let html = `
            <div class="application-details">
                <div class="detail-section">
                    <h3>Application Information</h3>
                    <div class="detail-grid">
                        <div><strong>Reference Number:</strong> ${data.referenceNumber || 'N/A'}</div>
                        <div><strong>Service:</strong> ${data.service || 'N/A'}</div>
                        <div><strong>Status:</strong> <span class="status-badge status-${data.status}">${data.status || 'pending'}</span></div>
                        <div><strong>Submitted:</strong> ${data.submittedAt ? data.submittedAt.toDate().toLocaleString() : 'N/A'}</div>
                    </div>
                </div>

                <div class="detail-section">
                    <h3>Personal Information</h3>
                    <div class="detail-grid">
                        <div><strong>Full Name:</strong> ${data.fullName || 'N/A'}</div>
                        <div><strong>Email:</strong> ${data.email || 'N/A'}</div>
                        <div><strong>Phone:</strong> ${data.phone || 'N/A'}</div>
                        <div><strong>Alt Phone:</strong> ${data.altPhone || 'N/A'}</div>
                    </div>
                    <div style="margin-top: 1rem;">
                        <strong>Address:</strong>
                        <p>${data.address || 'N/A'}</p>
                    </div>
                </div>

                <div class="detail-section">
                    <h3>Service-Specific Details</h3>
                    <div class="detail-grid">
        `;

        // Add service-specific fields
        if (data.serviceSpecific) {
            for (const [key, value] of Object.entries(data.serviceSpecific)) {
                if (value) {
                    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    html += `<div><strong>${label}:</strong> ${value}</div>`;
                }
            }
        }

        html += `
                    </div>
                </div>
        `;

        if (data.additionalNotes) {
            html += `
                <div class="detail-section">
                    <h3>Additional Notes</h3>
                    <p>${data.additionalNotes}</p>
                </div>
            `;
        }

        html += `
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="closeViewModal()">Close</button>
                    <button class="btn btn-primary" onclick="printApplication('${applicationId}')">
                        <i class="fas fa-print"></i> Print
                    </button>
                </div>
            </div>
        `;

        detailsContainer.innerHTML = html;
        document.getElementById('viewModal').style.display = 'flex';
    } catch (error) {
        console.error('Error viewing application:', error);
        alert('Error loading application details: ' + error.message);
    }
}

// Close view modal
function closeViewModal() {
    document.getElementById('viewModal').style.display = 'none';
}

// Delete application
async function deleteApplication(applicationId) {
    if (!confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
        return;
    }

    try {
        await db.collection('applications').doc(applicationId).delete();
        showNotification('Application deleted successfully', 'success');

        const statusFilter = document.getElementById('statusFilter').value;
        loadApplications(statusFilter);
    } catch (error) {
        console.error('Error deleting application:', error);
        showNotification('Error deleting application: ' + error.message, 'error');
    }
}

// Print application
function printApplication(applicationId) {
    // Implementation for printing
    window.print();
}

// Notification function
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
        ${type === 'success' ? 'background: #10b981;' : 'background: #ef4444;'}
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

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('viewModal');
    if (event.target === modal) {
        closeViewModal();
    }
}
