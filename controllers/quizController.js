const Quiz = require('../models/quizModel');

exports.getQuestions = async (req, res) => {
    try {
        const questions = await Quiz.getRandomQuestions(10);
        if (!questions || questions.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'No questions found' 
            });
        }
        
        // Ensure all questions have required fields
        const validatedQuestions = questions.map(q => ({
            question: q.question || 'No question text',
            option1: q.option1 || 'Option 1',
            option2: q.option2 || 'Option 2',
            option3: q.option3 || 'Option 3',
            option4: q.option4 || 'Option 4',
            correct_answer: q.correct_answer || q.option1 || 'Option 1',
            category: q.category || 'General',
            source: q.source || 'database',
            time_limit: q.time_limit || 30
        }));
        
        res.json({
            success: true,
            data: validatedQuestions,
            count: validatedQuestions.length
        });
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch questions',
            error: error.message 
        });
    }
};

exports.addQuestion = async (req, res) => {
    try {
        const { question, option1, option2, option3, option4, correct_answer, category } = req.body;
        
        if (!question || !option1 || !option2 || !option3 || !option4 || !correct_answer) {
            return res.status(400).json({ 
                success: false,
                message: 'Missing required fields' 
            });
        }

        const questionId = await Quiz.addQuestion(req.body);
        res.status(201).json({ 
            success: true,
            id: questionId,
            message: 'Question added successfully'
        });
    } catch (error) {
        console.error('Error adding question:', error);
        res.status(400).json({ 
            success: false,
            message: 'Failed to add question',
            error: error.message 
        });
    }
};