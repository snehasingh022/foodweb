# Firebase Storage CORS Setup Guide

You're encountering CORS errors when trying to upload files to your Firebase Storage from your local development environment. The error is happening because Firebase Storage requires explicit CORS configuration to allow uploads from different origins (like localhost).

## Solution:

You'll need to use Google Cloud SDK to configure CORS for your Firebase Storage bucket.

### Step 1: Install Google Cloud SDK
Download and install the Google Cloud SDK from here: https://cloud.google.com/sdk/docs/install

### Step 2: Create CORS configuration file
Create a file named `cors.json` (this file has already been created for you with the following content):

```json
[
  {
    "origin": ["http://localhost:3000", "https://foodweb-world.firebaseapp.com", "https://foodweb-world.web.app"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type", "Content-Disposition", "Content-Length"],
    "maxAgeSeconds": 3600
  }
]
```

### Step 3: Login to Google Cloud
Open a command prompt and run:
```
gcloud auth login
```

Follow the prompts to sign in to your Google account.

### Step 4: Set the CORS configuration for your bucket
Run the following command (replace the bucket name with your Firebase Storage bucket):
```
gsutil cors set cors.json gs://foodweb-world.appspot.com
```

### Step 5: Verify the configuration
You can verify your CORS settings with:
```
gsutil cors get gs://foodweb-world.appspot.com
```

This should return the configuration you just set.

### Additional Notes:
- You might need to clear your browser cache after setting up CORS.
- Make sure the project selected in Google Cloud SDK matches your Firebase project.
- If you're still having issues, try adding more response headers such as `Authorization`, `Content-Range`, `Accept`.

## Fixing authDomain in Firebase Config

Additionally, looking at your error message, there might be an issue with the `authDomain` in your Firebase configuration. Make sure your Firebase configuration includes the correct `authDomain`. The `authDomain` should be a string, not an array:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDsLezwK8WE2rVAY_fxUBfyEt5rpSH0ZE0",
  authDomain: "foodweb-world.firebaseapp.com", // This should be a string, not an array
  projectId: "foodweb-world",
  storageBucket: "foodweb-world.firebasestorage.app",
  messagingSenderId: "766590226062",
  appId: "1:766590226062:web:acd3a01063bccd15cb03df",
  measurementId: "G-HF25RR23JN"
};
```

Check your Firebase configuration in both firebase-media.tsx and firebase-graphics.tsx files to ensure they have the correct format. 