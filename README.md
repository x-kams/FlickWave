
# FlickWave Music Streaming App

FlickWave is a React + Vite frontend with an Express + MongoDB backend for music, albums, artists, uploads, and OTP email flows.

## Tech Stack

- Frontend: React, Vite, TypeScript, Tailwind
- Backend: Node.js, Express, Mongoose, Multer, Nodemailer
- Database: MongoDB

## Project Structure

- `src/` - frontend app
- `server/` - backend API
- `.env.example` - environment template

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB running locally or remotely

## Setup

1. Install frontend dependencies:
   - `npm install`
2. Install backend dependencies:
   - `cd server && npm install`
3. Create your environment file:
   - Copy `.env.example` to `.env`
   - Fill in real values for `MONGODB_URI`, `GMAIL_USER`, and `GMAIL_APP_PASSWORD`

## Run Locally

You need two terminals.

1. Start backend:
   - `cd server`
   - `npm run dev`
2. Start frontend:
   - from project root: `npm run dev`

Frontend default: `http://localhost:5173`  
Backend default: `http://localhost:5000`

## Environment Variables

Defined in `.env` (see `.env.example`):

- `MONGODB_URI` - MongoDB connection string
- `PORT` - backend port (default `5000`)
- `CORS_ALLOWED_ORIGINS` - comma-separated allowed origins
- `GMAIL_USER` - SMTP sender email
- `GMAIL_APP_PASSWORD` - Gmail app password
- `VITE_API_URL` - frontend API base (default `/api`)
- `VITE_DEMO_EMAIL` / `VITE_DEMO_PASSWORD` - optional demo login display
- `VITE_ADMIN_EMAIL` / `VITE_ADMIN_PASSWORD` - optional admin gate credentials

## Scripts

Root:
- `npm run dev` - start frontend dev server
- `npm run build` - production build

Server (`server/`):
- `npm run start` - start backend
- `npm run dev` - start backend in watch mode

## Security Notes

- `.env` is git-ignored. Do not commit secrets.
- Rotate credentials immediately if they were ever committed.
- Uploaded files are stored in `server/uploads` (also git-ignored).

## Original Design

Original Figma source:
https://www.figma.com/design/hgtAlNVp6uEOt2Rr3yJvbS/FlickWave-Music-Streaming-App
