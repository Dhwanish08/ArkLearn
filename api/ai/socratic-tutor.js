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
  
  return `You are a Socratic tutor helping a ${grade} student with ${subject}. 

Your role is to guide the student to discover the answer themselves through thoughtful questioning, not to give direct answers.

Student's question: "${question}"

Please respond in the following format:

1. **Understanding the Question**: Briefly acknowledge what they're asking
2. **Guiding Questions**: Ask 2-3 thoughtful questions that will help them think through this step by step
3. **Key Concepts**: Mention 1-2 important concepts they should consider
4. **Next Steps**: Suggest what they should try or think about next

Keep your response encouraging, clear, and focused on helping them develop their own understanding. Don't give away the answer directly.`;
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
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