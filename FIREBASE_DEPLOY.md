# Firebase Deployment Steps

## Prerequisites Completed ✅
- ✅ Firebase CLI installed
- ✅ Logged in to Firebase
- ✅ Configuration files created

## Next Steps

### 1. Complete Firebase Login (If Needed)

The `firebase login --reauth` command opened a browser window. Please:
1. Complete the authentication in your browser
2. Grant Firebase CLI the necessary permissions
3. Return to the terminal

### 2. Get Your Firebase Project ID

**Option A: Use Existing Project**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Copy the Project ID from the project settings

**Option B: Create New Project via CLI**
```bash
firebase projects:create
```

### 3. Update `.firebaserc`

Edit the `.firebaserc` file and replace `"your-project-id"` with your actual Firebase project ID:

```json
{
  "projects": {
    "default": "homeecon-12345"
  }
}
```

### 4. Build the Application

```bash
npm run build
```

This creates the `dist` folder with production-ready files.

### 5. Deploy to Firebase

```bash
firebase deploy
```

Or deploy only hosting:
```bash
firebase deploy --only hosting
```

### 6. Access Your Deployed App

After deployment, Firebase will provide URLs:
- **Live URL**: `https://your-project-id.web.app`
- **Custom Domain**: Can be configured in Firebase Console

## Troubleshooting

### Error: "Failed to list Firebase projects"

**Solution 1: Re-authenticate**
```bash
firebase logout
firebase login
```

**Solution 2: Use specific project**
```bash
firebase use --add
```
Then select your project from the list.

**Solution 3: Manual project selection**
```bash
firebase use your-project-id
```

### Error: "No Firebase project directory"

Make sure you're in the correct directory:
```bash
cd c:\Users\an_hu\Desktop\Development\homeecon
```

### Build Errors

If `npm run build` fails:
1. Check for TypeScript errors: `npm run type-check`
2. Clear cache: `rm -rf node_modules dist && npm install`
3. Check `.env` file for required variables

## Environment Variables for Production

Before deploying, ensure your `.env` file has:

```env
VITE_GEMINI_API_KEY=your_actual_api_key
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Note**: Environment variables are baked into the build, so rebuild after changing them.

## Post-Deployment Checklist

- [ ] Test the deployed app at the Firebase URL
- [ ] Verify authentication works
- [ ] Test creating transactions
- [ ] Test family sharing features
- [ ] Check category management
- [ ] Verify AI receipt scanning (requires Gemini API key)

## Continuous Deployment (Optional)

Set up GitHub Actions for automatic deployment on push:

See `DEPLOYMENT.md` for GitHub Actions workflow configuration.

## Support

If you encounter issues:
1. Check `firebase-debug.log` for detailed errors
2. Verify Firebase project settings in console
3. Ensure billing is enabled for Firebase (free tier is sufficient)
4. Check Firestore security rules are properly configured

---

**Quick Deploy Command:**
```bash
npm run build && firebase deploy
```
