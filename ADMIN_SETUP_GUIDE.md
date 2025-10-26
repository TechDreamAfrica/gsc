# Admin Setup Guide - Fixing "Unauthorized: Admin privileges required"

## Problem

You're seeing the error: **"Unauthorized: Admin privileges required"**

This happens because Firebase custom claims for admin privileges haven't been set up yet.

---

## Understanding Admin Authentication

The application uses **3-layer security**:

1. ✅ **Firebase Authentication** - User must be logged in
2. ❌ **Custom Admin Claim** - User must have `admin: true` claim ← **THIS IS MISSING**
3. ✅ **Email Whitelist** - Email must be in whitelist (checked in JavaScript)

---

## Quick Solution (Choose One Method)

### Method 1: Using Firebase Console + Cloud Function (Easiest)

#### Step 1: Create Admin User in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Users**
4. Click **"Add user"**
5. Enter:
   - Email: `globalsmileconsulting@gmail.com` or `admin@globalsmileconsulting.com`
   - Password: (create a strong password)
6. Click **"Add user"**
7. **Copy the User UID** (you'll need this)

#### Step 2: Create Cloud Function to Set Admin Claim

1. In Firebase Console, go to **Functions**
2. Click **"Create function"**
3. Configure:
   - Name: `setAdminClaim`
   - Trigger: HTTPS
   - Region: Choose closest to you
4. Paste this code:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.setAdminClaim = functions.https.onRequest(async (req, res) => {
  // SECURITY: Change this secret key to something unique
  const SECRET_KEY = 'your-secret-key-12345';

  if (req.query.secret !== SECRET_KEY) {
    return res.status(403).send('Unauthorized');
  }

  const email = req.query.email;

  if (!email) {
    return res.status(400).send('Email parameter required');
  }

  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });

    return res.status(200).send(`Success! ${email} is now an admin. Please log out and log back in.`);
  } catch (error) {
    return res.status(500).send(`Error: ${error.message}`);
  }
});
```

5. Click **"Deploy"**

#### Step 3: Call the Function

Once deployed, you'll get a function URL. Call it in your browser:

```
https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/setAdminClaim?email=globalsmileconsulting@gmail.com&secret=your-secret-key-12345
```

Replace:
- `YOUR_REGION` - Your function region (e.g., `us-central1`)
- `YOUR_PROJECT_ID` - Your Firebase project ID
- `globalsmileconsulting@gmail.com` - The admin email
- `your-secret-key-12345` - The secret key you set

#### Step 4: Test Admin Access

1. Go to your admin login page: `admin/admin-login.html`
2. Log in with the email and password
3. You should now have admin access!

---

### Method 2: Using Firebase CLI (For Developers)

#### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

#### Step 2: Login to Firebase

```bash
firebase login
```

#### Step 3: Initialize Firebase Functions

```bash
cd "d:\TECH DREAM AFRICA\SERVICES\SOFTWARE DEVELOPMENT\WEBSITES\GLOBAL SMILE\globalsmile-consulting"
firebase init functions
```

- Select your existing project
- Choose JavaScript or TypeScript
- Install dependencies

#### Step 4: Create Set Admin Function

Edit `functions/index.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Callable function (more secure)
exports.setAdminClaim = functions.https.onCall(async (data, context) => {
  // Only allow if called by already-admin user (for first run, temporarily remove this check)
  // if (!context.auth || !context.auth.token.admin) {
  //   throw new functions.https.HttpsError('permission-denied', 'Only admins can create admins');
  // }

  const email = data.email;

  if (!email) {
    throw new functions.https.HttpsError('invalid-argument', 'Email is required');
  }

  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });

    return {
      success: true,
      message: `${email} is now an admin. Please sign out and sign in again.`
    };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// HTTP endpoint for initial setup (delete after first use)
exports.setupFirstAdmin = functions.https.onRequest(async (req, res) => {
  const SECRET = 'CHANGE_THIS_SECRET_12345';

  if (req.query.secret !== SECRET) {
    return res.status(403).send('Forbidden');
  }

  const email = req.query.email || 'globalsmileconsulting@gmail.com';

  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });

    res.send(`SUCCESS! ${email} is now an admin. DELETE THIS FUNCTION NOW!`);
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});
```

#### Step 5: Deploy Functions

```bash
firebase deploy --only functions
```

#### Step 6: Set First Admin

Call the setup function (replace with your actual URL):

```
https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/setupFirstAdmin?email=globalsmileconsulting@gmail.com&secret=CHANGE_THIS_SECRET_12345
```

#### Step 7: Clean Up

After setting the first admin, **immediately delete the setupFirstAdmin function** for security:

1. Remove the `setupFirstAdmin` function from `functions/index.js`
2. Redeploy: `firebase deploy --only functions`

---

### Method 3: Using Firebase Console Script (Advanced Users)

If you're comfortable with browser console:

1. Go to your Firebase project in the Console
2. Open **Firestore Database** (any page in your Firebase Console)
3. Open browser Developer Tools (F12)
4. Go to **Console** tab
5. Paste and run this script:

```javascript
// WARNING: This only works if you have Firebase Admin SDK access
// This won't work in the browser - you need a Cloud Function

// Instead, create a temporary HTML file with this:
```

**Create a file called `set-admin.html` in your project:**

```html
<!DOCTYPE html>
<html>
<head>
    <title>Set Admin Claim</title>
</head>
<body>
    <h1>Set Admin Claim</h1>
    <input type="email" id="email" placeholder="Admin Email">
    <button onclick="setAdmin()">Set Admin</button>
    <div id="result"></div>

    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-functions-compat.js"></script>
    <script src="js/firebase-config.js"></script>

    <script>
        async function setAdmin() {
            const email = document.getElementById('email').value;

            if (!email) {
                alert('Please enter an email');
                return;
            }

            try {
                const setAdminClaim = firebase.functions().httpsCallable('setAdminClaim');
                const result = await setAdminClaim({ email: email });

                document.getElementById('result').innerHTML =
                    '<p style="color: green;">' + result.data.message + '</p>';
            } catch (error) {
                document.getElementById('result').innerHTML =
                    '<p style="color: red;">Error: ' + error.message + '</p>';
            }
        }
    </script>
</body>
</html>
```

---

## Verification Steps

After setting admin claims, verify it worked:

### Step 1: Check Custom Claims in Firebase Console

1. Go to **Authentication** → **Users**
2. Click on your admin user
3. Look for **Custom claims** section
4. Should see: `{ "admin": true }`

### Step 2: Test in Browser Console

After logging in, open browser console and run:

```javascript
firebase.auth().currentUser.getIdTokenResult()
    .then(result => {
        console.log('Admin claim:', result.claims.admin);
        console.log('All claims:', result.claims);
    });
```

Should show: `Admin claim: true`

### Step 3: Test Admin Access

1. Log out if currently logged in
2. Go to `admin/admin-login.html`
3. Log in with admin email
4. Should redirect to admin dashboard
5. Should see "No errors" in browser console

---

## Troubleshooting

### Issue 1: Still Getting "Unauthorized" After Setting Claims

**Solution**: User must log out and log back in for new claims to take effect

```javascript
// Force token refresh
firebase.auth().currentUser.getIdToken(true)
    .then(() => {
        console.log('Token refreshed');
        location.reload();
    });
```

### Issue 2: Function Not Found

**Solution**: Make sure function is deployed

```bash
firebase deploy --only functions
```

Check deployment status in Firebase Console → Functions

### Issue 3: "Email already exists"

**Solution**: User already created. Just set claims using their existing email.

### Issue 4: Can't Deploy Functions

**Solution**:
1. Make sure Firebase CLI is installed: `npm install -g firebase-tools`
2. Make sure you're logged in: `firebase login`
3. Make sure you've initialized: `firebase init functions`
4. Check billing is enabled (Functions require Blaze plan for deployment)

---

## Security Best Practices

### 1. Delete Setup Functions After Use

Remove any temporary admin setup functions after creating your first admin.

### 2. Use Secret Keys

Always protect admin setup endpoints with secret keys.

### 3. Enable 2FA

Enable two-factor authentication on admin accounts.

### 4. Limit Admin Count

Only give admin access to trusted users.

### 5. Monitor Admin Activity

Regularly check Firebase Console → Authentication → Users for unexpected admins.

---

## Alternative: Manual Setup via Firebase Admin SDK

If you have Node.js access:

**Create a file called `set-admin.js`:**

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Download from Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const email = 'globalsmileconsulting@gmail.com';

admin.auth().getUserByEmail(email)
  .then(user => {
    return admin.auth().setCustomUserClaims(user.uid, { admin: true });
  })
  .then(() => {
    console.log(`Success! ${email} is now an admin`);
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
```

**Run:**

```bash
node set-admin.js
```

---

## Quick Checklist

- [ ] Created user in Firebase Authentication
- [ ] Deployed Cloud Function to set admin claims
- [ ] Called function with admin email
- [ ] Verified claims are set in Firebase Console
- [ ] Logged out and logged back in
- [ ] Tested admin access
- [ ] Deleted/secured setup function
- [ ] Enabled 2FA on admin account

---

## Need Help?

If you're still having issues:

1. Check browser console for specific error messages
2. Verify Firebase configuration in `js/firebase-config.js`
3. Make sure Firebase Authentication is enabled
4. Ensure billing is enabled (for Cloud Functions)
5. Check that email is in whitelist in both:
   - `firestore.rules`
   - All `js/admin-*.js` files

---

## Summary

The "Unauthorized: Admin privileges required" error occurs because admin custom claims haven't been set. You must:

1. **Create a user** in Firebase Authentication
2. **Set custom claim** `{ "admin": true }` using a Cloud Function
3. **Log out and log back in** to refresh the token
4. **Verify** the claim is present

The easiest method is **Method 1** using a Cloud Function with a secret URL.

---

**Last Updated**: January 2025
**Status**: Production Ready
