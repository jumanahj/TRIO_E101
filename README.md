
# 🚀 ImpactLens - Local Setup Instructions

To run this platform on your local machine, follow these steps:

### 1. Prerequisites
- **Node.js** (v18+)
- **MySQL Server** (Optional, for real DB persistence)
- **GitHub Personal Access Token** (Recommended for higher rate limits)

### 2. Setup
1. Download the files to a local directory.
2. If using MySQL:
   - Execute the provided `schema.sql` in your MySQL instance.
   - Update `mockDb.ts` to connect to your real Node.js/MySQL backend.
3. If running purely in-browser:
   - Use a local dev server like `npx serve .` or VS Code Live Server.

### 3. API Key Configuration
This app uses the Gemini 2.5/3 API for commit analysis.
- The `API_KEY` is expected in the environment.
- If running locally via a build tool like Vite, add `VITE_API_KEY=your_key` to an `.env` file.

### 4. How to Use (Demo Flow)
1. **Login** as **Alice Director**.
2. **Create a Team** and enter a repo like `facebook/react`.
3. **Map Users**: Ensure Charlie Dev has the GitHub username `charlie_code`.
4. **Login** as **Bob Manager**.
5. **Sync Data**: Click 'Sync Data' to trigger the GitHub Ingestion & AI Scoring engine.
6. **Login** as **Charlie Dev** to see your personal impact score and ranking.
