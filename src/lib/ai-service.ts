/**
 * AI Service Utility
 * 
 * Handles requests to AI services with a fallback for local development.
 * In development mode, it can call the Gemini API directly if an API key is provided,
 * which bypasses the requirement for local serverless function support.
 */

interface SocraticRequest {
    question: string;
    subject: string;
    grade: string;
    chapter?: string;
    textbookContext?: string;
    language?: string;
    conversationHistory?: Array<{ type: 'student' | 'tutor', message: string }>;
}

interface TextbookRequest {
    content: string;
    mode: string;
    language?: string;
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const IS_DEV = import.meta.env.DEV;

/**
 * Call the Socratic Tutor AI
 */
export async function callSocraticTutor(request: SocraticRequest) {
    // If we are in DEV mode
    if (IS_DEV) {
        if (!GEMINI_API_KEY) {
            throw new Error("Missing Gemini API Key. Please add VITE_GEMINI_API_KEY to your .env file and restart the dev server.");
        }
        try {
            const prompt = createSocraticPrompt(request);
            return await callGeminiDirect(prompt, 0.7, 800);
        } catch (error: any) {
            console.error("Direct Gemini call failed:", error);
            throw new Error(error.message || "Failed to connect to AI service (Direct)");
        }
    }

    // Otherwise use the serverless API route
    const response = await fetch("/api/ai/socratic-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            throw new Error(data.error || "Failed to get response from AI service");
        }
        throw new Error(`AI service error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
}

/**
 * Call the Textbook Assistant AI
 */
export async function callTextbookAssistant(request: TextbookRequest) {
    // If we are in DEV mode
    if (IS_DEV) {
        if (!GEMINI_API_KEY) {
            throw new Error("Missing Gemini API Key. Please add VITE_GEMINI_API_KEY to your .env file and restart the dev server.");
        }
        try {
            const prompt = createTextbookPrompt(request);
            return await callGeminiDirect(prompt, 0.3, 2000);
        } catch (error: any) {
            console.error("Direct Gemini call failed:", error);
            throw new Error(error.message || "Failed to connect to AI service (Direct)");
        }
    }

    // Otherwise use the serverless API route
    const response = await fetch("/api/ai/textbook-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            throw new Error(data.error || "Failed to generate content");
        }
        throw new Error(`AI service error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.result;
}

/**
 * Directly call Gemini API from the browser
 */
async function callGeminiDirect(prompt: string, temperature: number, maxTokens: number) {
    // Try multiple model identifiers and API versions
    const models = ["gemini-1.5-flash-latest", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
    const apiVersions = ["v1", "v1beta"];
    let lastError: any = null;

    for (const model of models) {
        for (const version of apiVersions) {
            try {
                console.log(`Attempting Gemini call with version: ${version}, model: ${model}...`);
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }],
                            generationConfig: {
                                temperature,
                                topK: 40,
                                topP: 0.95,
                                maxOutputTokens: maxTokens,
                            },
                        }),
                    }
                );

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    const errorMessage = errorData.error?.message || response.statusText;

                    // Specific ignore for 404 (model/version not found) or 400 (bad version for model)
                    if (response.status === 404 || response.status === 400) {
                        console.warn(`Gemini [${version}] ${model} not available:`, errorMessage);
                        continue;
                    }

                    console.warn(`Gemini [${version}] ${model} failed:`, errorMessage);

                    // If it's an API key error, don't keep trying other models
                    if (response.status === 401 || (response.status === 400 && errorMessage.toLowerCase().includes("key"))) {
                        throw new Error(`Invalid API Key or Key blocked: ${errorMessage}`);
                    }

                    lastError = new Error(`Gemini [${version}] ${model} error: ${errorMessage}`);
                    continue;
                }

                const data = await response.json();
                if (!data.candidates || data.candidates.length === 0) {
                    console.warn(`Gemini [${version}] ${model} returned no candidates`);
                    continue;
                }

                console.log(`Gemini [${version}] ${model} call successful!`);
                return data.candidates[0].content.parts[0].text;
            } catch (error: any) {
                if (error.message.includes("API Key")) throw error;
                console.error(`Error with [${version}] model ${model}:`, error.message);
                lastError = error;
            }
        }
    }

    throw lastError || new Error("All Gemini model attempts failed. Please check your API key and internet connection.");
}

/**
 * Prompt creators (Mirrored from the serverless API files)
 */

function createSocraticPrompt(request: SocraticRequest) {
    const { question, subject = 'general', grade = 'high school', chapter = '', textbookContext = '', language = 'en', conversationHistory = [] } = request;

    let contextPrompt = '';
    if (chapter) {
        contextPrompt += `\n\nTEXTBOOK CHAPTER CONTEXT: The student is currently studying ${chapter}. Please tailor your response to align with this specific chapter's content and learning objectives.`;
    }
    if (textbookContext) {
        contextPrompt += `\n\nTEXTBOOK CONTENT REFERENCE:\n${textbookContext.substring(0, 1500)}\n\nUse this textbook content as a reference to provide accurate, curriculum-aligned guidance.`;
    }

    const languageNames: Record<string, string> = { 'en': 'English', 'gu': 'Gujarati', 'hi': 'Hindi', 'sa': 'Sanskrit' };
    const targetLanguage = languageNames[language || 'en'] || 'English';
    contextPrompt += `\n\nLANGUAGE INSTRUCTION: Respond in ${targetLanguage}. If the student asks in a different language, you may respond in that language, but primarily use ${targetLanguage} for explanations and guidance.`;

    return `You are a warm, encouraging Socratic tutor having a one-on-one conversation with a ${grade} student about ${subject}. 
Your teaching style:
- Be conversational and friendly, like a caring teacher
- Ask thoughtful questions that guide the student to discover answers themselves
- Provide gentle explanations and encouragement
- Use examples and analogies when helpful
- Keep the tone encouraging and supportive
- If textbook context is provided, reference it appropriately to ensure accuracy
- Adapt your language complexity to the student's grade level

${contextPrompt}

${conversationHistory.length > 0 ? `Previous conversation context:
${conversationHistory.map(msg => `${msg.type === 'student' ? 'Student' : 'Tutor'}: ${msg.message}`).join('\n')}

Current student question: "${question}"` : `Student's question: "${question}"`}

Respond as if you're having a natural conversation. If this is a follow-up question, continue the conversation naturally. Start by acknowledging their question warmly, then guide them with questions and gentle explanations. Be conversational, not formal. Use phrases like "That's a great question!" or "Let me help you think through this..." 

IMPORTANT: Only respond with what you would actually say to the student. Do NOT include any internal instructions, thinking processes, or notes. Just give the actual conversational response.

Keep it conversational and encouraging!`;
}

function createTextbookPrompt(request: TextbookRequest) {
    const { content, mode, language = 'en' } = request;

    const modeInstructions: Record<string, string> = {
        'summary': 'Create a comprehensive, well-structured summary of the textbook content. Include main topics, key concepts, and important details. Organize it in a logical flow that students can easily follow.',
        'key-points': 'Extract and list the main concepts, key points, and important facts from the content. Present them in a clear, bullet-point format that highlights the most essential information.',
        'questions': 'Generate 10-15 practice questions based on the content. Include a mix of multiple choice, short answer, and essay questions. Provide answers for each question. Make sure questions test different levels of understanding.',
        'flashcards': 'Create flashcards for important concepts, terms, and definitions. Format each flashcard with a clear question/term on the front and a detailed answer/explanation on the back. Include 15-20 flashcards.',
        'explain': 'Provide detailed explanations of complex concepts, theories, or topics mentioned in the content. Break down difficult ideas into simpler, more understandable parts with examples.',
        'examples': 'Find and provide real-world examples, applications, and case studies related to the concepts in the content. Show how the theoretical knowledge applies to practical situations.'
    };

    const languageNames: Record<string, string> = { 'en': 'English', 'gu': 'Gujarati', 'hi': 'Hindi', 'sa': 'Sanskrit' };
    const targetLanguage = languageNames[language || 'en'] || 'English';
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
