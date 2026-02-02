import OpenAI from 'openai';
import { config } from 'dotenv';

// Load environment from current directory
config();

const client = new OpenAI({
  apiKey: process.env.VENICE_API_KEY,
  baseURL: 'https://api.venice.ai/api/v1'
});

const completion = await client.chat.completions.create({
  model: 'venice-uncensored',
  messages: [
    { role: 'user', content: 'Hello!' }
  ]
});

console.log(completion.choices[0].message.content);

