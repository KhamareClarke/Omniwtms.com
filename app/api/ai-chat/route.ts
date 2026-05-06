import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google AI with your API key
const genAI = new GoogleGenerativeAI('AIzaSyCmnI73OESJ_iAVnVl8DAv9_t13ykvC7l8');

const SYSTEM_PROMPT = `You are OmniDeploy's advanced AI Assistant, a sophisticated warehouse management expert powered by Google's Gemini Pro model.

Your core capabilities include:
1. Warehouse Optimization
   - Layout optimization
   - Space utilization analysis
   - Workflow efficiency improvements
   
2. Inventory Management
   - Stock level optimization
   - Demand forecasting
   - Replenishment strategies
   
3. Operations Enhancement
   - Process automation recommendations
   - Resource allocation
   - Performance metrics analysis
   
4. Smart Solutions
   - AI-driven picking strategies
   - Predictive maintenance
   - Real-time optimization

Communication Style:
- Professional and confident
- Clear and concise responses
- Data-driven insights
- Actionable recommendations
- Use bullet points for clarity
- Include relevant metrics when applicable

Always structure your responses to be:
1. Analytical: Base recommendations on data and best practices
2. Actionable: Provide clear, implementable steps
3. Forward-thinking: Consider future scalability
4. Context-aware: Tailor advice to warehouse operations

Remember to:
- Prioritize efficiency and accuracy
- Consider cost-effectiveness
- Focus on practical solutions
- Maintain safety standards
- Suggest technological integrations when relevant`;

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-pro',
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        stopSequences: ["Human:", "Assistant:"]
      }
    });

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: SYSTEM_PROMPT }]
        },
        {
          role: 'model',
          parts: [{ text: 'I understand my role as OmniDeploy\'s advanced AI Assistant. I will provide sophisticated, data-driven warehouse management expertise while maintaining professionalism and actionability in my responses.' }]
        }
      ],
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      },
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    // Process the response to ensure proper formatting
    const formattedResponse = text
      .replace(/\n\n+/g, '\n\n') // Remove excessive newlines
      .trim();

    return NextResponse.json({ 
      response: formattedResponse,
      metadata: {
        model: 'gemini-pro',
        timestamp: new Date().toISOString(),
        processingTime: Date.now(),
      }
    });
  } catch (error: any) {
    console.error('Error in AI chat:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process request. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
} 