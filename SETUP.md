# Quick Setup Guide

## Step-by-Step Setup Instructions

### 1. Install Dependencies

```bash
cd myapp
npm install
```

### 2. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable the following services:
   - **Authentication**: Go to Authentication > Sign-in method > Enable Email/Password
   - **Firestore**: Go to Firestore Database > Create database (start in test mode, we'll deploy rules)
   - **Storage**: Go to Storage > Get started (start in test mode, we'll deploy rules)
   - **Functions**: Go to Functions > Get started
   - **App Check** (Optional): Go to App Check > Register app

### 3. Get Firebase Configuration

1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click on the web icon (`</>`) to add a web app
4. Register your app and copy the configuration object

### 4. Create Environment File

Create a `.env` file in the `myapp` directory:

```env
REACT_APP_FIREBASE_API_KEY=AIza...
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abc123
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
REACT_APP_FIREBASE_APP_CHECK_SITE_KEY=your-recaptcha-site-key
```

### 5. Initialize Firebase CLI

```bash
npm install -g firebase-tools
firebase login
firebase init
```

When prompted, select:
- ✅ Firestore
- ✅ Functions
- ✅ Storage
- ✅ Hosting

**Important**: 
- Use the existing `firestore.rules` and `storage.rules` files
- Set public directory to `build`
- Configure as single-page app: **Yes**

### 6. Deploy Security Rules

```bash
firebase deploy --only firestore:rules,storage:rules
```

### 7. Deploy Cloud Functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 8. Create First Admin User

**Option 1: Using Firebase Console**

1. Register a user through the app
2. Go to Firebase Console > Authentication > Users
3. Note the user's UID
4. Go to Firestore Database > `users` collection
5. Find the user document and update:
   - Set `role: "admin"`
6. Go to Authentication > Users > Select user > Custom claims
7. Add custom claim: `role` = `admin`

**Option 2: Using Cloud Function (after first admin is set)**

1. Login as admin
2. Go to Admin Dashboard > Manage Users
3. Edit any user and set role to "admin"

### 9. Run the Application

```bash
npm start
```

The app will open at `http://localhost:3000`

### 10. Deploy to Production

```bash
npm run build
firebase deploy
```

## Troubleshooting

### Issue: "Permission denied" errors

**Solution**: 
- Ensure security rules are deployed: `firebase deploy --only firestore:rules,storage:rules`
- Check that user has proper role in custom claims
- Verify user is not blocked in Firestore

### Issue: Cloud Functions not working

**Solution**:
- Deploy functions: `firebase deploy --only functions`
- Check Node.js version (should be 18)
- View logs: `firebase functions:log`

### Issue: App Check errors

**Solution**:
- App Check is optional for development
- For production, set up reCAPTCHA v3 in Firebase Console
- Add site key to `.env` file

### Issue: QR codes not generating

**Solution**:
- Ensure `qrcode.react` is installed: `npm install qrcode.react`
- Check browser console for errors

## Testing the Application

### Test Admin Features

1. Login as admin
2. Navigate to Admin Dashboard
3. Test user management
4. Test employee management
5. View activity logs
6. Manage card templates

### Test Employee Features

1. Login as employee
2. Generate visiting card
3. Generate visitor card
4. View visitor history

## Next Steps

- Customize card templates
- Add more card designs
- Configure email notifications
- Set up analytics
- Customize branding

