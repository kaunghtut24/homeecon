# AI Features Setup - Quick Start

## ✅ How AI Features Work

The app uses **Google Gemini AI** to:
- 📸 **Scan receipts** - Upload a receipt image and automatically extract:
  - Merchant name
  - Date
  - Currency
  - Line items with amounts
  - Automatic categorization (Groceries, Utilities, Entertainment, etc.)
  - Subtotal, tax, and total amounts

## 🔑 Getting Your Gemini API Key

1. **Visit Google AI Studio**: https://aistudio.google.com/app/apikey
2. **Sign in** with your Google account
3. **Click "Create API Key"**
4. **Copy the key** (starts with `AIza...`)

## ⚙️ Configuration

### Local Development

1. **Create `.env` file** in project root:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

2. **Restart dev server**:
   ```bash
   npm run dev
   ```

### Production Deployment

The API key is embedded at **build time**, so:

1. **Ensure `.env` file exists** with `VITE_GEMINI_API_KEY`
2. **Build the app**:
   ```bash
   npm run build
   ```
3. **Deploy to Firebase**:
   ```bash
   firebase deploy --only hosting
   ```

## 🧪 Testing AI Features

1. **Start the app**: `npm run dev`
2. **Go to "Scan" tab**
3. **Click "Upload Receipt"** or drag & drop an image
4. **Wait for processing** (usually 2-5 seconds)
5. **Verify extracted data** appears in the form
6. **Edit if needed** and save

## ❌ Troubleshooting

### "Missing API_KEY" Error

- ✅ Check `.env` file exists in project root
- ✅ Verify `VITE_GEMINI_API_KEY=your_key` (no spaces around `=`)
- ✅ Restart dev server after adding/changing key
- ✅ For production: Rebuild after changing key

### "Failed to analyze receipt" Error

- ✅ Check internet connection
- ✅ Verify API key is valid (not expired/revoked)
- ✅ Try a different receipt image (clear, well-lit)
- ✅ Check browser console for detailed error

### AI Features Not Working After Deployment

- ✅ Rebuild the app: `npm run build`
- ✅ API key must be in `.env` before building
- ✅ Redeploy: `firebase deploy --only hosting`
- ✅ Clear browser cache and reload

## 📝 Notes

- **API Key Security**: The key is embedded in the client bundle (this is acceptable for Gemini API)
- **Rate Limits**: Google AI Studio has free tier limits
- **Image Format**: Supports JPEG, PNG, WebP
- **Image Size**: Large images are automatically compressed

## 🔗 Related Documentation

- Full deployment guide: `FIREBASE_DEPLOYMENT_GUIDE.md`
- General deployment: `DEPLOYMENT.md`
- Main README: `README.md`

