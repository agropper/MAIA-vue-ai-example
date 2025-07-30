# How to Find Your Cloudant Username and Password

## Step-by-Step Guide

### Step 1: Access Your Cloudant Instance
1. Go to [IBM Cloud Console](https://cloud.ibm.com/)
2. Sign in to your IBM Cloud account
3. In the left sidebar, click **Resource list**
4. Find your Cloudant instance (named `maia-cloudant` or similar)
5. Click on your Cloudant instance name

### Step 2: Navigate to Service Credentials
1. In your Cloudant instance dashboard, look for the left sidebar menu
2. Click on **Service credentials** (or **Credentials**)
3. You should see a list of credentials

### Step 3: View or Create Credentials
**Option A: Use Existing Credentials**
1. If you see existing credentials, click **View credentials**
2. Look for the **username** and **password** fields
3. Copy these values

**Option B: Create New Credentials**
1. Click **New credential** or **Create credential**
2. Give it a name like `maia-cloudant-credentials`
3. Click **Add** or **Create**
4. Click **View credentials** to see the details

### Step 4: Find Your Connection Details
In the credentials JSON, look for these fields:

```json
{
  "username": "your-username-here",
  "password": "your-password-here",
  "url": "https://your-instance.cloudant.com",
  "host": "your-instance.cloudant.com",
  "port": 443,
  "https": true
}
```

### Step 5: Copy the Values
You need these specific values:
- **Username**: The `username` field
- **Password**: The `password` field  
- **URL**: The `url` field (starts with `https://`)

## Alternative: Using the Cloudant Dashboard

### Step 1: Access Cloudant Dashboard
1. In your Cloudant instance, click **Launch Cloudant Dashboard**
2. This opens the Cloudant web interface

### Step 2: Find API Key
1. In the Cloudant dashboard, look for **API Keys** or **Account**
2. You'll see your API key (username) and password
3. These are the same credentials you need

## Common Issues and Solutions

### Issue: "No credentials found"
**Solution:**
1. Go back to your Cloudant instance
2. Click **Service credentials**
3. Click **New credential**
4. Create a new credential with default settings

### Issue: "Credentials don't work"
**Solution:**
1. Make sure you're copying the exact values (no extra spaces)
2. Check that the URL starts with `https://`
3. Verify the username and password are from the same credential set

### Issue: "Can't find the credentials section"
**Solution:**
1. Make sure you're in the correct Cloudant instance
2. Look for **Service credentials** in the left sidebar
3. If not visible, try **Manage** → **Service credentials**

## Example Credentials Format

Your credentials should look something like this:

```bash
# In your .env file
CLOUDANT_URL=https://abc123def456-ghijklmnop.cloudant.com
CLOUDANT_USERNAME=abc123def456-ghijklmnop
CLOUDANT_PASSWORD=your-actual-password-here
CLOUDANT_DATABASE=maia_chats
```

## Security Notes

⚠️ **Important Security Tips:**
- Never commit credentials to git
- Use environment variables (not hardcoded values)
- Rotate passwords regularly
- Use different credentials for development vs production

## Testing Your Credentials

Once you have your credentials, test them:

```bash
cd MAIA-vue-ai-example
npm run test-cloudant
```

This will verify that your credentials work correctly with your Cloudant instance.

## Still Having Trouble?

If you can't find your credentials:

1. **Check the IBM Cloud documentation**: [Cloudant Credentials](https://cloud.ibm.com/docs/Cloudant?topic=Cloudant-creating-an-ibm-cloudant-instance-on-ibm-cloud)
2. **Contact IBM Support**: Available in the IBM Cloud console
3. **Create a new instance**: If needed, you can create a fresh Cloudant instance

The credentials are essential for connecting MAIA to your Cloudant database, so make sure to copy them accurately! 