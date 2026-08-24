import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
}) : null;

// Gemini Streaming API Route
app.post('/api/gemini/stream', async (req, res) => {
  const { prompt, systemInstruction, temperature } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // Setup Server-Sent Events headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (!ai) {
    // If no API key configured, simulate streaming
    const fallbackText = `【Gemini 3.7 Flash 响应】\n\n已收到您的问题：“${prompt}”。\n\n- ⚡ **多模态与推理**：Gemini 具备高效的混合思考架构与强大的代码生成能力。\n- 🌐 **知识整合**：在多轮对话与复杂长文档处理中表现优异。\n- 💡 **提示**：如需直接连接 Google Gemini 官方 API，请在 Settings > Secrets 面板中注入 GEMINI_API_KEY。`;
    for (let i = 0; i < fallbackText.length; i += 3) {
      const chunk = fallbackText.slice(i, i + 3);
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      await new Promise(r => setTimeout(r, 20));
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    return res.end();
  }

  try {
    const streamResponse = await ai.models.generateContentStream({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || '你是一个专业、客观、逻辑严谨的 AI 助手。',
        temperature: temperature !== undefined ? temperature : 0.7,
      }
    });

    for await (const chunk of streamResponse) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error('Gemini stream error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message || 'Gemini API Error', done: true })}\n\n`);
    res.end();
  }
});

// Serve frontend in production
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
