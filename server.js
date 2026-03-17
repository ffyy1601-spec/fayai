require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Provide public Supabase config to the frontend
app.get('/api/config', (req, res) => {
    res.json({
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
    });
});

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        
        const apiKey = process.env.DEEPSEEK_API_KEY;
        const isOpenRouter = apiKey.startsWith('sk-or-');
        
        const apiUrl = isOpenRouter 
            ? 'https://openrouter.ai/api/v1/chat/completions' 
            : 'https://api.deepseek.com/chat/completions';
            
        const modelName = isOpenRouter 
            ? 'deepseek/deepseek-chat' 
            : 'deepseek-chat';
            
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        };
        
        if (isOpenRouter) {
            // Required by OpenRouter 
            headers['HTTP-Referer'] = 'http://localhost:3000';
            headers['X-Title'] = 'FYZ AI';
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                model: modelName,
                messages: messages,
                stream: true
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`API error: ${response.status} - ${error}`);
        }

        // Set Headers for Server-Sent Events (SSE)
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Stream the response from the API directly to the client
        const reader = response.body.getReader();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
        }
        res.end();
    } catch (error) {
        console.error('Error in /api/chat:', error);
        res.status(500).json({ error: error.message || 'Something went wrong' });
    }
});

app.listen(PORT, () => {
    console.log(`FYZ AI server running at http://localhost:${PORT}`);
});
