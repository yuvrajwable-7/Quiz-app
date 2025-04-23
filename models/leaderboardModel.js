const db = require('../config/db');

class Leaderboard {
    static async addScore(username, score, questionSource = 'mixed') {
        const [result] = await db.query(
            `INSERT INTO leaderboard 
             (username, score, question_source) 
             VALUES (?, ?, ?)`,
            [username, score, questionSource]
        );
        return result.insertId;
    }

    static async getTopScores(limit = 10, filter = 'all') {
        let query = `SELECT username, score, date, question_source 
                     FROM leaderboard`;
        
        switch(filter) {
            case 'today': query += ` WHERE DATE(date) = CURDATE()`; break;
            case 'week': query += ` WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`; break;
            case 'api': query += ` WHERE question_source = 'api'`; break;
            case 'database': query += ` WHERE question_source = 'database'`; break;
        }
        
        query += ` ORDER BY score DESC LIMIT ?`;
        
        const [rows] = await db.query(query, [limit]);
        return rows;
    }
}

module.exports = Leaderboard;