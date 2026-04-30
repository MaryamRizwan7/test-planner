require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const xlsx = require('xlsx');

const { cleanData } = require('./dataCleaning');
const logicBachelor = require('./logicBachelor');
const logicMasters = require('./logicMasters');
const { generateVenuePlan, generateVenuePlanPreview } = require('./venueplan');

const app = express();
const port = process.env.PORT || 8000;

app.use(cors({ 
  origin: 'http://localhost:3000', 
  credentials: true,
  allowedHeaders: ['Content-Type', 'X-CSRFToken']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const upload = multer({ storage: multer.memoryStorage() });

function parseFile(file) {
  if (!file) return [];
  const buffer = file.buffer;
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(worksheet, { defval: "" });
}

app.post('/planner/run/', upload.fields([
  { name: 'Blocks', maxCount: 1 },
  { name: 'Invigilators', maxCount: 1 },
  { name: 'Students', maxCount: 1 }
]), (req, res) => {
  try {
    const program = req.body.Program;
    const numStudents = parseInt(req.body.Number_Of_Students, 10) || 0;
    const days = parseInt(req.body.Days, 10) || 1;
    const numShifts = parseInt(req.body.Number_Of_Shifts, 10) || 1;

    let dayDates = [];
    if (req.body.Day_Dates) {
      dayDates = JSON.parse(req.body.Day_Dates).map(d => {
        const [month, day, year] = d.split('-');
        return new Date(year, month - 1, day);
      });
    }

    let shiftTimes = [];
    if (req.body.Shift_Times) {
      shiftTimes = JSON.parse(req.body.Shift_Times).map(s => ({
        start: s.start,
        end: s.end
      }));
    }

    const blocksFile = req.files && req.files.Blocks ? req.files.Blocks[0] : null;
    const invigilatorsFile = req.files && req.files.Invigilators ? req.files.Invigilators[0] : null;
    const studentsFile = req.files && req.files.Students ? req.files.Students[0] : null;

    if (!blocksFile) throw new Error("Blocks file is required.");
    if (!invigilatorsFile) throw new Error("Invigilators file is required.");
    if (program === 'master' && !studentsFile) throw new Error("Students file is required for master program.");

    const rawBlocks = parseFile(blocksFile);
    const rawInvigilators = parseFile(invigilatorsFile);

    const cleanedBlocks = cleanData(rawBlocks, ['DEPARTMENT', 'BLOCK', 'PCS', 'DEPARTMENT_INCHARGE'], blocksFile.originalname);
    const cleanedInvigilators = cleanData(rawInvigilators, ['NAME', 'EXTENSION'], invigilatorsFile.originalname);

    let schedule = [];
    if (program === 'bachelor') {
      logicBachelor.validateCapacity(cleanedBlocks, numStudents, days, numShifts);
      schedule = logicBachelor.generateSchedule(cleanedBlocks, numStudents, cleanedInvigilators, dayDates, shiftTimes);
    } else if (program === 'master') {
      const rawStudents = parseFile(studentsFile);
      const cleanedStudents = cleanData(rawStudents, ['DEPARTMENT', 'STUDENTS_FOR_EVENING', 'STUDENTS_FOR_WEEKEND', 'SHORT_FORM'], studentsFile.originalname);
      logicMasters.validateCapacityPerDepartment(cleanedBlocks, cleanedStudents, days, numShifts);
      schedule = logicMasters.generateSchedule(cleanedBlocks, cleanedInvigilators, cleanedStudents, dayDates, shiftTimes);
    } else {
      throw new Error("Invalid program specified.");
    }

    const venuePlanPreview = generateVenuePlanPreview(schedule, program);

    res.json({
      status: "success",
      schedule: schedule,
      venuePlan: venuePlanPreview
    });

  } catch (error) {
    console.error(error);
    res.json({ status: "error", message: error.message });
  }
});

app.get('/planner/get_csrf_token/', (req, res) => {
  res.json({ csrfToken: "not-needed-in-node" });
});

app.post('/planner/preview_venue_plan/', (req, res) => {
  try {
    const schedule = req.body.schedule || req.body.schedule_data;
    const program = req.body.program;
    if (!schedule) throw new Error("Schedule data is required");
    const preview = generateVenuePlanPreview(schedule, program);
    res.json({ status: "success", preview });
  } catch (error) {
    console.error(error);
    res.json({ status: "error", message: error.message });
  }
});

app.post('/planner/download_venue_plan/', async (req, res) => {
  try {
    const schedule = req.body.schedule || req.body.schedule_data;
    const program = req.body.program || "bachelor";
    const semester = req.body.semester || "Fall";
    const year = req.body.year || new Date().getFullYear();
    
    if (!schedule) throw new Error("Schedule data is required");
    
    const docBuffer = await generateVenuePlan(schedule, program, semester, year);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename="venue_plan.docx"');
    res.send(docBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error generating document: " + error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
