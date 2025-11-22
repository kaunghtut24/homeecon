<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# HomeEcon - Family Financial Management

A modern, AI-powered family finance management application built with React, TypeScript, and Firebase. Track expenses, manage budgets, share finances with family members, and get intelligent insights into your spending habits.

## ✨ Features

### 🔐 Authentication & User Management
- Email/password authentication via Firebase
- Mock mode for local testing without Firebase
- User profiles with display names
- Secure data isolation per user/family

### 👨‍👩‍👧‍👦 Family Sharing
- Create or join family groups with unique codes
- Share expenses and income across family members
- View consolidated family financial data
- Track who made each transaction
- Easy family invitation sharing via Web Share API

### 💰 Budget Management
- **Dynamic Categories**: Add, edit, hide, or remove budget categories
- **Manual Budget Control**: Set custom budget limits for each category
- **Rollover Savings**: Track cumulative savings across months
- **Visual Progress**: Color-coded envelope system showing budget vs. actual spending
- **Custom Categories**: Create personalized categories with custom colors

### 📊 Smart Analytics
- Monthly, quarterly, and yearly expense trends
- Category-wise spending breakdown
- AI-powered financial insights and recommendations
- Interactive charts and visualizations
- Opening balance tracking with rollover

### 🤖 AI-Powered Features
- Smart receipt scanning with Google Gemini AI
- Automatic expense categorization
- Intelligent budget recommendations
- Natural language expense entry

### 💱 Multi-Currency Support
- Support for 8+ major currencies (USD, EUR, GBP, JPY, CAD, AUD, INR, MMK)
- Real-time currency conversion
- Automatic normalization to home currency
- Manual exchange rate updates

### 📱 Modern UI/UX
- Responsive design (mobile & desktop)
- Dark mode support
- Smooth animations and transitions
- Intuitive navigation
- Contextual tooltips

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase account (optional, for production deployment)
- Google AI Studio API key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd homeecon
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Required for AI features
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   
   # Optional: Firebase configuration (leave empty for mock mode)
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:3000`

## 🔧 Configuration

### Mock Mode vs. Firebase Mode

**Mock Mode** (Default):
- No Firebase credentials required
- Data stored in browser's localStorage
- Perfect for local development and testing
- Automatically enabled when Firebase credentials are not provided

**Firebase Mode**:
- Requires Firebase project setup
- Data persisted in Firestore
- Supports real-time sync across devices
- Required for production deployment

### Firebase Setup (Optional)

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password provider)
3. Create a Firestore database
4. Copy your Firebase config and add to `.env`
5. Set up Firestore security rules (see `DEPLOYMENT.md`)

## 📖 Usage

### Getting Started

1. **Sign Up / Sign In**
   - Create a new account or sign in with existing credentials
   - Optionally join a family using a family code during signup

2. **Dashboard Overview**
   - View monthly income, expenses, and net savings
   - See budget envelopes with spending progress
   - Track your total savings pool (rollover balance)

3. **Add Transactions**
   - **Smart Scan**: Upload receipt images for AI-powered extraction
   - **Manual Entry**: Add income or expenses manually
   - Categorize items and set currency

4. **Manage Budgets**
   - Navigate to "Categories" tab
   - Edit budget limits by clicking on the amount
   - Add custom categories with "+ Add Category"
   - Hide/show categories using the eye icon

5. **Family Sharing**
   - Go to "Settings" tab
   - Create a family or join with a code
   - Share your family code via "Share Invite"
   - View family members' transactions on dashboard

6. **Generate Reports**
   - Click "Report" button on dashboard
   - Choose period: Month, Quarter, or Year
   - Download PDF report with detailed breakdown

## 🏗️ Project Structure

```
homeecon/
├── components/          # React components
│   ├── DashboardView.tsx
│   ├── ScanView.tsx
│   ├── CategorySettingsView.tsx
│   ├── FamilySettingsView.tsx
│   └── ...
├── context/            # React context providers
│   ├── AppContext.tsx
│   └── AuthContext.tsx
├── services/           # Business logic & API calls
│   ├── firebase.ts
│   ├── geminiService.ts
│   ├── BudgetService.ts
│   ├── FamilyService.ts
│   └── pdfService.ts
├── types.ts            # TypeScript type definitions
├── constants.ts        # App constants
└── App.tsx             # Main app component
```

## 🚢 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions including:
- Firebase Hosting setup
- Vercel deployment
- Netlify deployment
- Environment configuration
- Security rules

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Vanilla CSS with modern design patterns
- **Backend**: Firebase (Authentication + Firestore)
- **AI**: Google Gemini API
- **Charts**: Recharts
- **PDF Generation**: jsPDF

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Google Gemini AI for intelligent expense extraction
- Firebase for backend infrastructure
- React team for the amazing framework

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ using Google AI Studio
