# Firebase Setup Instructions for Multiplication Table App

## Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Create a project"
3. Enter project name: `multiplication-table-app`
4. Disable Google Analytics (not needed for this app)
5. Click "Create project"

## Step 2: Enable Firestore Database

1. In your Firebase console, click "Firestore Database" from the left menu
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location closest to you (e.g., europe-west1 for Europe)
5. Click "Done"

## Step 3: Get Firebase Configuration

1. Click the gear icon (⚙️) → "Project settings"
2. Scroll down to "Your apps" section
3. Click the web icon `</>` to add a web app
4. Enter app nickname: `multiplication-table-app`
5. Don't check "Firebase Hosting" (not needed)
6. Click "Register app"
7. **COPY the firebaseConfig object** - it looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
};
```

## Step 4: Update Firebase Config File

Replace the content in `src/environments/firebase.config.ts` with your actual config:

```typescript
// Replace this entire file content with:
export const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

## Step 5: Set Firestore Security Rules (Optional but Recommended)

1. In Firebase console, go to "Firestore Database"
2. Click "Rules" tab
3. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /scores/{document} {
      allow read, write: if true;
    }
  }
}
```

4. Click "Publish"

## That's it!

Once you complete these steps, the app will automatically use Firebase for cloud storage.

## Testing

- Scores will be saved to Firestore
- The leaderboard will show scores from all users
- Data persists across devices and browsers
