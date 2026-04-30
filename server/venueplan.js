const {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, VerticalAlign, Packer, PageBreak
} = require("docx");

function getDayWithSuffix(day) {
  if (day >= 4 && day <= 20) return `${day}th`;
  if (day >= 24 && day <= 30) return `${day}th`;
  const suffixes = ["th", "st", "nd", "rd"];
  const v = day % 10;
  return `${day}${suffixes[v <= 3 ? v : 0] || "th"}`;
}

function formatHeaderDates(dateObjects) {
  if (!dateObjects || dateObjects.length === 0) return "";
  
  const sortedDates = [...dateObjects].sort((a, b) => a - b);
  const firstDate = sortedDates[0];
  
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthYear = `${months[firstDate.getMonth()]} ${firstDate.getFullYear()}`;
  
  const dayNumbers = sortedDates.map(d => getDayWithSuffix(d.getDate()));
  
  let dayString = "";
  if (dayNumbers.length > 2) {
    dayString = dayNumbers.slice(0, -1).join(", ") + " & " + dayNumbers[dayNumbers.length - 1];
  } else if (dayNumbers.length === 2) {
    dayString = dayNumbers.join(" & ");
  } else {
    dayString = dayNumbers[0];
  }
  
  return `${dayString} ${monthYear}`;
}

function formatTableDate(dt) {
  const dayWithSuffix = getDayWithSuffix(dt.getDate());
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${dayWithSuffix} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
}

function convertTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  try {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    let [ , hours, minutes, period ] = match;
    hours = parseInt(hours, 10);
    minutes = parseInt(minutes, 10);
    if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
    if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  } catch (e) {
    return 0;
  }
}

function formatDepartmentName(name) {
  if (!name) return "";
  if (name.includes("Civil")) return "Civil Engineering";
  if (name.includes("Computer")) return "Computer Science & Information Technology";
  if (name.includes("Urban")) return "Urban Engineering";
  return name;
}

function parseDateString(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split(/[-/]/);
  if (parts.length === 3) {
    let month, day, year;
    if (parts[2].length === 4) {
      // assume MM-DD-YYYY or DD-MM-YYYY
      if (parseInt(parts[0], 10) > 12) {
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
      } else {
        month = parseInt(parts[0], 10);
        day = parseInt(parts[1], 10);
      }
      year = parseInt(parts[2], 10);
    } else if (parts[0].length === 4) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    }
    return new Date(year, month - 1, day);
  }
  return new Date(dateStr);
}

function setTableCellOptions(text, isHeader = false) {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: text,
            font: "Calibri (Body)",
            size: 28, // 14pt (half points in docx)
            bold: isHeader
          })
        ],
        alignment: AlignmentType.CENTER
      })
    ],
    verticalAlign: VerticalAlign.CENTER
  });
}

async function generateVenuePlan(scheduleRows, program = "master", semester = "Fall", year = 2025) {
  const BLUE_COLOR = "0000FF";
  const RED_COLOR = "FF0000";
  const DARK_BLUE_COLOR = "00008B";

  const rowsMapped = scheduleRows.map(r => {
    const obj = {};
    for (const k in r) obj[k.toLowerCase()] = r[k];
    obj.day_object = parseDateString(obj.day);
    return obj;
  });

  const uniqueDatesSet = new Set(rowsMapped.map(r => r.day_object.getTime()));
  const uniqueDates = Array.from(uniqueDatesSet).map(t => new Date(t)).sort((a, b) => a - b);
  
  const headerDateString = formatHeaderDates(uniqueDates);
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayOfWeekPrefix = uniqueDates.length === 1 ? `${daysOfWeek[uniqueDates[0].getDay()]} ` : "";

  // Group by venue
  const grouped = {};
  for (const row of rowsMapped) {
    const venue = row.venue;
    if (!grouped[venue]) grouped[venue] = [];
    grouped[venue].push(row);
  }

  const sections = [];

  for (const blockName in grouped) {
    const rows = grouped[blockName];
    const rawDepartmentName = rows[0].department || "";
    const formattedDepartmentName = formatDepartmentName(rawDepartmentName);

    const emptyParagraphs = [];
    for (let i = 0; i < 8; i++) emptyParagraphs.push(new Paragraph(""));

    const sortedRows = [...rows].map(r => {
      r.time_minutes = convertTimeToMinutes(r.time);
      return r;
    }).sort((a, b) => {
      if (a.day_object.getTime() !== b.day_object.getTime()) {
        return a.day_object.getTime() - b.day_object.getTime();
      }
      return a.time_minutes - b.time_minutes;
    });

    const tableRows = [
      new TableRow({
        children: [
          setTableCellOptions("Date", true),
          setTableCellOptions("Time", true),
          setTableCellOptions("Roll No", true)
        ]
      })
    ];

    for (const r of sortedRows) {
      const rollCol = r['roll no'] || r['roll_no'] || r['roll'] || "";
      tableRows.push(new TableRow({
        children: [
          setTableCellOptions(formatTableDate(r.day_object)),
          setTableCellOptions(r.time || ""),
          setTableCellOptions(rollCol)
        ]
      }));
    }

    const table = new Table({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
      alignment: AlignmentType.CENTER
    });

    const programHeader = program.toLowerCase() === "bachelor" 
      ? `Admission Entry Test BS CSIT/IS/DS and BSDS (GDS) (${semester}-${year})`
      : `Admission Entry Test MS CSIT/IS/DS and MSDS (GDS) (${semester}-${year})`;

    sections.push({
      properties: {
        page: {
          margin: { left: "0.75in", right: "0.75in" }
        }
      },
      children: [
        ...emptyParagraphs,
        new Paragraph({
          children: [new TextRun({ text: "NED UNIVERSITY OF ENGINEERING & TECHNOLOGY", font: "Balthazar", size: 40, bold: true })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 0 }
        }),
        new Paragraph({
          children: [new TextRun({ text: "Computer Science & Information Technology", font: "Balthazar", size: 36, bold: true })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [new TextRun({ text: programHeader, font: "Arial", size: 32, bold: true, color: BLUE_COLOR })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 0 }
        }),
        new Paragraph({
          children: [new TextRun({ text: `Admission Test Date: ${dayOfWeekPrefix}${headerDateString}`, font: "Arial", size: 38, bold: true, color: RED_COLOR })],
          alignment: AlignmentType.CENTER
        }),
        new Paragraph(""),
        new Paragraph({
          children: [
            new TextRun({ text: "Venue: ", font: "Calibri Light", size: 52, bold: true, color: DARK_BLUE_COLOR }),
            new TextRun({ text: formattedDepartmentName, font: "Calibri Light", size: 56, bold: true, color: DARK_BLUE_COLOR })
          ],
          alignment: AlignmentType.CENTER
        }),
        new Paragraph(""),
        new Paragraph({
          children: [new TextRun({ text: `Block: ${blockName}`, font: "Calibri (Body)", size: 72, bold: true })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 360 }
        }),
        table
      ]
    });
  }

  const doc = new Document({ sections });
  return await Packer.toBuffer(doc);
}

function generateVenuePlanPreview(scheduleRows, program = "master") {
  const previewBlocks = [];
  
  const rowsMapped = scheduleRows.map(r => {
    const obj = {};
    for (const k in r) obj[k.toLowerCase()] = r[k];
    obj.day_object = parseDateString(obj.day);
    return obj;
  });

  const grouped = {};
  for (const row of rowsMapped) {
    const venue = row.venue;
    if (!grouped[venue]) grouped[venue] = [];
    grouped[venue].push(row);
  }

  for (const blockName in grouped) {
    const rows = grouped[blockName];
    const rawDepartmentName = rows[0].department || "";
    const formattedDepartmentName = formatDepartmentName(rawDepartmentName);
    const incharge = rows[0]['department incharge'] || rows[0]['incharge'] || "N/A";

    const sortedRows = [...rows].map(r => {
      r.time_minutes = convertTimeToMinutes(r.time);
      return r;
    }).sort((a, b) => {
      if (a.day_object.getTime() !== b.day_object.getTime()) {
        return a.day_object.getTime() - b.day_object.getTime();
      }
      return a.time_minutes - b.time_minutes;
    });

    const blockLines = [
      `--- VENUE: Block ${blockName} (${formattedDepartmentName}) ---`,
      `Incharge: ${incharge}`,
      "-".repeat(50),
      `${'Date'.padEnd(20)} | ${'Time'.padEnd(15)} | ${'Roll No'.padEnd(10)}`,
      "-".repeat(50)
    ];

    for (const r of sortedRows) {
      const dateStr = formatTableDate(r.day_object);
      const timeStr = r.time || "";
      const rollCol = r['roll no'] || r['roll_no'] || r['roll'] || "";
      blockLines.push(`${dateStr.padEnd(20)} | ${timeStr.padEnd(15)} | ${rollCol.padEnd(10)}`);
    }

    previewBlocks.push(blockLines.join("\n"));
  }

  return previewBlocks.join("\n\n");
}

module.exports = {
  generateVenuePlan,
  generateVenuePlanPreview
};
