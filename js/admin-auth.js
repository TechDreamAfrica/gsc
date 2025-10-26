// Admin Authentication and Authorization
// Whitelist of authorized admin emails

const AUTHORIZED_EMAILS = [
    'globalsmileconsulting@gmail.com',
    'admin@globalsmileconsulting.com'
];

function isAuthorizedEmail(email) {
    return AUTHORIZED_EMAILS.includes(email.toLowerCase().trim());
}

async function checkAdminAccess() {
    return new Promise((resolve, reject) => {
        auth.onAuthStateChanged(async (user) => {
            if (!user) {
                window.location.href = 'admin-login.html';
                reject('No user logged in');
                return;
            }

            // Verify email is authorized
            if (!isAuthorizedEmail(user.email)) {
                await auth.signOut();
                alert('Unauthorized: This email is not authorized to access the admin panel');
                window.location.href = 'admin-login.html';
                reject('Unauthorized email');
                return;
            }

            const idTokenResult = await user.getIdTokenResult();
            if (!idTokenResult.claims.admin) {
                await auth.signOut();
                alert('Unauthorized: Admin privileges required');
                window.location.href = 'admin-login.html';
                reject('No admin privileges');
                return;
            }

            resolve(user);
        });
    });
}

// Export for use in other files
window.checkAdminAccess = checkAdminAccess;
window.isAuthorizedEmail = isAuthorizedEmail;
window.AUTHORIZED_EMAILS = AUTHORIZED_EMAILS;
