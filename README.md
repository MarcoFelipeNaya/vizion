# Vizion — Visual Project Management

A full-stack Kanban board for visual project management — create boards, drag cards between columns, and track your work with persistent data.

## Features

- Create and manage multiple boards
- Drag and drop cards and columns to reorder them
- Add titles, descriptions, and colors to cards
- Light / dark mode (persists between sessions)
- Data stored in MySQL — nothing is lost on refresh

## Tech Stack

- **Backend:** Node.js, Express, MySQL
- **Frontend:** Vanilla JS, HTML, CSS
- **Tools:** Postman, Git

## Running locally

### Prerequisites

- Node.js installed
- MySQL running locally

### Setup

1. Clone the repo
   ```bash
   git clone https://github.com/MarcoFelipeNaya/vizion.git
   cd vizion
   ```

2. Create the database and run the schema
   ```bash
   mysql -u root -p
   ```
   ```sql
   CREATE DATABASE vizion;
   USE vizion;
   SOURCE backend/db/schema.sql;
   ```

3. Create your `.env` file inside `backend/`
   ```bash
   cp backend/.env.example backend/.env
   ```
   Then fill in your credentials:
   ```
   DB_HOST=localhost
   DB_USER=your_mysql_user
   DB_PASSWORD=your_mysql_password
   DB_NAME=vizion
   PORT=3000
   ```

4. Install dependencies and start the server
   ```bash
   cd backend
   npm install
   npm run dev
   ```

5. Open `frontend/index.html` with Live Server (VS Code extension)

The API will be running at `http://localhost:3000`.

## Project Structure

```
vizion/
├── backend/
│   ├── db/
│   │   ├── connection.js   # MySQL connection pool
│   │   └── schema.sql      # Database schema
│   ├── routes/
│   │   ├── boards.js       # Board CRUD
│   │   ├── columns.js      # Column CRUD + reorder
│   │   └── cards.js        # Card CRUD + move
│   ├── server.js
│   └── package.json
└── frontend/
    ├── scripts/
    │   ├── api.js          # Fetch wrappers for the REST API
    │   └── app.js          # UI logic, drag & drop, state
    ├── styles/
    │   └── main.css
    └── index.html
```
