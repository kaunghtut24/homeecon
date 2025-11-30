# Securing Your API Key (Without Backend)

Since you are using the Gemini API directly from a client-side application (browser) without a backend proxy (like Cloud Functions), your API key is technically visible to anyone who inspects the network traffic.

**To prevent unauthorized usage and stop the "Exposed API Key" alerts from Google, you MUST apply HTTP Referrer Restrictions.**

## Step-by-Step Guide

1.  **Go to Google Cloud Console**
    *   Visit: [https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
    *   Select your project.

2.  **Find Your API Key**
    *   Locate the API key you are using for Gemini (it starts with `AIza`).
    *   Click on the **Edit** icon (pencil) or the name of the key.

3.  **Set Application Restrictions**
    *   Under **"Application restrictions"**, select **Websites**.
    *   Click **"Add"** (or "Add Item").
    *   Add the following entries:
        *   `http://localhost:3000/*` (For local development)
        *   `https://<your-project-id>.web.app/*` (For Firebase Hosting)
        *   `https://<your-project-id>.firebaseapp.com/*` (For Firebase Hosting)
        *   Any other custom domains you use.

4.  **Set API Restrictions (Optional but Recommended)**
    *   Under **"API restrictions"**, select **Restrict key**.
    *   In the dropdown, select **Generative Language API** (or "Gemini API").
    *   Click **Save**.

## Why This Works
*   **Browser Enforcement**: When a request comes from a browser, it includes a `Referer` header matching your website. Google checks this header against your allowed list.
*   **Abuse Prevention**: Even if someone copies your key, they cannot use it from their own website because the `Referer` won't match.
*   **Quota Management**: This ensures only *your* app consumes your quota.

## Important Notes
*   **Do NOT commit `.env` files**: Ensure `.env` is in your `.gitignore`.
*   **Do NOT hardcode keys**: Always use `import.meta.env.VITE_GEMINI_API_KEY`.
*   **Alerts**: You might still see a warning in the Google Cloud Console saying "Your key is exposed" if Google found it in a public GitHub repo previously. If so, **rotate the key** (create a new one) and apply the restrictions immediately to the new key.
