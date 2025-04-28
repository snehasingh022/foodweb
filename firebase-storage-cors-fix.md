# Complete Firebase Storage CORS Fix

You're still encountering CORS errors with your Firebase Storage. Let's solve this with a comprehensive approach:

## Step 1: Install Google Cloud SDK
Download and install from: https://cloud.google.com/sdk/docs/install

## Step 2: Configure CORS with gsutil
After installing Google Cloud SDK:

1. Open Command Prompt or PowerShell as Administrator
2. Execute these commands:

```bash
# Login to your Google account
gcloud auth login

# Initialize the configuration
gcloud init

# Select your project when prompted

# Set CORS for your Firebase Storage bucket using the updated cors.json
gsutil cors set cors.json gs://foodweb-world.appspot.com
```

## Step 3: Update Firebase Storage Rules
1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project
3. Go to Storage > Rules
4. Replace the rules with the content from the firebase-storage-rules.txt file:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      // Allow public read and write access during development
      allow read, write: if true;
    }
  }
}
```

5. Click "Publish"

## Step 4: Check Firebase App Initialization

Make sure your Firebase app initialization has the correct values in both configuration files:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyDsLezwK8WE2rVAY_fxUBfyEt5rpSH0ZE0",
  authDomain: "foodweb-world.firebaseapp.com",
  projectId: "foodweb-world",
  storageBucket: "foodweb-world.appspot.com", // This should match your bucket name
  messagingSenderId: "766590226062",
  appId: "1:766590226062:web:acd3a01063bccd15cb03df",
  measurementId: "G-HF25RR23JN"
};
```

## Step 5: Fix Storage References in Media and Graphics Pages

When uploading files, make sure that your code uses the correct path format. For uploads, use:

```typescript
const storageRef = ref(mediaStorage, `media/${fileName}`);
```

Don't include the bucket name or full URL in the storage reference.

## Step 6: Clear Cache and Restart
1. Clear browser cache completely (or use Incognito mode)
2. Restart your development server
3. Try uploading again

## For Production Use
After development, consider changing the Storage Rules to be more restrictive:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

This will ensure only authenticated users can upload files. 