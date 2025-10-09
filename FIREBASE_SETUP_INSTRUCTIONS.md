# Instructions for Setting Up Firebase Environment Variables
# 
# 1. Copy this file to .env.local
# 2. Go to your Firebase Console: https://console.firebase.google.com/
# 3. Select your project
# 4. Go to Project Settings (gear icon) -> General tab
# 5. Scroll down to "Your apps" section
# 6. Find your web app and copy the config values
# 7. Fill in the values below:

NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Example (these are fake values):
# NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDOCAbC123456789012345678901234567890
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=my-project.firebaseapp.com
# NEXT_PUBLIC_FIREBASE_PROJECT_ID=my-project
# NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=my-project.appspot.com
# NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
# NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456789012345
# NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ABCDEFGHIJ