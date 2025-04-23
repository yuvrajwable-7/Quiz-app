const Leaderboard = require('../models/leaderboardModel');

exports.addScore = async (req, res) => {
    try {
        const { username, score, questionSource = 'mixed' } = req.body;
        
        if (!username || username.trim() === '') {
            return res.status(400).json({ 
                success: false,
                message: 'Username is required' 
            });
        }
        
        if (typeof score !== 'number' || score < 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid score value' 
            });
        }

        const recordId = await Leaderboard.addScore(username.trim(), score, questionSource);
        res.status(201).json({ 
            success: true,
            id: recordId,
            message: 'Score saved successfully'
        });
    } catch (error) {
        console.error('Error in addScore:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to save score',
            error: error.message 
        });
    }
};

exports.getLeaderboard = async (req, res) => {
    try {
        const { filter = 'all', limit = 10 } = req.query;
        const scores = await Leaderboard.getTopScores(parseInt(limit), filter);
        res.json({
            success: true,
            data: scores,
            count: scores.length
        });
    } catch (error) {
        console.error('Error in getLeaderboard:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to load leaderboard',
            error: error.message 
        });
    }
};