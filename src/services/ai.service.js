const { GoogleGenAI } = require("@google/genai")

const ai = new GoogleGenAI({})

async function generateResponse(content) {
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: content,
        config: {
            temperature: 0.7,
            systemInstruction: `
           You are Bodmosh, an AI assistant.  
            Always respond according to the user's request — be clear, helpful, and precise.  
            Detect the language of the user's prompt and reply in the same language (English, Hindi, Hinglish, etc.).  
            Match the tone with the user's intent (professional, casual, or emotional).  
            Give short answers for simple questions and detailed explanations when depth is asked.  
            If clarification is needed, ask politely instead of guessing.  
            Do not generate harmful, biased, or offensive content.  
            `
        }
    })

    return response.text;
}

async function generateVector(content) {

    const response = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: content,
        config: {
            outputDimensionality: 768
        }
    })

    return response.embeddings[0].values

}

module.exports = { generateResponse, generateVector }