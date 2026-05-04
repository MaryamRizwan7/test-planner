function validateCapacityPerDepartment(blocks, students, numDays, numShiftsPerDay) {
  const errors = [];

  for (const studentRow of students) {
    const dept = studentRow.DEPARTMENT;
    const eStudents = parseInt(studentRow.STUDENTS_FOR_EVENING, 10) || 0;
    const wStudents = parseInt(studentRow.STUDENTS_FOR_WEEKEND, 10) || 0;

    const deptBlocks = blocks.filter(b => b.DEPARTMENT === dept);

    if (deptBlocks.length === 0) {
      errors.push(`No blocks found for ${dept}`);
      continue;
    }

    const capPerShift = deptBlocks.reduce((sum, b) => sum + (parseInt(b.PCS, 10) || 0), 0);

    const totalECap = capPerShift * (numDays * (Math.floor(numShiftsPerDay / 2) + (numShiftsPerDay % 2)));
    const totalWCap = capPerShift * (numDays * Math.floor(numShiftsPerDay / 2));

    if (eStudents > totalECap) {
      errors.push(`${dept} Evening needs ${eStudents}, has ${totalECap}`);
    }
    if (wStudents > totalWCap) {
      errors.push(`${dept} Weekend needs ${wStudents}, has ${totalWCap}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }
}

function formatDate(dateObj) {
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${month}-${day}-${year}`;
}

function generateSchedule(blocks, invigilators, students, dayDates, shiftTimes) {
  const scheduleRows = [];
  const rollCounters = {};
  const remainingStudents = {};
  
  const numDays = dayDates.length;
  const numShiftsPerDay = shiftTimes.length;
  const numESlots = numDays * (Math.floor(numShiftsPerDay / 2) + (numShiftsPerDay % 2));
  const numWSlots = numDays * Math.floor(numShiftsPerDay / 2);

  const slotTargets = {};

  for (const row of students) {
    const dept = row.DEPARTMENT;
    const eStudents = parseInt(row.STUDENTS_FOR_EVENING, 10) || 0;
    const wStudents = parseInt(row.STUDENTS_FOR_WEEKEND, 10) || 0;

    remainingStudents[`${dept}_E`] = eStudents;
    remainingStudents[`${dept}_W`] = wStudents;
    rollCounters[`${dept}_E`] = 1;
    rollCounters[`${dept}_W`] = 1;

    const baseE = numESlots > 0 ? Math.floor(eStudents / numESlots) : 0;
    const remE = numESlots > 0 ? eStudents % numESlots : 0;
    const eTargets = [];
    for (let i = 0; i < numESlots; i++) eTargets.push(baseE + (i < remE ? 1 : 0));

    const baseW = numWSlots > 0 ? Math.floor(wStudents / numWSlots) : 0;
    const remW = numWSlots > 0 ? wStudents % numWSlots : 0;
    const wTargets = [];
    for (let i = 0; i < numWSlots; i++) wTargets.push(baseW + (i < remW ? 1 : 0));

    slotTargets[`${dept}_E`] = eTargets;
    slotTargets[`${dept}_W`] = wTargets;
  }

  const invigilatorPool = invigilators.filter(i => i.NAME).map(i => i.NAME);
  const currentSlotIndex = { E: 0, W: 0 };

  for (const day of dayDates) {
    for (let sIdx = 0; sIdx < shiftTimes.length; sIdx++) {
      const shift = shiftTimes[sIdx];
      const session = (sIdx % 2 === 0) ? 'E' : 'W';
      
      const availableInvigs = [...invigilatorPool];
      for (let i = availableInvigs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableInvigs[i], availableInvigs[j]] = [availableInvigs[j], availableInvigs[i]];
      }

      for (const studentRow of students) {
        const dept = studentRow.DEPARTMENT;
        const key = `${dept}_${session}`;

        const targetStudents = slotTargets[key][currentSlotIndex[session]] || 0;
        if (targetStudents <= 0) continue;

        const deptBlocks = blocks
          .filter(b => b.DEPARTMENT === dept)
          .sort((a, b) => (parseInt(b.PCS, 10) || 0) - (parseInt(a.PCS, 10) || 0));

        let assignedHere = 0;

        for (const bRow of deptBlocks) {
          if (assignedHere >= targetStudents || remainingStudents[key] <= 0) break;
          if (availableInvigs.length === 0) break;

          const blockCap = parseInt(bRow.PCS, 10) || 0;
          const remainingGlobal = remainingStudents[key];
          const remainingSlot = targetStudents - assignedHere;
          const assigned = Math.min(blockCap, remainingGlobal, remainingSlot);
          
          if (assigned <= 0) continue;

          const invig = availableInvigs.shift();
          const invigRow = invigilators.find(i => i.NAME === invig);
          const ext = invigRow ? invigRow.EXTENSION : "";

          const startRoll = String(rollCounters[key]).padStart(3, '0');
          const endRoll = String(rollCounters[key] + assigned - 1).padStart(3, '0');

          scheduleRows.push({
            Day: formatDate(day),
            Time: `${shift.start} - ${shift.end}`,
            Department: dept,
            "Department Incharge": bRow.DEPARTMENT_INCHARGE,
            Venue: bRow.BLOCK,
            "Roll No": `${studentRow.SHORT_FORM}-${session}-${startRoll} to ${endRoll}`,
            Invigilator: invig,
            Extension: ext
          });

          rollCounters[key] += assigned;
          remainingStudents[key] -= assigned;
          assignedHere += assigned;
        }
      }

      currentSlotIndex[session]++;
    }
  }

  return scheduleRows;
}

module.exports = {
  validateCapacityPerDepartment,
  generateSchedule
};
