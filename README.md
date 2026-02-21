# Mentorship Matching Platform

An AI-powered platform tailored for connecting mentors and mentees based on skills and interests.

## Features
- **Role-based Authentication**: Mentor and Mentee roles.
- **AI Matching**: Smart recommendations using Jaccard Similarity on skills/interests.
- **Real-time Chat**: Instant messaging powered by Socket.io.
- **Session Booking**: Schedule mentorship sessions.
- **Connection Requests**: Manage your network.
- **Community Forum**: (Coming Soon) Discuss topics with peers.

## Tech Stack
- **Frontend**: React, Vite, TailwindCSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **Real-time**: Socket.io

## Quick Start

### Prerequisites
- Node.js
- MongoDB

### Installation

1.  **Install Server Dependencies**:
    ```bash
    cd server
    npm install
    ```

2.  **Install Client Dependencies**:
    ```bash
    cd client
    npm install
    ```

3.  **Run Locally**:
    - Terminal 1 (Server): `cd server && npm run dev`
    - Terminal 2 (Client): `cd client && npm run dev`

## API Documentation

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users/me` - Get current profile
- `GET /api/users/matches` - Get recommended matches

### Requests
- `POST /api/requests` - Send connection request
- `GET /api/requests` - View requests
- `PUT /api/requests/:id` - Accept/Reject request

### Sessions
- `POST /api/sessions` - Book session
- `GET /api/sessions` - View sessions
