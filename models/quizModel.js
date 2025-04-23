const db = require('../config/db');
const axios = require('axios');

class Quiz {
    static async getRandomQuestions(limit = 10) {
        try {
            // Get 60% from API and 40% from database for good mix
            const apiLimit = Math.ceil(limit * 0.6);
            const dbLimit = limit - apiLimit;
            
            const [apiQuestions, dbQuestions] = await Promise.all([
                this.getApiQuestions(apiLimit),
                this.getDatabaseQuestions(dbLimit)
            ]);
            
            // Filter out any undefined or null questions
            const allQuestions = [...apiQuestions, ...dbQuestions].filter(q => q);
            return this.shuffleArray(allQuestions).slice(0, limit);
        } catch (error) {
            console.error('Error getting questions:', error);
            // Fallback to database questions only
            return this.getDatabaseQuestions(limit);
        }
    }

    static async getApiQuestions(limit) {
        try {
            const response = await axios.get('https://opentdb.com/api.php', {
                params: { 
                    amount: limit, 
                    type: 'multiple',
                    encode: 'url3986'
                }
            });
            
            if (!response.data.results || response.data.results.length === 0) {
                return [];
            }
            
            return response.data.results.map(q => {
                try {
                    const decode = text => decodeURIComponent(text || '');
                    return {
                        question: decode(q.question),
                        option1: decode(q.correct_answer),
                        option2: decode(q.incorrect_answers[0]),
                        option3: decode(q.incorrect_answers[1]),
                        option4: decode(q.incorrect_answers[2]),
                        correct_answer: decode(q.correct_answer),
                        category: decode(q.category),
                        difficulty: q.difficulty,
                        source: 'api',
                        time_limit: this.getTimeLimit(q.difficulty)
                    };
                } catch (e) {
                    console.error('Error processing API question:', e);
                    return null;
                }
            }).filter(q => q); // Filter out any null questions
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    }

    static async getDatabaseQuestions(limit) {
        try {
            const [rows] = await db.query(
                `SELECT * FROM questions 
                 ORDER BY RAND() LIMIT ?`,
                [limit]
            );
            return rows.map(q => ({
                ...q,
                time_limit: q.time_limit || this.getTimeLimit(q.difficulty)
            }));
        } catch (error) {
            console.error('Database query error:', error);
            return [];
        }
    }

    static getTimeLimit(difficulty) {
        const limits = { 
            easy: 45, 
            medium: 30, 
            hard: 20 
        };
        return limits[difficulty?.toLowerCase()] || 30;
    }

    static shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    static async addQuestion(questionData) {
        const { question, option1, option2, option3, option4, correct_answer, category } = questionData;
        const [result] = await db.query(
            `INSERT INTO questions 
             (question, option1, option2, option3, option4, correct_answer, category, source) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'database')`,
            [question, option1, option2, option3, option4, correct_answer, category]
        );
        return result.insertId;
    }

    static async getCategories() {
        const [rows] = await db.query(
            `SELECT DISTINCT category FROM questions 
             WHERE category IS NOT NULL`
        );
        return rows.map(row => row.category);
    }
}

module.exports = Quiz;