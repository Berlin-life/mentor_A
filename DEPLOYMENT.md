# Deployment Guide for Mentorship Matching Platform

## Prerequisites
- Node.js (v18+)
- MongoDB Atlas Account (or local MongoDB)
- Vercel Account (for Frontend)
- Render/Heroku/Railway Account (for Backend)

## 1. Backend Deployment (Render/Railway/Heroku)

1.  **Environment Variables**:
    Set the following environment variables in your cloud provider:
    ```env
    PORT=5000
    MONGO_URI=your_mongodb_atlas_connection_string
    JWT_SECRET=your_strong_secret_key
    NODE_ENV=production
    ```

2.  **Build Command**:
    ```bash
    npm install
    ```

3.  **Start Command**:
    ```bash
    npm start
    ```

4.  **Websockets**:
    Ensure your provider supports loose websockets or sticky sessions if using Socket.io multiple nodes (Render/Heroku support this usually).

## 2. Frontend Deployment (Vercel/Netlify)

1.  **Environment Variables**:
    Create a `.env.production` file or set variables in the dashboard:
    ```env
    VITE_API_URL=https://your-backend-url.com/api
    ```
    *Note: You need to update `client/src/utils/api.js` to use this variable.*

2.  **Update API URL**:
    In `client/src/utils/api.js`:
    ```javascript
    const api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
      // ...
    });
    ```

3.  **Build Command**:
    ```bash
    npm install && npm run build
    ```

4.  **Output Directory**:
    `dist`

## 3. Local Development

1.  **Clone Repository**:
    ```bash
    git clone <repo-url>
    cd antigravity_mentor
    ```

2.  **Backend Setup**:
    ```bash
    cd server
    npm install
    # Create .env file
    npm run dev
    ```

3.  **Frontend Setup**:
    ```bash
    cd client
    npm install
    npm run dev
    ```

4.  **Access**:
    Frontend: `http://localhost:5173`
    Backend: `http://localhost:5000`
