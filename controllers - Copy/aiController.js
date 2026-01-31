// backend/controllers/aiController.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getAIResponse: getLocalChatResponse } = require('../utils/aiResponses');

const AIAssistant = {
    generateResponse: async (req, res) => {
        const timeoutMs = 12000; // 12 seconds

        try {
            const { message, history } = req.body;

            if (!message) {
                return res.status(400).json({ error: "Message is required" });
            }

            // 1. Check for curated local responses first (saves API quota)
            const localResponse = getLocalChatResponse(message);

            // If the local response is NOT a fallback (meaning it's a specific match)
            // Or if it's the first message and we have a specific match
            // We'll use it to save API calls for simple "hi", "who are you", etc.
            const fallbacks = [
                "I'm listening!", "Could you tell me more", "That's a fascinating topic",
                "I see!", "Interesting!", "I'm here to help", "Could you rephrase"
            ];

            const isFallback = fallbacks.some(f => localResponse.includes(f));

            if (!isFallback) {
                return res.json({
                    response: localResponse,
                    timestamp: new Date().toISOString(),
                    source: 'local'
                });
            }

            // Initialize Gemini with the correct model
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({
                model: "gemini-flash-latest",
                generationConfig: {
                    maxOutputTokens: 500,
                    temperature: 0.7,
                },
            });

            // Build the prompt with context
            let fullPrompt = "You are a helpful AI assistant embedded in the Reelio social media platform. You can help users with navigation, coding questions, general knowledge, and casual conversation. Be friendly, concise, and helpful.\n\n";

            if (Array.isArray(history) && history.length > 0) {
                fullPrompt += "Previous conversation:\n";
                history.forEach(msg => {
                    if (msg.role && msg.content) {
                        const role = msg.role === 'user' ? 'User' : 'Assistant';
                        fullPrompt += `${role}: ${msg.content}\n`;
                    }
                });
                fullPrompt += "\n";
            }

            fullPrompt += `User: ${message}\nAssistant:`;

            // Generate response with timeout
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs)
            );

            const generatePromise = model.generateContent(fullPrompt);

            const result = await Promise.race([generatePromise, timeoutPromise]);
            const response = result.response;
            const text = response.text();

            res.json({
                response: text,
                timestamp: new Date().toISOString()
            });

        } catch (err) {
            console.error("AI request error:", err.message);

            if (err.message === 'TIMEOUT') {
                return res.status(504).json({ error: "AI is taking too long. Please try again." });
            }

            // Handle rate limit errors gracefully
            if (err.message && (
                err.message.includes('quota') ||
                err.message.includes('rate limit') ||
                err.message.includes('Too Many Requests')
            )) {
                return res.status(429).json({
                    error: "I'm receiving too many requests right now. Please wait a moment and try again! 🕐"
                });
            }

            // Handle API key errors
            if (err.message && err.message.includes('API key')) {
                return res.status(401).json({
                    error: "AI service configuration issue. Please contact support."
                });
            }

            // Generic friendly error message
            const errorMessage = "I'm having trouble thinking right now. Please try again in a moment! 🤔";
            return res.status(500).json({ error: errorMessage });
        }
    }
};

module.exports = AIAssistant;
