import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

function geminiDevPlugin(): Plugin {
  return {
    name: 'gemini-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/gemini/stream' && req.method === 'POST') {
          let bodyStr = '';
          req.on('data', chunk => { bodyStr += chunk; });
          req.on('end', async () => {
            try {
              const body = JSON.parse(bodyStr || '{}');
              const { prompt, systemInstruction, temperature } = body;

              res.setHeader('Content-Type', 'text/event-stream');
              res.setHeader('Cache-Control', 'no-cache');
              res.setHeader('Connection', 'keep-alive');

              const apiKey = process.env.GEMINI_API_KEY;
              if (apiKey) {
                const ai = new GoogleGenAI({
                  apiKey,
                  httpOptions: {
                    headers: {
                      'User-Agent': 'aistudio-build',
                    }
                  }
                });

                const streamResponse = await ai.models.generateContentStream({
                  model: 'gemini-3.7-flash',
                  contents: prompt,
                  config: {
                    systemInstruction: systemInstruction || '你是一个专业、客观、逻辑严密的多模型竞技助手。',
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
              } else {
                // Fallback response simulation
                const mockOutput = `【Google Gemini 3.7 Flash 响应】\n\n已收到并处理您的并发提问：“${prompt}”。\n\n- ⚡ **混合思考能力**：Gemini 结合高吞吐率与动态思考深度。\n- 🔍 **多模态与长上下文**：支持超长文档理解与多轮对话连续性。\n- 🎯 **提示**：可随时通过设置配置 API 或 Chrome 扩展模式。`;
                for (let i = 0; i < mockOutput.length; i += 4) {
                  const chunk = mockOutput.slice(i, i + 4);
                  res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
                  await new Promise(r => setTimeout(r, 25));
                }
                res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
                res.end();
              }
            } catch (err: any) {
              res.write(`data: ${JSON.stringify({ error: err.message || 'Error', done: true })}\n\n`);
              res.end();
            }
          });
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), geminiDevPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
