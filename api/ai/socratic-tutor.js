// Content moderation - check for inappropriate content
function isInappropriateContent(text) {
  const inappropriateWords = [
    // Add any specific words you want to filter
    // This is a basic example - you might want to use a more sophisticated content moderation service
  ];
  
  const lowerText = text.toLowerCase();
  return inappropriateWords.some(word => lowerText.includes(word));
}

function createSocraticPrompt(request) {
  const { question, subject = 'general', grade = 'high school', conversationHistory = [] } = request;
  
  return `You are a warm, encouraging Socratic tutor having a one-on-one conversation with a ${grade} student about ${subject}. 

Your teaching style:
- Be conversational and friendly, like a caring teacher
- Ask thoughtful questions that guide the student to discover answers themselves
- Provide gentle explanations and encouragement
- Use examples and analogies when helpful
- Keep the tone encouraging and supportive

${conversationHistory.length > 0 ? `Previous conversation context:
${conversationHistory.map(msg => `${msg.type === 'student' ? 'Student' : 'Tutor'}: ${msg.message}`).join('\n')}

Current student question: "${question}"` : `Student's question: "${question}"`}

Respond as if you're having a natural conversation. If this is a follow-up question, continue the conversation naturally. Start by acknowledging their question warmly, then guide them with questions and gentle explanations. Be conversational, not formal. Use phrases like "That's a great question!" or "Let me help you think through this..." 

IMPORTANT: Only respond with what you would actually say to the student. Do NOT include any internal instructions, thinking processes, or notes like "(Pause, listen to the student's response...)". Just give the actual conversational response.

Keep it conversational and encouraging!`;
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate request body
    const { question, subject, grade, conversationHistory = [] } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ error: 'Question is required' });
    }

    if (question.length > 1000) {
      return res.status(400).json({ error: 'Question too long (max 1000 characters)' });
    }

    // Content moderation
    if (isInappropriateContent(question)) {
      return res.status(400).json({ error: 'Please keep your questions appropriate and educational.' });
    }

    // Get Gemini API key
    const geminiApiKey = process.env.VITE_GEMINI_API_KEY;
    if (!geminiApiKey) {
      console.error('Gemini API key not configured');
      return res.status(500).json({ error: 'AI service not configured' });
    }

    // Create the prompt
    const prompt = createSocraticPrompt({ question, subject, grade, conversationHistory });

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
    });

  } catch (error) {
    console.error('Socratic tutor error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 