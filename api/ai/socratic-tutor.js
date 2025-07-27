// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map();

// Rate limiting configuration
const RATE_LIMIT = {
  MAX_REQUESTS: 10, // 10 requests per window
  WINDOW_MS: 60 * 1000, // 1 minute window
};

function getClientIP(req) {
  return (
    req.headers['x-forwarded-for'] ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    'unknown'
  );
}

function checkRateLimit(clientIP) {
  const now = Date.now();
  const record = rateLimitStore.get(clientIP);

  if (!record || now > record.resetTime) {
    // First request or window expired
    rateLimitStore.set(clientIP, {
      count: 1,
      resetTime: now + RATE_LIMIT.WINDOW_MS,
    });
    return { allowed: true, remaining: RATE_LIMIT.MAX_REQUESTS - 1 };
  }

  if (record.count >= RATE_LIMIT.MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT.MAX_REQUESTS - record.count };
}

function createSocraticPrompt(request) {
  const { question, subject = 'general', grade = 'high school' } = request;
  
  return `You are a warm, encouraging Socratic tutor having a one-on-one conversation with a ${grade} student about ${subject}. 

Your teaching style:
- Be conversational and friendly, like a caring teacher
- Ask thoughtful questions that guide the student to discover answers themselves
- Provide gentle explanations and encouragement
- Use examples and analogies when helpful
- Keep the tone encouraging and supportive

Student's question: "${question}"

Respond as if you're having a natural conversation. Start by acknowledging their question warmly, then guide them with questions and gentle explanations. Be conversational, not formal. Use phrases like "That's a great question!" or "Let me help you think through this..." 

Focus on:
1. Acknowledging their question warmly
2. Asking 2-3 guiding questions that help them think
3. Providing gentle explanations and examples
4. Encouraging them to explore further

Keep it conversational and encouraging!`;
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Rate limiting
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(clientIP);
    
    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Please try again later.',
        remaining: rateLimit.remaining,
      });
    }

    // Validate request body
    const { question, subject, grade } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ error: 'Question is required' });
    }

    if (question.length > 1000) {
      return res.status(400).json({ error: 'Question too long (max 1000 characters)' });
    }

    // Get Gemini API key
    const geminiApiKey = process.env.VITE_GEMINI_API_KEY;
    if (!geminiApiKey) {
      console.error('Gemini API key not configured');
      return res.status(500).json({ error: 'AI service not configured' });
    }

    // Create the prompt
    const prompt = createSocraticPrompt({ question, subject, grade });

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 800,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      console.error('Gemini API error:', await geminiResponse.text());
      return res.status(500).json({ error: 'AI service temporarily unavailable' });
    }

    const geminiData = await geminiResponse.json();
    
    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      return res.status(500).json({ error: 'No response from AI service' });
    }

    const aiResponse = geminiData.candidates[0].content.parts[0].text;

    // Return the response
    return res.status(200).json({
      success: true,
      response: aiResponse,
      remaining: rateLimit.remaining,
    });

  } catch (error) {
    console.error('Socratic tutor error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 