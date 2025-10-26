# Firebase Security Rules - Quick Reference Guide

## Overview

This document explains the Firebase Firestore security rules configured for the Global Smile Consulting application.

---

## File Location

**Rules File**: `firestore.rules`

This file defines who can read and write data in your Firestore database.

---

## Security Model

The application uses a **multi-layer security approach**:

1. **Authentication Check** - User must be logged in
2. **Admin Role Check** - User must have admin custom claim
3. **Email Whitelist Check** - User email must be in approved list

---

## Helper Functions

### `isAuthenticated()`
```javascript
function isAuthenticated() {
  return request.auth != null;
}
```
**Purpose**: Checks if a user is logged in via Firebase Authentication.

**Returns**: `true` if user is authenticated, `false` otherwise.

---

### `isAdmin()`
```javascript
function isAdmin() {
  return isAuthenticated() && request.auth.token.admin == true;
}
```
**Purpose**: Checks if user has the admin custom claim set.

**Returns**: `true` if user is authenticated AND has admin claim.

**Note**: Admin custom claims must be set via Firebase CLI or Cloud Functions.

---

### `isWhitelistedEmail()`
```javascript
function isWhitelistedEmail() {
  return isAuthenticated() && (
    request.auth.token.email == 'globalsmileconsulting@gmail.com' ||
    request.auth.token.email == 'admin@globalsmileconsulting.com'
  );
}
```
**Purpose**: Verifies that the user's email is in the approved whitelist.

**Current Whitelist**:
- `globalsmileconsulting@gmail.com`
- `admin@globalsmileconsulting.com`

**Returns**: `true` if user email matches one of the whitelisted emails.

---

## Collection-Specific Rules

### 1. Public Collections (about, services, statistics, packages)

**Rule**:
```javascript
match /about/{document} {
  allow read: if true;
  allow create, update, delete: if isAdmin() && isWhitelistedEmail();
}
```

**Access Control**:
- **Read**: ✅ Anyone (public access)
- **Create**: ✅ Whitelisted admins only
- **Update**: ✅ Whitelisted admins only
- **Delete**: ✅ Whitelisted admins only

**Use Case**: Public website content that anyone can view, but only authorized admins can modify.

**Collections Using This Rule**:
- `about` - About page sections
- `services` - Service offerings
- `statistics` - Homepage statistics
- `packages` - Service packages

---

### 2. Applications Collection

**Rule**:
```javascript
match /applications/{document} {
  // Allow anyone to create new applications
  allow create: if true &&
    request.resource.data.keys().hasAll([
      'referenceNumber',
      'service',
      'fullName',
      'email',
      'phone',
      'status'
    ]) &&
    request.resource.data.status == 'pending' &&
    request.resource.data.referenceNumber is string &&
    request.resource.data.service is string &&
    request.resource.data.fullName is string &&
    request.resource.data.email is string &&
    request.resource.data.phone is string;

  // Only whitelisted admins can read
  allow read: if isAdmin() && isWhitelistedEmail();

  // Only whitelisted admins can update
  allow update: if isAdmin() && isWhitelistedEmail();

  // Only whitelisted admins can delete
  allow delete: if isAdmin() && isWhitelistedEmail();
}
```

**Access Control**:
- **Create**: ✅ Anyone (public can submit applications)
  - **Validation**: Must include required fields
  - **Constraint**: Status must be 'pending' on creation
  - **Type Checking**: Validates data types
- **Read**: ✅ Whitelisted admins only
- **Update**: ✅ Whitelisted admins only
- **Delete**: ✅ Whitelisted admins only

**Required Fields for Creation**:
- `referenceNumber` (string)
- `service` (string)
- `fullName` (string)
- `email` (string)
- `phone` (string)
- `status` (must be 'pending')

**Use Case**: Public users can submit service applications, but only admins can view and manage them.

---

### 3. All Other Collections

**Rule**:
```javascript
match /{document=**} {
  allow read, write: if false;
}
```

**Access Control**:
- **Read**: ❌ Denied
- **Write**: ❌ Denied

**Purpose**: Denies access to any collections not explicitly defined above. This is a security best practice.

---

## Security Validation Examples

### Example 1: Public User Viewing Services
```
User: Not authenticated
Action: Read from /services collection
Result: ✅ ALLOWED (public read access)
```

### Example 2: Public User Submitting Application
```
User: Not authenticated
Action: Create in /applications collection
Data: { referenceNumber: "GSC-123", service: "Business Registration",
       fullName: "John Doe", email: "john@example.com",
       phone: "+233123456789", status: "pending" }
Result: ✅ ALLOWED (valid application data)
```

### Example 3: Public User Trying Invalid Application
```
User: Not authenticated
Action: Create in /applications collection
Data: { service: "Business Registration", status: "completed" }
Result: ❌ DENIED (missing required fields, invalid status)
```

### Example 4: Non-Whitelisted Admin Viewing Applications
```
User: admin@example.com (authenticated, has admin claim)
Action: Read from /applications collection
Result: ❌ DENIED (not in whitelist)
```

### Example 5: Whitelisted Admin Viewing Applications
```
User: admin@globalsmileconsulting.com (authenticated, has admin claim)
Action: Read from /applications collection
Result: ✅ ALLOWED (whitelisted admin)
```

### Example 6: Whitelisted Admin Updating Service
```
User: globalsmileconsulting@gmail.com (authenticated, has admin claim)
Action: Update /services/{docId}
Result: ✅ ALLOWED (whitelisted admin)
```

---

## Deploying Rules

### Method 1: Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database > Rules**
4. Copy contents of `firestore.rules` file
5. Paste into the rules editor
6. Click **Publish**

### Method 2: Firebase CLI (Recommended)

```bash
# Initialize Firebase (if not already done)
firebase init firestore

# Deploy rules only
firebase deploy --only firestore:rules
```

---

## Testing Rules

### Using Firebase Console

1. Go to **Firestore Database > Rules**
2. Click the **Rules Playground** tab
3. Select collection and operation
4. Set authentication state (authenticated/unauthenticated)
5. Set custom claims if needed: `{ "admin": true }`
6. Set email if needed: `globalsmileconsulting@gmail.com`
7. Click **Run** to test

### Example Test Cases

**Test 1: Public Read**
- Location: `/services/testDoc`
- Operation: `get`
- Auth: Unauthenticated
- Expected: ✅ Allow

**Test 2: Admin Create**
- Location: `/services/newDoc`
- Operation: `create`
- Auth: Authenticated
- Email: `admin@globalsmileconsulting.com`
- Custom Claims: `{ "admin": true }`
- Expected: ✅ Allow

**Test 3: Public Application Submit**
- Location: `/applications/newApp`
- Operation: `create`
- Auth: Unauthenticated
- Data: Valid application object
- Expected: ✅ Allow

**Test 4: Public View Applications**
- Location: `/applications/app123`
- Operation: `get`
- Auth: Unauthenticated
- Expected: ❌ Deny

---

## Adding New Admin Emails

To add a new admin email to the whitelist:

### Step 1: Update Firestore Rules

Edit `firestore.rules`:

```javascript
function isWhitelistedEmail() {
  return isAuthenticated() && (
    request.auth.token.email == 'globalsmileconsulting@gmail.com' ||
    request.auth.token.email == 'admin@globalsmileconsulting.com' ||
    request.auth.token.email == 'newemail@example.com'  // Add new email
  );
}
```

### Step 2: Deploy Updated Rules

```bash
firebase deploy --only firestore:rules
```

### Step 3: Update JavaScript Whitelist

Update the whitelist in these files:

**File**: `js/admin-applications.js`
```javascript
const AUTHORIZED_EMAILS = [
    'globalsmileconsulting@gmail.com',
    'admin@globalsmileconsulting.com',
    'newemail@example.com'  // Add new email
];
```

**Files to Update**:
- `js/admin-applications.js`
- `js/admin-about.js`
- `js/admin-services.js`
- `js/admin-statistics.js`
- `js/admin-packages.js`
- Any other admin-*.js files

### Step 4: Create User and Set Admin Claim

1. **Create user in Firebase Console**:
   - Go to Authentication > Users
   - Click "Add user"
   - Enter the new email and password

2. **Set admin custom claim**:
   ```javascript
   // Via Firebase CLI or Cloud Function
   admin.auth().setCustomUserClaims(uid, { admin: true });
   ```

---

## Common Issues

### Issue 1: "Unauthorized: Admin privileges required"

**Cause**: Admin custom claims are not set for the user

**This is the MOST COMMON issue!**

**Solution**:
1. See the complete guide: **ADMIN_SETUP_GUIDE.md**
2. Quick fix: Create a Cloud Function to set custom claims
3. Set claim: `admin.auth().setCustomUserClaims(uid, { admin: true })`
4. User must log out and log back in after claim is set
5. Verify claim exists: Check Firebase Console → Authentication → Users → Custom claims

**Detailed Steps**: See **ADMIN_SETUP_GUIDE.md** for 3 different methods to set admin claims

### Issue 2: "Permission denied" on admin operations

**Cause**: User lacks one of the required permissions:
- Not authenticated
- Missing admin custom claim (see Issue 1 above)
- Email not in whitelist

**Solution**:
1. Verify user is logged in
2. Check admin custom claims are set (see ADMIN_SETUP_GUIDE.md)
3. Confirm email is in whitelist
4. Check rules are deployed

### Issue 3: Application submission fails

**Cause**: Missing required fields or invalid data

**Solution**:
1. Ensure all required fields are present:
   - `referenceNumber`, `service`, `fullName`, `email`, `phone`, `status`
2. Verify `status` is set to 'pending'
3. Check data types match expectations

### Issue 4: Rules not updating

**Cause**: Rules not deployed or cached

**Solution**:
1. Verify rules are published in Firebase Console
2. Or redeploy via CLI: `firebase deploy --only firestore:rules`
3. Clear browser cache
4. Wait a few minutes for propagation

---

## Security Best Practices

### 1. Never Expose Admin Credentials
- Don't commit real Firebase config to public repos
- Use environment variables for sensitive data
- Rotate passwords regularly

### 2. Principle of Least Privilege
- Only grant minimum necessary permissions
- Use whitelist for sensitive operations
- Regularly review access logs

### 3. Validate All Input
- Check data types in rules
- Enforce required fields
- Validate data formats

### 4. Monitor Usage
- Set up Firebase alerts
- Review security rules regularly
- Monitor for suspicious activity
- Set billing alerts

### 5. Keep Rules Updated
- Version control your rules file
- Test changes before deploying
- Document rule changes
- Review permissions quarterly

---

## Rule Versioning

**Current Version**: `rules_version = '2'`

This uses Firestore Security Rules version 2, which provides:
- Improved performance
- Better error messages
- Enhanced validation functions
- More flexible pattern matching

---

## Additional Resources

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Security Rules Testing](https://firebase.google.com/docs/firestore/security/test-rules-emulator)
- [Custom Claims Documentation](https://firebase.google.com/docs/auth/admin/custom-claims)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)

---

## Summary

**Security Model**: Multi-layer (Authentication + Admin Role + Email Whitelist)

**Public Collections**: Read by all, write by whitelisted admins only
- `about`, `services`, `statistics`, `packages`

**Applications Collection**: Create by all, read/update/delete by whitelisted admins only
- Validates required fields on creation
- Enforces 'pending' status for new applications

**Whitelisted Emails**:
- `globalsmileconsulting@gmail.com`
- `admin@globalsmileconsulting.com`

**Deployment**: Via Firebase Console or CLI (`firebase deploy --only firestore:rules`)

---

**Last Updated**: January 2025
**Rules Version**: 2
**File**: `firestore.rules`
