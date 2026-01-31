const axios = require('axios');

async function testAI() {
    try {
        console.log("Testing AI Context Awareness...");

        // Step 1: Establish context
        console.log("\nStep 1: Telling AI my name is 'TestUser'...");
        const res1 = await axios.post('http://localhost:5000/api/ai/chat', {
            message: "Hi, my name is TestUser.",
            history: []
        });
        console.log("AI Response 1:", res1.data.response);

        // Step 2: Ask for name using context
        console.log("\nStep 2: Asking AI 'What is my name?'...");
        const res2 = await axios.post('http://localhost:5000/api/ai/chat', {
            message: "What is my name?",
            history: [
                { role: 'user', content: "Hi, my name is TestUser." },
                { role: 'assistant', content: res1.data.response }
            ]
        });
        console.log("AI Response 2:", res2.data.response);

        if (res2.data.response.includes("TestUser")) {
            console.log("\n✅ SUCCESS: AI remembered the context!");
        } else {
            console.log("\n❌ FAILURE: AI did not remember the context.");
        }

    } catch (error) {
        console.error("Error:", error.response ? error.response.data : error.message);
    }
}

testAI();
