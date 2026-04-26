import { GoogleGenerativeAI } from "@google/generative-ai";

export const processChatContext = async (req, res) => {
  try {
    const { messages, mode, groupName } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "No messages provided for context." });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Gemini API Key is not configured." });
    }

    // Initialize Google Generative AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const isGroup = !!groupName;

    // Format chat history for context
    const chatHistory = messages
      .map((msg) => {
        const role = msg.senderId === req.user._id.toString() ? "Me" : (msg.senderName || "Other");
        return `${role}: ${msg.text}`;
      })
      .join("\n");

    const contextPrefix = isGroup
      ? `This is a group chat called "${groupName}" with multiple participants.\n\n`
      : "";

    let prompt = "";
    if (mode === "summary") {
      prompt = `${contextPrefix}You are a helpful AI assistant. Provide a 3-bullet point summary of the following conversation:\n\n${chatHistory}`;
    } else if (mode === "reply") {
      const replyContext = isGroup
        ? "suggest 3 quick, helpful responses for me to send in this group conversation"
        : "suggest 3 quick, helpful responses for me to send in this conversation";
      prompt = `${contextPrefix}You are a helpful AI assistant. Based on the conversation tone, ${replyContext}. Return only the 3 suggestions, one per line:\n\n${chatHistory}`;
    } else if (mode === "sentiment") {
      prompt = `${contextPrefix}You are an AI that only outputs emojis. Analyze the tone of the last few messages in this conversation and return a single emoji representing the mood (e.g., 😠, 😊, 🚨). Return ONLY the emoji, nothing else:\n\n${chatHistory}`;
    } else {
      return res.status(400).json({ error: "Invalid mode provided. Expected 'summary', 'reply', or 'sentiment'." });
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ result: text.trim() });
  } catch (error) {
    console.error("Error in processChatContext: ", error);
    res.status(500).json({ error: "Failed to process chat context with AI." });
  }
};

