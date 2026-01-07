const express = require('express');
const mysql = require('mysql2/promise');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

let pool;

async function initDB() {
    try {
        pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        await pool.query(`CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(50) PRIMARY KEY, 
            name VARCHAR(255), 
            role VARCHAR(50), 
            password VARCHAR(255)
        )`);

        await pool.query(`CREATE TABLE IF NOT EXISTS commits (
            hash VARCHAR(100) PRIMARY KEY, 
            author VARCHAR(255), 
            message TEXT, 
            impact_score FLOAT, 
            activity_score FLOAT
        )`);

        await pool.query("INSERT IGNORE INTO users VALUES ('MAIN-001', 'Director', 'Director', 'admin')");
        console.log("✅ MySQL Connected & Tables Ready");
    } catch (err) {
        console.error("❌ DB Error: Make sure you created 'impactlens_db' in MySQL. ", err.message);
    }
}

function calculateImpact(message) {
    let score = 5.0;
    const msg = message.toLowerCase();
    if (msg.includes('fix') || msg.includes('bug')) score += 2.5;
    if (msg.includes('refactor') || msg.includes('perf')) score += 3.0;
    if (msg.includes('doc') || msg.includes('typo')) score -= 3.0;
    return Math.max(1, Math.min(10, score));
}

app.post('/api/login', async (req, res) => {
    const { id, password } = req.body;
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ? AND password = ?", [id, password]);
    if (rows.length) res.json(rows[0]);
    else res.status(401).json({ error: "Invalid credentials" });
});

app.get('/api/analyze', async (req, res) => {
    const repoPath = process.env.TARGET_REPO_URL.replace('https://github.com/', '');
    try {
        const response = await axios.get(`https://api.github.com/repos/${repoPath}/commits`, {
            headers: { 'Authorization': `token ${process.env.GITHUB_TOKEN}` }
        });

        for (let c of response.data.slice(0, 30)) {
            const impact = calculateImpact(c.commit.message);
            await pool.query("INSERT IGNORE INTO commits VALUES (?, ?, ?, ?, 1)", 
                [c.sha, c.author?.login || 'unknown', c.commit.message, impact]);
        }

        const [rows] = await pool.query("SELECT author, SUM(impact_score) as total_impact, COUNT(*) as total_activity FROM commits GROUP BY author");
        
        const avg = rows.reduce((s, r) => s + r.total_impact, 0) / rows.length;
        const data = rows.map(r => ({
            ...r,
            zScore: (r.total_impact - avg).toFixed(2),
            category: r.total_impact > avg && r.total_activity < (rows.length/2) ? 'Silent Architect' : 'Contributor'
        }));
        res.json(data);
    } catch (e) { res.status(500).json({ error: "GitHub Error: Check your Token and .env URL" }); }
});

initDB().then(() => {
    app.listen(process.env.PORT, () => console.log(`🚀 Server on http://localhost:${process.env.PORT}`));
});
