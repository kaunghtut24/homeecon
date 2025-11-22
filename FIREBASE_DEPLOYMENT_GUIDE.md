# Firebase Deployment Guide for HomeEcon

This guide walks you through deploying HomeEcon to Firebase Hosting with Gemini API key configuration.

## Prerequisites

1. **Firebase CLI installed**
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase account** - Create one at [Firebase Console](https://console.firebase.google.com/)

3. **Google AI Studio API Key** - Get one at [Google AI Studio](https://aistudio.google.com/app/apikey)

## Step 1: Get Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key (you'll need this later)

## Step 2: Set Up Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select existing project
3. Follow the setup wizard:
   - Enter project name (e.g., "homeecon")
   - Enable Google Analytics (optional)
   - Complete setup

## Step 3: Initialize Firebase in Your Project

1. **Login to Firebase CLI**
   ```bash
   firebase login
   ```

2. **Initialize Firebase**
   ```bash
   firebase init
   ```

3. **Select the following options:**
   - ✅ **Hosting**: Configure files for Firebase Hosting
   - ✅ **Firestore**: Configure security rules and indexes files
   - Select your Firebase project from the list
   - **Public directory**: `dist`
   - **Single-page app**: `Yes`
   - **Set up automatic builds**: `No` (we'll do manual deployment)
   - **Overwrite index.html**: `No` (if it exists)

## Step 4: Configure Environment Variables

### For Local Development

Create a `.env` file in the project root:

```env
# Required for AI features
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**To get Firebase config:**
1. Go to Firebase Console → Project Settings → General
2. Scroll to "Your apps" section
3. Click the web icon (`</>`) to add a web app
4. Copy the config values

### For Production Deployment

Firebase Hosting doesn't support `.env` files directly. You have two options:

#### Option A: Build with Environment Variables (Recommended)

Build locally with your `.env` file, then deploy:

```bash
# Make sure .env file exists with VITE_GEMINI_API_KEY
npm run build
firebase deploy --only hosting
```

#### Option B: Use Firebase Functions (Advanced)

For dynamic environment variables, you'd need to use Firebase Functions, which is more complex.

## Step 5: Deploy Firestore Rules and Indexes

1. **Deploy Security Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Deploy Indexes**
   ```bash
   firebase deploy --only firestore:indexes
   ```

   Or deploy both at once:
   ```bash
   firebase deploy --only firestore
   ```

## Step 6: Build and Deploy the Application

1. **Build the application**
   ```bash
   npm run build
   ```
   
   This creates a `dist` folder with the production build.

2. **Deploy to Firebase Hosting**
   ```bash
   firebase deploy --only hosting
   ```

   Or deploy everything:
   ```bash
   firebase deploy
   ```

## Step 7: Verify Deployment

1. Your app will be available at:
   - `https://your-project-id.web.app`
   - `https://your-project-id.firebaseapp.com`

2. **Test AI Features:**
   - Sign up/Login
   - Go to "Scan" tab
   - Upload a receipt image
   - Verify it extracts data correctly

3. **Check Browser Console:**
   - Open DevTools (F12)
   - Check for any errors
   - Verify API key is loaded (should not see "Missing API_KEY" error)

## Troubleshooting

### AI Features Not Working

1. **Check API Key:**
   - Verify `.env` file has `VITE_GEMINI_API_KEY` set
   - Rebuild after adding/changing the key: `npm run build`
   - Check browser console for "Missing API_KEY" errors

2. **Verify Build:**
   - The API key is embedded at build time
   - You must rebuild after changing the key
   - Check `dist` folder was updated

3. **Test Locally First:**
   ```bash
   npm run dev
   # Test receipt scanning
   # If it works locally, build and deploy
   ```

### Firestore Errors

1. **Index Errors:**
   - Deploy indexes: `firebase deploy --only firestore:indexes`
   - Wait for indexes to finish building (can take a few minutes)
   - Check Firebase Console → Firestore → Indexes

2. **Permission Errors:**
   - Deploy rules: `firebase deploy --only firestore:rules`
   - Verify rules match your `firestore.rules` file

### Deployment Issues

1. **Build Fails:**
   - Check Node.js version (v16+)
   - Run `npm install` to ensure dependencies are installed
   - Check for TypeScript errors: `npm run build`

2. **Deploy Fails:**
   - Verify you're logged in: `firebase login`
   - Check project ID matches: `firebase use --add`
   - Verify `firebase.json` is configured correctly

## Continuous Deployment (Optional)

For automatic deployment on git push, see `DEPLOYMENT.md` for GitHub Actions setup.

## Security Notes

⚠️ **Important:**
- Never commit `.env` file to git (it's in `.gitignore`)
- API keys in the built app are visible in the client bundle
- This is acceptable for Gemini API (client-side usage is supported)
- Consider rate limiting on the API key in Google AI Studio

## Quick Reference Commands

```bash
# Login to Firebase
firebase login

# Initialize Firebase
firebase init

# Build the app
npm run build

# Deploy everything
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy only Firestore indexes
firebase deploy --only firestore:indexes

# View deployment history
firebase hosting:channel:list

# Check current project
firebase projects:list
```

## Next Steps

After successful deployment:

1. ✅ Test all features (signup, transactions, AI scanning)
2. ✅ Set up custom domain (optional)
3. ✅ Configure Firebase Authentication authorized domains
4. ✅ Monitor usage in Firebase Console
5. ✅ Set up Firebase Analytics (optional)

---

**Need Help?** Check the main `README.md` or `DEPLOYMENT.md` for more details.

