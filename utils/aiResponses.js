// backend/utils/aiResponses.js

const AI_RESPONSES = {
    // Identity & Persona
    IDENTITY: [
        {
            keywords: ['who are you', 'what are you', 'your name', 'about yourself', 'about you', 'introduce yourself'],
            response: "I am an intelligent AI Assistant embedded inside the Reelio application. I'm here to help you navigate, code, learn, and chat! 🤖"
        },
        {
            keywords: ['created by', 'who made you', 'developer', 'author', 'built by'],
            response: "I was developed by the Reelio team to provide a helpful and seamless experience within this social platform."
        },
        {
            keywords: ['real ai', 'chatgpt', 'gpt', 'llm', 'language model', 'bot', 'robot', 'ai'],
            response: "I am a powerful AI assistant designed to simulate intelligent conversation. While I share some similarities with large language models, I am specifically tuned for the Reelio ecosystem."
        }
    ],

    // Navigation & App Features
    NAVIGATION: [
        {
            keywords: ['reel', 'video', 'watch', 'clip', 'shorts'],
            response: "🎥 **Reels**: You can watch endless entertaining videos on the Reels page! Click the **Film Icon** 🎬 on the sidebar to start watching."
        },
        {
            keywords: ['upload', 'post', 'create', 'new', 'share', 'publish'],
            response: "✨ **Create Post**: Ready to share? Click the **+ Create** button in the sidebar to upload photos or videos. You can add captions and share with your followers!"
        },
        {
            keywords: ['explore', 'search', 'find', 'trending', 'vital', 'discover', 'lookup'],
            response: "🧭 **Explore**: Want to see what's trending? Tap the **Compass Icon** in the sidebar to visit the Explore page and discover new content and creators."
        },
        {
            keywords: ['message', 'chat', 'dm', 'inbox', 'text', 'talk to'],
            response: "💬 **Messages**: Connect with your friends! Click the **Paper Plane Icon** in the sidebar to view your conversations and start new chats."
        },
        {
            keywords: ['profile', 'account', 'settings', 'avatar', 'bio', 'my page', 'login', 'logout'],
            response: "👤 **Profile**: You can view your posts, followers, and edit your profile details by clicking your **Avatar** in the sidebar."
        }
    ],

    // Coding & Technical
    CODING: [
        {
            keywords: ['react', 'component', 'jsx', 'frontend'],
            response: "Here is a basic example of a React functional component:\n\n```jsx\nimport React from 'react';\n\nconst MyComponent = ({ title }) => {\n  return (\n    <div className=\"p-4 bg-white rounded shadow\">\n      <h1 className=\"text-xl font-bold\">{title}</h1>\n      <p>This is a custom component!</p>\n    </div>\n  );\n};\n\nexport default MyComponent;\n```"
        },
        {
            keywords: ['api', 'fetch', 'axios', 'backend', 'http', 'request'],
            response: "To fetch data in a React component, you can use the `useEffect` hook. Here's an example using `axios`:\n\n```javascript\nuseEffect(() => {\n  const fetchData = async () => {\n    try {\n      const { data } = await axios.get('/api/posts');\n      console.log(data);\n    } catch (error) {\n      console.error('Error fetching data:', error);\n    }\n  };\n  fetchData();\n}, []);\n```"
        },
        {
            keywords: ['html', 'semantic', 'css', 'style', 'div'],
            response: "Using semantic HTML is important for accessibility and SEO. Examples include `<header>`, `<main>`, and `<footer>`. For styling, we recommend using Tailwind CSS directly in your `className`!"
        },
        {
            keywords: ['bug', 'error', 'fix', 'debug', 'issue', 'problem'],
            response: "Debugging is part of the process! 🐛 Check your browser console (F12) for detailed error messages. If it's a layout issue, try inspecting the element to see which styles are applied."
        }
    ],

    // General Chat & Fun
    CASUAL: [
        {
            keywords: ['hello', 'hi', 'hey', 'greetings', 'yo', 'sup', 'morning', 'evening', 'afternoon'],
            response: "Hello! 👋 I'm your AI Assistant. How can I help you today?"
        },
        {
            keywords: ['joke', 'funny', 'laugh', 'humor', 'tell me a joke'],
            response: "Why did the developer go broke? Because he used up all his cache! 🐛😂"
        },
        {
            keywords: ['how are you', 'status', 'doing', 'whats up'],
            response: "I'm functioning perfectly! 🚀 Ready to answer your questions. How are you?"
        },
        {
            keywords: ['thank', 'appreciate', 'cool', 'good', 'nice', 'awesome', 'great', 'wow'],
            response: "You're very welcome! Let me know if you need anything else. 😊"
        },
        {
            keywords: ['bye', 'goodbye', 'see you', 'later', 'cya'],
            response: "Goodbye! 👋 Have a great day and come back soon!"
        }
    ],

    // General Knowledge & Philosophy (Simulating ChatGPT)
    GENERAL_KNOWLEDGE: [
        {
            keywords: ['love', 'what is love', 'romance'],
            response: "Love is a complex set of emotions and beliefs associated with strong feelings of affection, protectiveness, warmth, and respect for another person. 💖 In a biological sense, it involves neurochemistry like oxytocin!"
        },
        {
            keywords: ['life', 'meaning of life', 'existence'],
            response: "The meaning of life is a philosophical question that has been asked for centuries. Some say it's 42! 😉 Others believe it's about finding happiness, helping others, and creating your own purpose."
        },
        {
            keywords: ['science', 'physics', 'chemistry', 'biology'],
            response: "Science is the systematic study of the structure and behavior of the physical and natural world through observation and experiment. 🧪 Is there a specific scientific topic you're curious about?"
        },
        {
            keywords: ['history', 'past', 'ancient'],
            response: "History is the study of past events, particularly in human affairs. From ancient civilizations to modern times, there's so much to learn! 📜"
        },
        {
            keywords: ['weather', 'rain', 'sun', 'forecast'],
            response: "I can't check the real-time weather just yet, but I hope it's sunny where you are! ☀️"
        },
        {
            keywords: ['music', 'song', 'artist', 'listen'],
            response: "Music is the art of arranging sounds in time. It connects people and evokes deep emotions. 🎵 You can find great music content on our **Explore** page!"
        },
        {
            keywords: ['food', 'recipe', 'cook', 'eat'],
            response: "Food is essential for life and a great way to bring people together! 🍕 If you're looking for cooking tips, check out the **Reels** section for some delicious recipes."
        },
        {
            keywords: ['advice', 'help me', 'sad', 'happy', 'feeling'],
            response: "I'm here to listen! While I'm an AI, I can offer a friendly virtual ear. Remember, doing something you enjoy or talking to a friend often helps. 🌟"
        }
    ],

    // Safety & Fallback
    SAFETY: {
        keywords: ['hack', 'crack', 'exploit', 'illegal', 'password', 'steal', 'kill', 'attack'],
        response: "I cannot assist with that request. I am programmed to be helpful, harmless, and honest. Please ask me something else! 🛡️"
    },

    FALLBACKS: [
        "I'm listening! Could you tell me more about that?",
        "That's a fascinating topic. I'd love to try and answer if you can be a bit more specific!",
        "I see! I'm doing my best to learn about everything. What else is on your mind?",
        "Interesting! As an AI, I'm constantly processing new information. How can I help you further?",
        "I'm here to help with questions about the app, coding, or life in general! What's your query?",
        "Could you rephrase that? I want to make sure I give you the best answer possible! 🤖"
    ]
};

const getAIResponse = (message) => {
    if (!message) return "Please ask me something!";

    const lowerMsg = message.toLowerCase();

    // 1. Safety Check
    if (AI_RESPONSES.SAFETY.keywords.some(k => lowerMsg.includes(k))) {
        return AI_RESPONSES.SAFETY.response;
    }

    // 2. Scan Identity
    for (const item of AI_RESPONSES.IDENTITY) {
        if (item.keywords.some(k => lowerMsg.includes(k))) return item.response;
    }

    // 3. Scan Navigation
    for (const item of AI_RESPONSES.NAVIGATION) {
        if (item.keywords.some(k => lowerMsg.includes(k))) return item.response;
    }

    // 4. Scan Coding
    for (const item of AI_RESPONSES.CODING) {
        if (item.keywords.some(k => lowerMsg.includes(k))) return item.response;
    }

    // 5. Scan General Knowledge (New Priority)
    for (const item of AI_RESPONSES.GENERAL_KNOWLEDGE) {
        if (item.keywords.some(k => lowerMsg.includes(k))) return item.response;
    }

    // 6. Scan Casual
    for (const item of AI_RESPONSES.CASUAL) {
        if (item.keywords.some(k => lowerMsg.includes(k))) return item.response;
    }

    // 7. Fallback (Random)
    return AI_RESPONSES.FALLBACKS[Math.floor(Math.random() * AI_RESPONSES.FALLBACKS.length)];
};

module.exports = { getAIResponse };
