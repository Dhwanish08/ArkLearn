function createTextbookPrompt(request) {
  const { content, mode, language = 'en' } = request;
  
  const modeInstructions = {
    'summary': 'Create a comprehensive, well-structured summary of the textbook content. Include main topics, key concepts, and important details. Organize it in a logical flow that students can easily follow.',
    'key-points': 'Extract and list the main concepts, key points, and important facts from the content. Present them in a clear, bullet-point format that highlights the most essential information.',
    'questions': 'Generate 10-15 practice questions based on the content. Include a mix of multiple choice, short answer, and essay questions. Provide answers for each question. Make sure questions test different levels of understanding.',
    'flashcards': 'Create flashcards for important concepts, terms, and definitions. Format each flashcard with a clear question/term on the front and a detailed answer/explanation on the back. Include 15-20 flashcards.',
    'explain': 'Provide detailed explanations of complex concepts, theories, or topics mentioned in the content. Break down difficult ideas into simpler, more understandable parts with examples.',
    'examples': 'Find and provide real-world examples, applications, and case studies related to the concepts in the content. Show how the theoretical knowledge applies to practical situations.'
  };

  const languageNames = {
    'en': 'English',
    'gu': 'Gujarati',
    'hi': 'Hindi',
    'sa': 'Sanskrit'
  };
  
  const targetLanguage = languageNames[language] || 'English';
  const instruction = modeInstructions[mode] || modeInstructions['summary'];

  return `You are an expert educational AI assistant specializing in textbook content analysis and learning enhancement.

TASK: ${instruction}

TEXTBOOK CONTENT:
${content}

LANGUAGE INSTRUCTION: Provide your response in ${targetLanguage}. If the content contains text in other languages, you may reference it appropriately, but your main response should be in ${targetLanguage}.

FORMATTING REQUIREMENTS:
- Use clear, structured formatting
- Include headings and subheadings where appropriate
- Use bullet points and numbered lists for better readability
- Make the content engaging and easy to understand
- Ensure accuracy and educational value

Please analyze the provided textbook content and generate the requested learning material.`;
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate request body
    const { content, mode, language } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'Textbook content is required' });
    }

    if (content.length > 5000) {
      return res.status(400).json({ error: 'Content too long (max 5000 characters)' });
    }

    if (!mode || !['summary', 'key-points', 'questions', 'flashcards', 'explain', 'examples'].includes(mode)) {
      return res.status(400).json({ error: 'Valid learning mode is required' });
    }

    // Get Gemini API key
    const geminiApiKey = process.env.VITE_GEMINI_API_KEY;
    if (!geminiApiKey) {
      console.error('Gemini API key not configured');
      return res.status(500).json({ error: 'AI service not configured' });
    }

    // Create the prompt
    const prompt = createTextbookPrompt({ content, mode, language });

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
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2000,
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

    const aiResult = geminiData.candidates[0].content.parts[0].text;

    // Return the result
    return res.status(200).json({
      success: true,
      result: aiResult,
    });

  } catch (error) {
    console.error('Textbook assistant error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 