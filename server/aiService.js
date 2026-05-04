const { spawn } = require("child_process");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);
const modelName = "gemini-1.5-flash-8b";
function cleanJsonResponse(text) {
  if (!text) return "";
  return text.replace(/```json|```/gi, '').trim();
}

async function mapColumnsWithAI(rawHeaders, requiredColumns, filename) {
  try {
    console.log("[AI] Starting mapColumnsWithAI...");
    const model = genAI.getGenerativeModel({ model: modelName });
    const prompt = `You are a data schema mapper. Given these column headers from an uploaded file called '${filename}': ${JSON.stringify(rawHeaders)}
Map each header to the closest match from this required schema: ${JSON.stringify(requiredColumns)}
Rules:
- Use semantic understanding, not just exact matching
- 'Dept' maps to 'DEPARTMENT', 'Room' maps to 'BLOCK', 'Computers' maps to 'PCS', etc.
- Only map if you are confident. Use null for headers with no reasonable match.
- A required column can only be mapped once (no duplicates in values)
Respond with ONLY a raw JSON object, no markdown, no backticks, no explanation:
{ "originalHeader": "REQUIRED_COLUMN" }`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanJson = cleanJsonResponse(responseText);
    const mapping = JSON.parse(cleanJson);
    console.log("[AI] Successfully mapped columns.");
    return mapping;
  } catch (e) {
    console.error("[AI] Error in mapColumnsWithAI:", e.message);
    return {};
  }
}

async function parseNaturalLanguageInput(text) {
  try {
    console.log("[AI] Starting parseNaturalLanguageInput...");
    const model = genAI.getGenerativeModel({ model: modelName });
    const prompt = `You are an NLP parser for an exam scheduling system. Extract structured scheduling parameters from this text: '${text}'
Today's reference year is 2025 if no year is mentioned.
Time format must be HH:MM AM/PM (e.g. '09:00 AM', '01:00 PM').
Date format must be MM-DD-YYYY.
If the user says '3 days starting September 4th', generate the array ['09-04-2025', '09-05-2025', '09-06-2025'].
If shifts are mentioned as time ranges extract start and end times.
Set confidence to 'high' only if all major fields were clearly mentioned.
Respond with ONLY a raw JSON object, no markdown, no backticks, no explanation. Format:
{
  "Number_Of_Students": number or null,
  "Days": number or null,
  "Number_Of_Shifts": number or null,
  "Day_Dates": ["MM-DD-YYYY", ...] or [],
  "Shift_Times": [{"start": "HH:MM AM/PM", "end": "HH:MM AM/PM"}, ...] or [],
  "Program": "bachelor" or "master" or null,
  "confidence": "high" or "medium" or "low"
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanJson = cleanJsonResponse(responseText);
    const parsed = JSON.parse(cleanJson);
    console.log("[AI] Successfully parsed natural language input.");
    return parsed;
  } catch (e) {
    console.error("[AI] Error in parseNaturalLanguageInput:", e.message);
    return null;
  }
}

async function detectScheduleAnomalies(scheduleRows, blocks, totalStudents) {
  try {
    console.log("[AI] Starting detectScheduleAnomalies...");
    if (!scheduleRows || scheduleRows.length === 0) {
      return "No schedule generated.";
    }

    const capacityMap = {};
    for (const b of blocks) {
      capacityMap[b.BLOCK] = parseInt(b.PCS, 10) || 0;
    }

    const statsSummary = {
      capacityUtilization: {},
      invigilatorCounts: {},
      studentDistribution: {},
      totalScheduled: 0,
      unscheduledStudents: 0
    };

    for (const row of scheduleRows) {
      const venue = row.Venue;
      const invig = row.Invigilator;
      const day = row.Day;
      const time = row.Time;
      const capacityStr = row.Capacity || 0;
      let assigned = 0;

      const rollMatch = row["Roll No"] ? row["Roll No"].match(/\d+/g) : null;
      if (rollMatch && rollMatch.length >= 2) {
        assigned = parseInt(rollMatch[rollMatch.length - 1], 10) - parseInt(rollMatch[0], 10) + 1;
      } else {
        assigned = parseInt(capacityStr, 10) || 0;
      }

      statsSummary.totalScheduled += assigned;

      if (!statsSummary.capacityUtilization[venue]) {
        statsSummary.capacityUtilization[venue] = { assigned: 0, capacity: capacityMap[venue] || 0 };
      }
      statsSummary.capacityUtilization[venue].assigned += assigned;

      if (invig) {
        statsSummary.invigilatorCounts[invig] = (statsSummary.invigilatorCounts[invig] || 0) + 1;
      }

      const shiftKey = `${day} ${time}`;
      if (!statsSummary.studentDistribution[shiftKey]) {
        statsSummary.studentDistribution[shiftKey] = 0;
      }
      statsSummary.studentDistribution[shiftKey] += assigned;
    }

    for (const v in statsSummary.capacityUtilization) {
      const data = statsSummary.capacityUtilization[v];
      if (data.capacity > 0) {
        statsSummary.capacityUtilization[v] = `${((data.assigned / data.capacity) * 100).toFixed(1)}%`;
      } else {
        statsSummary.capacityUtilization[v] = 'Unknown Capacity';
      }
    }

    statsSummary.unscheduledStudents = Math.max(0, totalStudents - statsSummary.totalScheduled);

    const model = genAI.getGenerativeModel({ model: modelName });
    const prompt = `You are an exam scheduling quality analyst. Analyze this schedule summary and generate a concise plain-English report with:
1. Overall status (success/warnings/issues)
2. Any venues over 90% capacity (flag as warning)
3. Any invigilators assigned to more than 3 slots (flag as potential overload)
4. Any unscheduled students
5. Distribution balance assessment
6. One-line recommendation if any issues found
Schedule summary: ${JSON.stringify(statsSummary)}
Keep the report under 150 words. Use bullet points. Be direct and factual.`;

    const result = await model.generateContent(prompt);
    console.log("[AI] Successfully generated anomaly report.");
    return result.response.text();
  } catch (e) {
    console.error("[AI] Error in detectScheduleAnomalies:", e.message);
    return "Schedule generated successfully. AI analysis unavailable.";
  }
}

async function generateVenuePlanNarrative(scheduleRows, program, semester, year) {
  try {
    console.log("[AI] Starting generateVenuePlanNarrative...");
    if (!scheduleRows || scheduleRows.length === 0) throw new Error("Empty schedule.");

    const uniqueVenues = [...new Set(scheduleRows.map(r => r.Venue))];
    const uniqueDepartments = [...new Set(scheduleRows.map(r => r.Department))];
    const uniqueDates = [...new Set(scheduleRows.map(r => r.Day))];

    let rollRange = "N/A";
    if (scheduleRows.length > 0) {
      const firstRow = scheduleRows[0];
      const lastRow = scheduleRows[scheduleRows.length - 1];
      const firstRollMatch = firstRow["Roll No"] ? firstRow["Roll No"].match(/^([^\s]+)/) : null;
      const lastRollMatch = lastRow["Roll No"] ? lastRow["Roll No"].match(/([^\s]+)$/) : null;
      if (firstRollMatch && lastRollMatch) {
        rollRange = `${firstRollMatch[1]} to ${lastRollMatch[1]}`;
      }
    }

    const uniqueDatesFormatted = uniqueDates.join(', ');

    const model = genAI.getGenerativeModel({ model: modelName });
    const prompt = `You are writing formal institutional document text for NED University of Engineering & Technology, Department of Computer Science & Information Technology.
Generate a one-paragraph formal description (max 60 words) for an exam venue plan with:
- Program: ${program} (bachelor or master)
- Semester: ${semester} ${year}
- Number of venues: ${uniqueVenues.length}
- Departments involved: ${uniqueDepartments.join(', ')}
- Exam dates: ${uniqueDatesFormatted}
- Total roll number range: ${rollRange}
Write in formal academic style. This text appears on the cover of an official exam document.`;

    const result = await model.generateContent(prompt);
    console.log("[AI] Successfully generated narrative.");
    return result.response.text().trim();
  } catch (e) {
    console.error("[AI] Error in generateVenuePlanNarrative:", e.message);
    return `Admission Entry Test venue plan for ${semester} ${year} examination.`;
  }
}

async function suggestScheduleImprovements(scheduleRows, blocks, invigilators) {
  try {
    console.log("[AI] Starting suggestScheduleImprovements...");
    if (!scheduleRows || scheduleRows.length === 0) return [];

    const capacityMap = {};
    for (const b of blocks) capacityMap[b.BLOCK] = parseInt(b.PCS, 10) || 0;

    const analysisSummary = {
      overloadedVenues: [],
      underusedVenues: [],
      invigilatorLoad: {},
      unusedBlocks: []
    };

    const venueUsage = {};
    for (const row of scheduleRows) {
      const venue = row.Venue;
      const invig = row.Invigilator;
      const capacityStr = row.Capacity || 0;
      let assigned = 0;

      const rollMatch = row["Roll No"] ? row["Roll No"].match(/\d+/g) : null;
      if (rollMatch && rollMatch.length >= 2) {
        assigned = parseInt(rollMatch[rollMatch.length - 1], 10) - parseInt(rollMatch[0], 10) + 1;
      } else {
        assigned = parseInt(capacityStr, 10) || 0;
      }

      if (!venueUsage[venue]) venueUsage[venue] = { assigned: 0, capacity: capacityMap[venue] || 0 };
      venueUsage[venue].assigned += assigned;

      if (invig) analysisSummary.invigilatorLoad[invig] = (analysisSummary.invigilatorLoad[invig] || 0) + 1;
    }

    for (const v in venueUsage) {
      const data = venueUsage[v];
      if (data.capacity > 0) {
        const ratio = data.assigned / data.capacity;
        if (ratio > 0.9) analysisSummary.overloadedVenues.push(v);
        if (ratio < 0.5) analysisSummary.underusedVenues.push(v);
      }
    }

    for (const b of blocks) {
      if (!venueUsage[b.BLOCK]) analysisSummary.unusedBlocks.push(b.BLOCK);
    }

    const model = genAI.getGenerativeModel({ model: modelName });
    const prompt = `You are an exam scheduling optimization assistant. Based on this schedule analysis, suggest up to 3 specific, actionable improvements. 
Be concise — one sentence per suggestion.
Analysis: ${JSON.stringify(analysisSummary)}
Format your response as a JSON array of strings: ["suggestion 1", "suggestion 2"]
Respond with ONLY the raw JSON array, no markdown, no backticks.`;

    const result = await model.generateContent(prompt);
    const cleanJson = cleanJsonResponse(result.response.text());
    const suggestions = JSON.parse(cleanJson);
    console.log("[AI] Successfully generated improvements.");
    return Array.isArray(suggestions) ? suggestions : [];
  } catch (e) {
    console.error("[AI] Error in suggestScheduleImprovements:", e.message);
    return [];
  }
}

// NLP Extractive Summarization via Python/NLTK (no Gemini API call)
async function generateScheduleSummary(scheduleRows, program) {
  return new Promise((resolve) => {
    try {
      console.log("[NLP] Starting generateScheduleSummary via Python/NLTK...");
      if (!scheduleRows || scheduleRows.length === 0) {
        return resolve("No schedule data available.");
      }

      const scriptPath = path.join(__dirname, "..", "summarizer.py");
      const pythonProcess = spawn("python", [scriptPath]);

      const dataChunks = [];
      const errorChunks = [];

      pythonProcess.stdout.on("data", (chunk) => dataChunks.push(chunk));
      pythonProcess.stderr.on("data", (chunk) => errorChunks.push(chunk));

      pythonProcess.stdin.write(
        JSON.stringify({ schedule: scheduleRows, program: program || "bachelor" })
      );
      pythonProcess.stdin.end();

      pythonProcess.on("close", (code) => {
        const output = Buffer.concat(dataChunks).toString().trim();
        if (code !== 0 || !output) {
          const errMsg = Buffer.concat(errorChunks).toString().trim();
          console.error("[NLP] Python summarizer error:", errMsg);
          return resolve("Summary unavailable.");
        }
        console.log("[NLP] Successfully generated NLP summary.");
        resolve(output);
      });

      pythonProcess.on("error", (err) => {
        console.error("[NLP] Failed to spawn Python process:", err.message);
        resolve("Summary unavailable.");
      });

    } catch (e) {
      console.error("[NLP] Error in generateScheduleSummary:", e.message);
      resolve("Summary unavailable.");
    }
  });
}

module.exports = {
  mapColumnsWithAI,
  parseNaturalLanguageInput,
  detectScheduleAnomalies,
  generateVenuePlanNarrative,
  suggestScheduleImprovements,
  generateScheduleSummary
};