# Deployment Guide for Protomind on Render

## Prerequisites
- Render account (https://render.com)
- MongoDB Atlas account (https://www.mongodb.com/cloud/atlas) - FREE tier available
- GitHub account (already connected)

## Step 1: Create MongoDB Atlas Database

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up or log in
3. Click "Create" to create a new project
4. Click "Create Deployment" and select "M0 (Free)" cluster
5. Choose AWS and your preferred region
6. Create a database user:
   - Go to "Database Access" → "Add New Database User"
   - Username: `leadcrm_user`
   - Password: (generate a strong password and copy it)
   - Click "Add User"
7. Whitelist your IP:
   - Go to "Network Access" → "Add IP Address"
   - Click "Allow Access from Anywhere" (or add your specific IPs)
   - Click "Confirm"
8. Get your connection string:
   - In "Deployment" → "Drivers" → "NodeJS"
   - Copy the connection string (it looks like: `mongodb+srv://username:password@cluster...`)
   - Replace `<password>` with your database user password
   - Replace `myFirstDatabase` with `leadcrm`
   - Save this string - you'll need it in Step 3

## Step 2: Deploy on Render

1. Go to https://render.com/dashboard
2. Click "New" → "Web Service"
3. Connect your GitHub account if not already done
4. Select the repository: `hackvnr`
5. Configure the service:
   - **Name**: `protomind-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd mah/backend && npm install`
   - **Start Command**: `cd mah/backend && npm start`
   - **Instance Type**: Free (for testing)
   - Click "Create Web Service"

## Step 3: Configure Environment Variables

Once the backend is created:

1. Go to the service settings
2. Click "Environment" on the left
3. Add these environment variables:
   - **Key**: `MONGODB_URI`
     **Value**: Your MongoDB Atlas connection string (from Step 1)
   - **Key**: `NODE_ENV`
     **Value**: `production`
   - **Key**: `PORT`
     **Value**: `5000`

4. Click "Save Changes"

The backend will auto-redeploy with the new environment variables.

## Step 4: Deploy the Frontend

1. In your Render dashboard, click "New" → "Static Site"
2. Connect to the same `hackvnr` repository
3. Configure the service:
   - **Name**: `protomind-frontend`
   - **Build Command**: `cd mah/frontend && npm install && npm run build`
   - **Publish Directory**: `mah/frontend/dist`
   - Click "Create Static Site"

4. Wait for the build to complete
5. Once deployed, you'll get a URL like: `https://protomind-frontend.onrender.com`

## Step 5: Connect Frontend to Backend

1. Go to the frontend static site settings
2. Click "Environment" on the left
3. Add this environment variable:
   - **Key**: `VITE_API_URL`
     **Value**: Your backend URL (e.g., `https://protomind-backend.onrender.com`)

4. Click "Save Changes" and redeploy

## Step 6: Test Your Deployment

1. Visit your frontend URL
2. Click "Load Demo" to test the connection
3. If it works, you'll see demo data loaded
4. Log in with:
   - Username: `demo_rep`
   - Password: `demo123`

## Troubleshooting

### Backend not connecting to MongoDB
- Verify your MongoDB Atlas connection string is correct
- Check that your IP is whitelisted in MongoDB Atlas
- Check the logs in Render dashboard for errors

### Frontend not connecting to backend
- Ensure `VITE_API_URL` environment variable is set correctly
- Check browser console for CORS errors
- Verify the backend URL is accessible

### Build failures
- Check the build logs in Render dashboard
- Ensure all dependencies are listed in package.json
- Verify no hardcoded paths are breaking the build

## Enable Auto-Deploy

To automatically deploy when you push to GitHub:

1. Both services are already configured for auto-deploy
2. Any push to the `main` branch will trigger a new deployment
3. Check the "Deploys" tab to see deployment status

## Upgrade from Free Tier

Render's free tier will spin down after 15 minutes of inactivity. For a production app:
1. Visit your service settings
2. Upgrade to a paid instance type
3. Select your preferred tier

Enjoy your deployed Protomind application! 🚀
