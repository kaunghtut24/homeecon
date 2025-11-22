# Deployment Guide

This guide covers deploying HomeEcon to various platforms.

## Table of Contents
- [Firebase Hosting](#firebase-hosting)
- [Vercel](#vercel)
- [Netlify](#netlify)
- [Environment Variables](#environment-variables)
- [Firestore Security Rules](#firestore-security-rules)

## Firebase Hosting

Firebase Hosting is the recommended deployment platform as it integrates seamlessly with Firebase Authentication and Firestore.

### Prerequisites
- Firebase CLI installed: `npm install -g firebase-tools`
- Firebase project created at [Firebase Console](https://console.firebase.google.com/)

### Steps

1. **Login to Firebase**
   ```bash
   firebase login
   ```

2. **Initialize Firebase in your project**
   ```bash
   firebase init
   ```
   
   Select:
   - Hosting
   - Use existing project (select your Firebase project)
   - Public directory: `dist`
   - Single-page app: `Yes`
   - GitHub integration: Optional

3. **Build the app**
   ```bash
   npm run build
   ```

4. **Deploy**
   ```bash
   firebase deploy
   ```

5. **Access your app**
   
   Your app will be available at: `https://your-project-id.web.app`

### Continuous Deployment

Set up GitHub Actions for automatic deployment:

Create `.github/workflows/firebase-hosting.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_GEMINI_API_KEY: ${{ secrets.VITE_GEMINI_API_KEY }}
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
      
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
          projectId: your-project-id
```

## Vercel

Vercel offers easy deployment with automatic HTTPS and global CDN.

### Steps

1. **Install Vercel CLI** (optional)
   ```bash
   npm install -g vercel
   ```

2. **Deploy via CLI**
   ```bash
   vercel
   ```
   
   Or connect your GitHub repository at [vercel.com](https://vercel.com)

3. **Configure Environment Variables**
   
   In Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add all `VITE_*` variables from your `.env` file

4. **Build Settings**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

## Netlify

Netlify provides simple deployment with form handling and serverless functions.

### Steps

1. **Deploy via Git**
   
   Connect your repository at [netlify.com](https://netlify.com)

2. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Environment Variables**
   
   In Netlify dashboard:
   - Go to Site Settings → Build & Deploy → Environment
   - Add all `VITE_*` variables

4. **Create `netlify.toml`** (optional)
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

## Environment Variables

### Required Variables

```env
# Google AI (Required for AI features)
VITE_GEMINI_API_KEY=your_gemini_api_key

# Firebase (Required for production)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Security Best Practices

1. **Never commit `.env` to version control**
   - Already included in `.gitignore`

2. **Use platform-specific secret management**
   - Firebase: Environment config
   - Vercel: Environment Variables UI
   - Netlify: Environment Variables UI

3. **Rotate API keys regularly**

## Firestore Security Rules

Set up proper security rules in Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // User profiles
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Families
    match /families/{familyId} {
      allow read: if request.auth != null && 
                     request.auth.uid in resource.data.memberIds;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
                       request.auth.uid in resource.data.memberIds;
    }
    
    // Transactions
    match /transactions/{transactionId} {
      // Allow read if user owns it or is in the family
      allow read: if request.auth != null && 
                     (resource.data.userId == request.auth.uid ||
                      (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.familyId == resource.data.familyId));
      
      // Allow create if authenticated
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid;
      
      // Allow update/delete only if owner
      allow update, delete: if request.auth != null && 
                               resource.data.userId == request.auth.uid;
    }
    
    // User settings (budgets)
    match /user_settings/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Firebase Authentication Setup

1. Go to Firebase Console → Authentication
2. Enable Email/Password sign-in method
3. (Optional) Configure email templates for password reset
4. (Optional) Add authorized domains for production URL

## Performance Optimization

### Build Optimization

1. **Enable production build**
   ```bash
   npm run build
   ```

2. **Analyze bundle size**
   ```bash
   npm run build -- --mode analyze
   ```

3. **Enable compression** (automatic on most platforms)

### Caching Strategy

Most platforms (Vercel, Netlify, Firebase) automatically configure optimal caching headers for static assets.

## Monitoring & Analytics

### Firebase Analytics

Add to your Firebase config:

```typescript
import { getAnalytics } from "firebase/analytics";

const analytics = getAnalytics(app);
```

### Error Tracking

Consider integrating:
- Sentry for error tracking
- LogRocket for session replay
- Google Analytics for user behavior

## Troubleshooting

### Build Failures

**Issue**: Environment variables not found
- **Solution**: Ensure all `VITE_*` variables are set in platform settings

**Issue**: Firebase initialization error
- **Solution**: Verify Firebase credentials are correct

### Runtime Issues

**Issue**: 404 on page refresh
- **Solution**: Configure SPA redirects (see platform-specific sections)

**Issue**: CORS errors
- **Solution**: Check Firebase security rules and authentication

## Rollback Strategy

### Firebase Hosting
```bash
firebase hosting:rollback
```

### Vercel
Use the Vercel dashboard to redeploy a previous deployment

### Netlify
Use the Netlify dashboard to restore a previous deploy

## Cost Estimation

### Firebase (Free Tier)
- 50,000 reads/day
- 20,000 writes/day
- 1 GB storage
- 10 GB/month transfer

### Vercel (Hobby - Free)
- 100 GB bandwidth/month
- Unlimited deployments

### Netlify (Free)
- 100 GB bandwidth/month
- 300 build minutes/month

## Support

For deployment issues:
1. Check platform-specific documentation
2. Review error logs in platform dashboard
3. Open an issue on GitHub

---

**Recommended**: Start with Firebase Hosting for seamless integration with Firebase services.
