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

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const rateLimitMap = new Map(); // IP -> { count, resetAt }
const RATE_LIMIT = 30; // requests per window
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip) {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
        return true;
    }
    if (entry.count >= RATE_LIMIT) return false;
    entry.count++;
    return true;
}

// Clean up old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap.entries()) {
        if (now > entry.resetAt) rateLimitMap.delete(ip);
    }
}, 5 * 60 * 1000);

// ── Core Identity ─────────────────────────────────────────────────────────────
const FAY_SYSTEM_PROMPT = `You are Fay AI, an advanced, highly intelligent AI assistant. You are helpful, precise, thoughtful, and professional.

CRITICAL RULES YOU MUST ALWAYS FOLLOW:
1. Your name is "Fay AI". When anyone asks your name, what you are, or who made you, you MUST say you are "Fay AI". Never mention DeepSeek, OpenAI, Anthropic, or any other AI company or model.
2. You MUST respond ONLY in the same language the user is writing in. If the user writes in Turkish, respond in Turkish. If in English, respond in English. ABSOLUTELY NEVER respond in Chinese or any other language unless the user explicitly asks you to.
3. You are NOT a basic assistant — you provide expert-level, thorough, and well-structured answers. Always aim to be comprehensive, insightful, and genuinely useful.
4. Format your responses clearly using markdown: use headers, bullet points, code blocks, and bold/italic text where appropriate to make answers easy to read.
5. Be confident and direct. Do not add unnecessary disclaimers or filler phrases.
6. When answering technical questions, provide working code examples with explanations.
7. For complex topics, break your answer into clear sections.`;

// ── Helpers ───────────────────────────────────────────────────────────────────
function getApiConfig(apiKey) {
    const isOpenRouter = apiKey.startsWith('sk-or-');
    return {
        apiUrl: isOpenRouter
            ? 'https://openrouter.ai/api/v1/chat/completions'
            : 'https://api.deepseek.com/chat/completions',
        modelName: isOpenRouter ? 'deepseek/deepseek-chat' : 'deepseek-chat',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            ...(isOpenRouter && {
                'HTTP-Referer': 'https://fay-ai.onrender.com',
                'X-Title': 'Fay AI'
            })
        }
    };
}

function friendlyError(status, raw) {
    if (status === 429) return 'Çok fazla istek gönderildi. Lütfen bir dakika bekleyin.';
    if (status === 401) return 'API anahtarı geçersiz.';
    if (status === 402) return 'API kredisi tükendi.';
    if (status === 503) return 'AI servisi şu an meşgul. Lütfen tekrar deneyin.';
    return `Bir hata oluştu (${status}). Lütfen tekrar deneyin.`;
}

// ── Config Endpoint ───────────────────────────────────────────────────────────
app.get('/api/config', (req, res) => {
    res.json({
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
    });
});

// ── Chat (Streaming) ──────────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    if (!checkRateLimit(ip)) {
        return res.status(429).json({ error: 'Çok fazla istek gönderildi. Lütfen bir dakika bekleyin.' });
    }

    try {
        const { messages } = req.body;
        const { apiUrl, modelName, headers } = getApiConfig(process.env.DEEPSEEK_API_KEY);

        const fullMessages = [
            { role: 'system', content: FAY_SYSTEM_PROMPT },
            ...messages
        ];

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                model: modelName,
                messages: fullMessages,
                stream: true,
                temperature: 0.8,
                top_p: 0.95,
                max_tokens: 4096,
                frequency_penalty: 0.1,
                presence_penalty: 0.1
            })
        });

        if (!response.ok) {
            const raw = await response.text();
            return res.status(response.status).json({ error: friendlyError(response.status, raw) });
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const reader = response.body.getReader();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
        }
        res.end();
    } catch (error) {
        console.error('Error in /api/chat:', error);
        res.status(500).json({ error: 'Sunucu hatası. Lütfen tekrar deneyin.' });
    }
});

// ── AI Title Generation ───────────────────────────────────────────────────────
app.post('/api/title', async (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    if (!checkRateLimit(ip)) {
        return res.status(429).json({ error: 'Rate limited' });
    }

    try {
        const { message } = req.body;
        const { apiUrl, modelName, headers } = getApiConfig(process.env.DEEPSEEK_API_KEY);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                model: modelName,
                messages: [
                    {
                        role: 'system',
                        content: 'Generate a very short, concise chat title (3-6 words max) for a conversation that starts with the following message. Return ONLY the title text, no quotes, no punctuation at the end, no explanations. Match the language of the input message.'
                    },
                    { role: 'user', content: message }
                ],
                stream: false,
                temperature: 0.5,
                max_tokens: 20
            })
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Title generation failed' });
        }

        const data = await response.json();
        const title = data.choices?.[0]?.message?.content?.trim() || message.substring(0, 30);
        res.json({ title });
    } catch (error) {
        console.error('Error in /api/title:', error);
        res.status(500).json({ error: 'Title generation failed' });
    }
});

app.listen(PORT, () => {
    console.log(`Fay AI server running at http://localhost:${PORT}`);
});
