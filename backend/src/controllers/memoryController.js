import { GoogleGenAI } from "@google/genai";
import Memory from "../models/memoryModel.js";

const MODEL = "gemini-3-flash-preview";

const generate = async (prompt) => {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: { apiVersion: "v1beta" },
  });
  const result = await ai.models.generateContent({ model: MODEL, contents: prompt });
  return result.text;
};

// ── Helpers ────────────────────────────────────────────────────────────────

// Resolve relative dates ("Monday", "tomorrow") to absolute YYYY-MM-DD
const resolveDate = (dateText) => {
  if (!dateText) return null;
  try {
    const now = new Date();
    const lower = dateText.toLowerCase().trim();

    if (lower === "today") return now;
    if (lower === "tomorrow") {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      return d;
    }

    const days = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
    const dayIdx = days.indexOf(lower);
    if (dayIdx !== -1) {
      const d = new Date(now);
      const diff = (dayIdx - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + diff);
      return d;
    }

    // Try native parsing as last resort
    const parsed = new Date(dateText);
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
};

// Parse Gemini JSON response safely
const parseJSON = (text) => {
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
};

// ── POST /api/memory/chat ──────────────────────────────────────────────────
// Main endpoint: accepts user message + conversation history
// 1. Extracts memories from the message
// 2. Resolves pronouns against memory store
// 3. Returns AI response with full context
export const memoryChat = async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    const userId = req.user._id;

    if (!message?.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const currentDate = new Date().toDateString();

    // ── Step 1: Extract memories from the new message ──────────────────
    const extractionPrompt = `
You are a memory extraction AI. Today is ${currentDate}.

Analyze the following message and extract important facts, events, preferences, or reminders.
Only extract genuinely personal, user-specific information worth remembering.

Message: "${message}"

Return a JSON array. Each item must have:
{
  "type": "event" | "fact" | "preference" | "reminder",
  "entity": "short name of the thing (e.g. 'interview', 'birthday')",
  "value": "the detail (e.g. 'Monday', 'at 3pm', 'prefers dark mode')",
  "dateText": "the raw date text if any (e.g. 'Monday', 'tomorrow') or null",
  "importance": "high" | "medium" | "low",
  "rawText": "the relevant excerpt from the message"
}

If nothing important is found, return [].
Return ONLY valid JSON, no explanation.
`;

    const extractedRaw = await generate(extractionPrompt);
    const extracted = parseJSON(extractedRaw) || [];

    // Store extracted memories
    const savedMemories = [];
    for (const item of extracted) {
      if (!item.entity || !item.value) continue;
      const resolvedDate = resolveDate(item.dateText);
      const mem = await Memory.create({
        userId,
        type: item.type || "fact",
        entity: item.entity,
        value: item.value,
        resolvedDate,
        rawText: item.rawText || message,
        importance: item.importance || "medium",
      });
      savedMemories.push(mem);
    }

    // ── Step 2: Load user's memory store ──────────────────────────────
    const allMemories = await Memory.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // ── Step 3: Context-aware response with pronoun resolution ─────────
    const deixisWords = /\b(it|that|this|them|those|these|he|she|they|there|then)\b/i;
    const hasDeixis = deixisWords.test(message);

    const conversationText = conversationHistory
      .slice(-10)
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

    const memoryText = allMemories
      .map(
        (m) =>
          `[ID:${m._id}] ${m.type.toUpperCase()} — ${m.entity}: ${m.value}${
            m.resolvedDate ? ` (on ${new Date(m.resolvedDate).toDateString()})` : ""
          }${m.reminderSet ? " [REMINDER SET]" : ""}`
      )
      .join("\n");

    const chatPrompt = `
You are a helpful AI assistant with persistent memory. Today is ${currentDate}.

USER'S MEMORY STORE:
${memoryText || "(empty — no memories yet)"}

RECENT CONVERSATION:
${conversationText || "(start of conversation)"}

User's new message: "${message}"

${
  hasDeixis
    ? `IMPORTANT: The message contains a pronoun or reference word ("it", "that", etc.).
Resolve what it refers to using the Memory Store and conversation above.
`
    : ""
}

Instructions:
- If the user is asking to set a reminder ("remind me", "don't let me forget"), identify the referenced event and confirm you'll remind them.
- If the user is referring to something by pronoun, clearly resolve it and respond accordingly.
- Be concise and helpful. Reference specific memory entries by name when relevant.
- If you extracted new memories from this message, briefly acknowledge what you remembered.

Also return a JSON block at the END of your response (after your text reply) in this exact format:
---MEMORY_META---
{
  "resolvedEntity": "what 'it' or the pronoun refers to, or null",
  "referencedMemoryId": "the Memory Store ID of the referenced memory, or null",
  "isReminderRequest": true | false,
  "reminderEntity": "entity name to set reminder for, or null"
}
---END_META---
`;

    const fullResponse = await generate(chatPrompt);

    // Split response text from metadata
    const metaMatch = fullResponse.match(
      /---MEMORY_META---\s*([\s\S]*?)\s*---END_META---/
    );
    const metaJSON = metaMatch ? parseJSON(metaMatch[1]) : null;
    const responseText = fullResponse
      .replace(/---MEMORY_META---[\s\S]*?---END_META---/, "")
      .trim();

    // ── Step 4: Handle reminder request ───────────────────────────────
    if (metaJSON?.isReminderRequest && metaJSON?.reminderEntity) {
      // Find the referenced memory and mark it as having a reminder
      let targetId = metaJSON.referencedMemoryId;

      if (!targetId) {
        // Fuzzy match by entity name
        const match = allMemories.find((m) =>
          m.entity.toLowerCase().includes(metaJSON.reminderEntity.toLowerCase())
        );
        targetId = match?._id;
      }

      if (targetId) {
        await Memory.findByIdAndUpdate(targetId, { reminderSet: true });
      }
    }

    // ── Step 5: Return response ────────────────────────────────────────
    res.status(200).json({
      response: responseText,
      memoriesExtracted: savedMemories.map((m) => ({
        id: m._id,
        type: m.type,
        entity: m.entity,
        value: m.value,
        resolvedDate: m.resolvedDate,
        reminderSet: m.reminderSet,
      })),
      resolvedEntity: metaJSON?.resolvedEntity || null,
      isReminderRequest: metaJSON?.isReminderRequest || false,
    });
  } catch (error) {
    console.error("Error in memoryChat:", error);
    res.status(500).json({ error: "Memory chat failed. " + error.message });
  }
};

// ── GET /api/memory ────────────────────────────────────────────────────────
export const getMemories = async (req, res) => {
  try {
    const memories = await Memory.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(memories);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch memories" });
  }
};

// ── GET /api/memory/reminders ──────────────────────────────────────────────
// Returns pending reminders (set but not yet fired)
export const getPendingReminders = async (req, res) => {
  try {
    const reminders = await Memory.find({
      userId: req.user._id,
      reminderSet: true,
      reminderFired: false,
    }).lean();
    res.status(200).json(reminders);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch reminders" });
  }
};

// ── PATCH /api/memory/:id/fire ─────────────────────────────────────────────
export const fireReminder = async (req, res) => {
  try {
    const mem = await Memory.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { reminderFired: true },
      { new: true }
    );
    if (!mem) return res.status(404).json({ error: "Memory not found" });
    res.status(200).json(mem);
  } catch (error) {
    res.status(500).json({ error: "Failed to update reminder" });
  }
};

// ── DELETE /api/memory/:id ─────────────────────────────────────────────────
export const deleteMemory = async (req, res) => {
  try {
    await Memory.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete memory" });
  }
};
