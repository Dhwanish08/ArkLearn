# ArkLearn: Smart Class Command Platform

ArkLearn is a modern, AI-powered educational platform designed to enhance the learning experience for students, teachers, and administrators. It integrates curricula-aligned AI tools, comprehensive dashboard management, and interactive learning modules.

## 🚀 Key Features

### 🤖 AI-Powered Learning
- **Textbook Learning Assistant**: Analyze textbook chapters to generate summaries, key points, practice questions, and flashcards.
- **Socratic Tutor**: A context-aware AI tutor that guides students through concepts using their own textbook content.
- **Multi-language Support**: Study in English, Gujarati, Hindi, or Sanskrit.

### 📋 Administrative & Management
- **Universal Dashboard**: Tailored experiences for Students, Teachers, and Administrators.
- **Timetable Management**: Efficient scheduling and CSV-based timetable uploads.
- **User Management**: Comprehensive role-based access control and user profile management.
- **Leaderboards**: Gamified learning with student performance tracking.

## 🛠️ Tech Stack
- **Frontend**: React, Vite, TypeScript, Tailwind CSS, shadcn/ui.
- **Backend/Cloud**: Firebase (Authentication, Firestore, Cloud Functions).
- **AI Integration**: Google Gemini AI (via Cloud Functions and direct API integration).
- **Icons & UI**: Lucide React, Recharts.

## 📦 Getting Started

### Prerequisites
- Node.js & npm/bun installed.
- A Firebase project and Google Gemini API key.

### Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/Dhwanish08/ArkLearn.git
   cd ArkLearn
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Set up environment variables:
   Create a `.env` file in the root directory and add your Firebase and Gemini credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_GEMINI_API_KEY=your_gemini_key
   ... (see .env.example)
   ```

### Development
Start the development server:
```sh
npm run dev
```

## 📖 Deployment
The project is configured for deployment on Vercel and Firebase.
- **Vercel**: `npm run build` generates the `dist` folder.
- **Firebase Functions**: `npm run --prefix functions deploy`.

## 🛡️ License
Private project. All rights reserved.

---
*Built with ❤️ for Smarter Learning.*
