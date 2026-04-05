# Vizion — Visual Project Management

A full-stack Kanban board built with Node.js, Express and MySQL.

## Features
- Create and manage multiple boards
- Drag and drop cards and columns
- Light/dark mode
- Persistent data with MySQL

## Tech Stack
- **Backend:** Node.js, Express, MySQL
- **Frontend:** Vanilla JS, HTML, CSS
- **Tools:** Postman, Git

## Running locally
1. Clone the repo
2. Create a MySQL database called `vizion`
3. Run the SQL schema from `backend/db/schema.sql`
4. Add your `.env` file inside `backend/`
5. `cd backend && npm install && npm run dev`
6. Open `frontend/index.html` with Live Server