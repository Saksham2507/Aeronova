/**
 * AI Service (Google Gemini)
 * ===========================
 * Core wrapper for Google Gemini API (free tier).
 * 
 * Get your free key: https://aistudio.google.com/apikey
 */

const axios = require('axios');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// ─── CORE API CALL ───
async function callAI(systemPrompt, userMessage, options = {}) {
  const { maxTokens = 1000 } = options;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not set in .env file');
  }

  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${apiKey}`,
      {
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [{
          parts: [{ text: userMessage }]
        }],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: 0.7
        }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000
      }
    );

    const text = response.data?.candidates?.[0]?.content?.parts
      ?.map(p => p.text)
      ?.join('\n') || '';

    return text;
  } catch (error) {
    console.error('Gemini API error:', error.response?.data || error.message);
    throw new Error('Gemini API call failed: ' + (error.response?.data?.error?.message || error.message));
  }
}

// ─── JSON EXTRACTION ───
async function callAIJSON(systemPrompt, userMessage, options = {}) {
  const raw = await callAI(systemPrompt, userMessage, options);
  try {
    const objMatch = raw.match(/\{[\s\S]*\}/);
    if (objMatch) return JSON.parse(objMatch[0]);
    const arrMatch = raw.match(/\[[\s\S]*\]/);
    if (arrMatch) return JSON.parse(arrMatch[0]);
  } catch (e) {
    console.error('JSON parse failed:', e.message);
    console.error('Raw response:', raw.substring(0, 500));
  }
  return null;
}

// ─── WEB SEARCH via Gemini grounding (free!) ───
async function callAIWithSearch(systemPrompt, userMessage, options = {}) {
  const { maxTokens = 1000 } = options;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${apiKey}`,
      {
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [{
          parts: [{ text: userMessage }]
        }],
        tools: [{
          google_search: {}
        }],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: 0.7
        }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000
      }
    );

    const text = response.data?.candidates?.[0]?.content?.parts
      ?.map(p => p.text)
      ?.filter(Boolean)
      ?.join('\n') || '';

    return text;
  } catch (error) {
    console.error('Gemini search failed, falling back:', error.message);
    return callAI(systemPrompt, userMessage, options);
  }
}

// ─── JSON with web search ───
async function callAIJSONWithSearch(systemPrompt, userMessage, options = {}) {
  const raw = await callAIWithSearch(systemPrompt, userMessage, options);
  try {
    const objMatch = raw.match(/\{[\s\S]*\}/);
    if (objMatch) return JSON.parse(objMatch[0]);
    const arrMatch = raw.match(/\[[\s\S]*\]/);
    if (arrMatch) return JSON.parse(arrMatch[0]);
  } catch (e) {
    console.error('JSON parse failed:', e.message);
  }
  return null;
}

// ─── AERONOVA SYSTEM CONTEXT ───
const AERONOVA_CONTEXT = `You are the AI intelligence engine for Aeronova Appliances Ltd, an Indian home appliances company.

Company profile:
- Revenue: 6200 Crore INR, 24% CAGR growth
- Products: Refrigerators, Air Conditioners, Washing Machines, Water Heaters, Microwaves
- 78 active SKUs across 5 color variants (white, silver, black, stainless steel, rose gold)
- Plants: Coimbatore (sub-assembly, 2000 units/day), Pune (final assembly + postponement cells, 1500 units/day)
- 8 RDCs: Delhi, Mumbai, Bangalore, Hyderabad, Kolkata, Chennai, Pune, Noida
- 6 Tier-1 suppliers: Taiwan (compressors, PCBs), South Korea (inverter motors), China (fan motors, copper tubing), India (sheet metal, wiring, insulation foam)
- Postponement strategy: Manufacture neutral base units, configure color/variant at Pune cell in 4-6 hours based on demand signal

Key supply chain metrics:
- Current forecast accuracy: 60% (target: 85%)
- Inventory turns: 4.9x (target: 7.5x)
- Response time: 6-8 weeks (target: 10-14 days)
- Metro stockout rate: 18-22% (target: <5%)

Indian market context:
- Major festivals affect demand: Diwali (Nov, +60% North), Onam (Aug, +25% Kerala), Navratri (Oct, +30% Gujarat), Pongal (Jan, +15% South)
- Summer heat waves drive AC demand (March-August)
- Monsoon affects logistics (June-September)
- Wedding season drives gifting (Nov-Feb)
- Color preferences shift with temperature (heat = more white/silver demand)`;

module.exports = {
  callAI,
  callAIJSON,
  callAIWithSearch,
  callAIJSONWithSearch,
  AERONOVA_CONTEXT
};