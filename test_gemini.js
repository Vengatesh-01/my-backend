const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testGemini() {
    try {
        console.log("Testing Gemini API...");
        console.log("API Key loaded:", !!process.env.GEMINI_API_KEY);

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = "Hello! Please respond with a simple greeting.";
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        console.log("\n✅ SUCCESS! Gemini API is working!");
        console.log("Response:", text);

    } catch (error) {
        console.error("\n❌ ERROR:", error.message);
    }
}

testGemini();
