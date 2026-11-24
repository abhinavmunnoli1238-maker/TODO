# TaskFlow — Smart Todo List (Full-Stack CRUD Application)

A modern, responsive Smart Todo List web application built with React, Tailwind CSS, Express.js, Drizzle ORM, Firebase Authentication, and Cloud SQL (PostgreSQL).

## Folder Structure

```
├── database/
│   └── schema.sql            # Reference SQL creation script
├── src/
│   ├── components/           # Modular UI components (Sidebar, Dashboard, TaskCard, Modals, Toast)
│   ├── context/              # AuthContext & ThemeContext
│   ├── db/
│   │   ├── drizzle.config.ts # Drizzle Kit migration config
│   │   ├── index.ts          # PostgreSQL connection pool (Object Method)
│   │   ├── schema.ts         # Drizzle ORM table definitions (users, tasks)
│   │   ├── tasks.ts          # Parameterized task CRUD queries
│   │   └── users.ts          # User profile upsert helper
│   ├── lib/
│   │   ├── api.ts            # Authenticated REST API client
│   │   ├── firebase.ts       # Firebase Client Auth initialization
│   │   └── firebase-admin.ts # Firebase Admin token verification
│   ├── middleware/
│   │   └── auth.ts           # Express Bearer token verification middleware
│   ├── types/
│   │   └── task.ts           # Shared frontend task interfaces & utilities
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── server.ts                 # Express REST API + Vite server
└── package.json
```

## REST API Endpoints

All `/api/tasks` endpoints require a valid Firebase ID token in `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/tasks` | List all tasks for the signed-in user |
| `GET` | `/api/tasks/:id` | Retrieve a single task by ID |
| `POST` | `/api/tasks` | Create a new validated task |
| `PUT` | `/api/tasks/:id` | Update task title, description, priority, category, due date, or status |
| `PATCH` | `/api/tasks/:id/status` | Quickly toggle task status between `Pending` and `Completed` |
| `DELETE` | `/api/tasks/:id` | Permanently delete a task |

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables in `.env` based on `.env.example` (`SQL_HOST`, `SQL_DB_NAME`, `SQL_USER`, `SQL_PASSWORD`, `SQL_ADMIN_USER`, `SQL_ADMIN_PASSWORD`).
3. Apply the schema with Drizzle Kit:
   ```bash
   npx drizzle-kit push --config=src/db/drizzle.config.ts
   ```
4. Start the development server on port 3000:
   ```bash
   npm run dev
   ```
5. Build for production:
   ```bash
   npm run build
   npm start
   ```
