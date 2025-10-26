# Firebase Setup Guide for Global Smile Consulting

## Overview
This guide will help you set up Firebase for the Global Smile Consulting website admin panel.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Enter project name: `globalsmile-consulting` (or your preferred name)
4. Follow the setup wizard (you can disable Google Analytics if not needed)

## Step 2: Enable Firestore Database

1. In the Firebase Console, go to **Build > Firestore Database**
2. Click "Create database"
3. Choose **Start in production mode** (we'll set up rules later)
4. Select your preferred location (closest to Ghana: `europe-west1` or `europe-west3`)
5. Click "Enable"

## Step 3: Enable Authentication

1. Go to **Build > Authentication**
2. Click "Get started"
3. Click on **Sign-in method** tab
4. Enable **Email/Password** authentication
5. Click "Save"

## Step 4: Create Admin User

1. Go to **Authentication > Users** tab
2. Click "Add user"
3. Enter email: `admin@globalsmileconsulting.com` (or your preferred email)
4. Enter a strong password
5. Click "Add user"
6. Note the **User UID** (you'll need this for setting admin claims)

## Step 5: Set Admin Custom Claims

You need to set custom claims to mark a user as admin. This requires Firebase Admin SDK or Firebase CLI.

### Option A: Using Firebase CLI (Recommended)

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project:
   ```bash
   firebase init
   ```
   - Select: Firestore, Functions
   - Use existing project: select your project
   - Accept default Firestore rules file
   - Accept default Functions setup (JavaScript or TypeScript)

4. Create a function to set admin claims. Edit `functions/index.js`:
   ```javascript
   const functions = require('firebase-functions');
   const admin = require('firebase-admin');
   admin.initializeApp();

   exports.setAdminClaim = functions.https.onCall(async (data, context) => {
     const email = data.email;

     const user = await admin.auth().getUserByEmail(email);
     await admin.auth().setCustomUserClaims(user.uid, { admin: true });

     return { message: `Success! ${email} is now an admin.` };
   });
   ```

5. Deploy the function:
   ```bash
   firebase deploy --only functions
   ```

6. Call the function from browser console on any Firebase-enabled page:
   ```javascript
   const setAdmin = firebase.functions().httpsCallable('setAdminClaim');
   setAdmin({ email: 'admin@globalsmileconsulting.com' })
     .then(result => console.log(result.data.message));
   ```

### Option B: Using Firebase Console Script

Create a simple Cloud Function in the Firebase Console:

1. Go to **Functions** in Firebase Console
2. Create a new HTTPS function with this code
3. Call it once to set admin privileges

## Step 6: Get Firebase Configuration

1. Go to **Project Settings** (gear icon) in Firebase Console
2. Scroll down to "Your apps"
3. Click on the **Web** icon (`</>`)
4. Register your app with nickname: "Global Smile Website"
5. Copy the **firebaseConfig** object

## Step 7: Update firebase-config.js

Open `firebase-config.js` and replace the placeholder values with your actual Firebase configuration:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    databaseURL: "https://your-project-id-default-rtdb.firebaseio.com"
};
```

## Step 8: Configure Firestore Security Rules

### Option A: Using Firebase Console (Quick Setup)

1. In Firebase Console, go to **Firestore Database > Rules**
2. Copy the contents of the `firestore.rules` file from this project
3. Paste into the rules editor
4. Click "Publish" to save the rules

### Option B: Using Firebase CLI (Recommended for Production)

1. Make sure you have initialized Firebase in your project:
   ```bash
   firebase init firestore
   ```

2. The `firestore.rules` file is already configured in this project

3. Deploy the rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

### Security Rules Overview

The `firestore.rules` file includes:

**Helper Functions:**
- `isAuthenticated()` - Checks if user is logged in
- `isAdmin()` - Checks if user has admin custom claim
- `isWhitelistedEmail()` - Verifies email is in whitelist (globalsmileconsulting@gmail.com or admin@globalsmileconsulting.com)

**Collection Rules:**

1. **about, services, statistics, packages**:
   - Public read access (anyone can view)
   - Admin-only write access (must be authenticated, have admin claim, AND be whitelisted)

2. **applications**:
   - Anyone can create (public can submit applications)
   - Validates required fields on creation
   - Forces initial status to 'pending'
   - Only whitelisted admins can read, update, or delete

3. **All other collections**:
   - Denied by default (explicit deny for security)

### Whitelist Configuration

The current whitelist includes:
- `globalsmileconsulting@gmail.com`
- `admin@globalsmileconsulting.com`

**To add more admin emails:**
1. Edit `firestore.rules`
2. Update the `isWhitelistedEmail()` function
3. Redeploy rules
4. Also update the JavaScript whitelist in:
   - `js/admin-applications.js`
   - `js/admin-auth.js` (if exists)
   - All admin-*.js files

## Step 9: Test the Admin Panel

1. Open `admin/login.html` in your browser
2. Login with the admin credentials you created
3. You should be redirected to the admin dashboard
4. Test creating, editing, and deleting content in each section

## Collections Structure

The application uses the following Firestore collections:

### `about` Collection
```json
{
  "sectionType": "main|vision|mission|approach|values",
  "title": "Section Title",
  "content": "Section content text",
  "icon": "fa-icon-name",
  "order": 0,
  "createdAt": timestamp,
  "updatedAt": timestamp
}
```

### `services` Collection
```json
{
  "category": "business|accounting|hr|training|marketing|regulatory|legal|other",
  "icon": "fa-icon-name",
  "title": "Service Title",
  "description": "Service description",
  "features": ["feature1", "feature2"],
  "pricing": "Starting from $500/month",
  "order": 0,
  "featured": false,
  "createdAt": timestamp,
  "updatedAt": timestamp
}
```

### `statistics` Collection
```json
{
  "label": "Businesses Empowered",
  "value": 500,
  "suffix": "+",
  "icon": "fa-users",
  "order": 0,
  "createdAt": timestamp,
  "updatedAt": timestamp
}
```

### `packages` Collection
```json
{
  "name": "Package Name",
  "price": 800,
  "period": "month|quarter|year|one-time",
  "description": "Package description",
  "features": ["feature1", "feature2"],
  "order": 0,
  "featured": false,
  "buttonText": "Choose Package",
  "createdAt": timestamp,
  "updatedAt": timestamp
}
```

### `applications` Collection
```json
{
  "referenceNumber": "GSC-LK5P2Q1R",
  "service": "Business Registration",
  "status": "pending|processing|completed|rejected",

  // Personal Information
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+233123456789",
  "altPhone": "+233987654321",
  "address": "123 Main St, Accra",

  // Service-Specific Fields (varies by service)
  "serviceSpecific": {
    "businessName": "Example Corp",
    "businessType": "LLC",
    // ... other fields based on service
  },

  // Additional Information
  "additionalNotes": "Optional notes from applicant",

  // Timestamps
  "submittedAt": timestamp,
  "statusUpdatedAt": timestamp,
  "createdAt": "2025-01-15T10:30:00Z"
}
```

## Troubleshooting

### "Permission denied" errors
- Make sure Firestore security rules are published
- Verify the user has admin custom claims set

### "Firebase not defined" errors
- Ensure Firebase SDKs are loaded before firebase-config.js
- Check browser console for script loading errors

### Cannot login
- Verify Email/Password authentication is enabled
- Check that the user exists in Authentication > Users
- Verify admin custom claims are set

### Data not loading
- Check browser console for errors
- Verify Firestore collections exist
- Check network tab for failed requests

## Next Steps

1. **Populate Initial Data**: Use the admin panel to add your services, statistics, and other content
2. **Customize Styling**: Modify `admin/admin-styles.css` to match your branding
3. **Add Storage**: Enable Firebase Storage if you want to upload images
4. **Set up Hosting**: Deploy to Firebase Hosting for production

## Admin Panel URLs

- Login: `admin/admin-login.html`
- Dashboard: `admin/admin-dashboard.html`
- About: `admin/admin-about.html`
- Services: `admin/admin-services.html`
- Statistics: `admin/admin-statistics.html`
- Packages: `admin/admin-packages.html`
- Applications: `admin/admin-applications.html`

## Security Best Practices

1. **Never commit firebase-config.js with real credentials to public repositories**
2. Use environment variables for sensitive data in production
3. Regularly review Firestore security rules
4. Enable 2FA for admin accounts
5. Monitor Firebase usage and set up billing alerts
6. Regularly backup Firestore data

## Support

For issues or questions, refer to:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
