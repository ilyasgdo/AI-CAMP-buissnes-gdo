import { GoogleGenerativeAI } from '@google/generative-ai';
import { VertexAI } from '@google-cloud/vertexai';

function isGemini25(model: string): boolean {
  return /gemini-2\.5/i.test(model);
}

export class GoogleProvider {
  constructor(private readonly apiKey: string | undefined, private readonly model: string) {}

  async completeJson(system: string, user: string): Promise<string> {
    const modelName = this.model || 'gemini-1.5-flash';
    const useVertex = isGemini25(modelName) || String(process.env.GOOGLE_VERTEX || '').toLowerCase() === 'true';
    if (useVertex) {
      const project = process.env.GOOGLE_PROJECT_ID || '';
      const location = process.env.GOOGLE_LOCATION || 'us-central1';
      if (!project) {
        throw new Error('GOOGLE_VERTEX_CONFIG_ERROR: GOOGLE_PROJECT_ID is required for Vertex AI.');
      }
      const vertex = new VertexAI({ project, location });
      const model = vertex.getGenerativeModel({ model: modelName, systemInstruction: system });
      try {
        const res = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: user }]}],
          generationConfig: { responseMimeType: 'application/json', temperature: 0 },
        } as any);
        const content = (res as any)?.response?.candidates?.[0]?.content?.parts?.[0]?.text ?? (res as any)?.response?.text?.() ?? '{}';
        return content;
      } catch (err: any) {
        const msg = String(err?.message || '');
        if (msg.includes('Permission') || msg.includes('unauthorized') || msg.includes('invalid')) {
          throw new Error('GOOGLE_VERTEX_AUTH_ERROR: Check service account permissions and GOOGLE_APPLICATION_CREDENTIALS path.');
        }
        throw err;
      }
    }

    if (!this.apiKey) {
      throw new Error('GOOGLE_AUTH_ERROR: Missing GOOGLE_API_KEY. Use AI Studio API keys with gemini-1.5-* models, or configure Vertex AI for 2.5.');
    }
    const client = new GoogleGenerativeAI(this.apiKey);
    const model = client.getGenerativeModel({ model: modelName, systemInstruction: system });
    try {
      const res = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: user }]}],
        generationConfig: { responseMimeType: 'application/json', temperature: 0 },
      } as any);
      const content = (res as any)?.response?.text?.() ?? (res as any)?.response?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
      return content;
    } catch (err: any) {
      const msg = String(err?.message || '');
      const code = (err?.status ?? err?.code ?? '') + '';
      if (msg.includes('API keys are not supported') || msg.includes('CREDENTIALS_MISSING') || code === '401') {
        throw new Error('GOOGLE_AUTH_ERROR: Invalid or missing API key for Google AI Studio.');
      }
      throw err;
    }
  }
}