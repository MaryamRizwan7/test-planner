function validateCapacity(blocks, totalStudents, numDays, numShifts) {
  const totalPCS = blocks.reduce((sum, block) => {
    const pcs = parseInt(block.PCS, 10) || 0;
    return sum + pcs;
  }, 0);

  const totalCapacity = totalPCS * numDays * numShifts;

  if (totalStudents > totalCapacity) {
    const dayLabel = numDays === 1 ? "day" : "days";
    const shiftLabel = numShifts === 1 ? "shift" : "shifts";
    throw new Error(
      `Insufficient seating capacity: ${totalStudents} students scheduled ` +
      `but only ${totalCapacity} seats available across ${numDays} ${dayLabel} and ${numShifts} ${shiftLabel}.`
    );
  }
}

function formatDate(dateObj) {
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${month}-${day}-${year}`;
}

function assignStudentsToBlocks(blocks, totalStudents, invigilators, dayDates, shiftTimes) {
  const rows = [];
  let rollCounter = 1;

  // Make a list of invigilator names
  const invigilatorsList = invigilators.map(invig => invig.NAME);

  const totalSlots = dayDates.length * shiftTimes.length;
  const baseStudentsPerSlot = Math.floor(totalStudents / totalSlots);
  const remainder = totalStudents % totalSlots;

  const slotTargets = [];
  for (let i = 0; i < totalSlots; i++) {
    const target = baseStudentsPerSlot + (i < remainder ? 1 : 0);
    slotTargets.push(target);
  }

  let slotIndex = 0;

  for (let dayIdx = 0; dayIdx < dayDates.length; dayIdx++) {
    const dayDate = dayDates[dayIdx];
    if (rollCounter > totalStudents) break;

    for (let shiftIndex = 0; shiftIndex < shiftTimes.length; shiftIndex++) {
      if (rollCounter > totalStudents) break;

      const shift = shiftTimes[shiftIndex];
      const timeStr = `${shift.start} to ${shift.end}`;

      // Shuffle invigilators for this shift
      const shiftInvigilators = [...invigilatorsList];
      for (let i = shiftInvigilators.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shiftInvigilators[i], shiftInvigilators[j]] = [shiftInvigilators[j], shiftInvigilators[i]];
      }

      const availableBlocks = [...blocks];
      const targetStudents = slotTargets[slotIndex];
      slotIndex++;
      let assignedHere = 0;

      let neededBlocks = 0;
      let remaining = targetStudents;
      for (const block of availableBlocks) {
        if (remaining <= 0) break;
        neededBlocks++;
        remaining -= (parseInt(block.PCS, 10) || 0);
      }

      if (neededBlocks > shiftInvigilators.length) {
        const blockWord = neededBlocks === 1 ? "venue" : "venues";
        const invigilatorWord = shiftInvigilators.length === 1 ? "invigilator" : "invigilators";
        throw new Error(
          `Insufficient invigilators: ${neededBlocks} ${blockWord} require supervision per shift ` +
          `but only ${shiftInvigilators.length} ${invigilatorWord} available per shift.`
        );
      }

      for (const block of availableBlocks) {
        if (assignedHere >= targetStudents || rollCounter > totalStudents) break;

        const blockCapacity = parseInt(block.PCS, 10) || 0;

        const remainingGlobal = totalStudents - rollCounter + 1;
        const remainingSlot = targetStudents - assignedHere;
        const assignNow = Math.min(blockCapacity, remainingGlobal, remainingSlot);

        if (assignNow <= 0) continue;

        const startRoll = rollCounter;
        const endRoll = rollCounter + assignNow - 1;

        let invig = "";
        let extension = "";

        if (shiftInvigilators.length > 0) {
          invig = shiftInvigilators.pop();
          const invigRow = invigilators.find(i => i.NAME === invig);
          if (invigRow) {
            extension = invigRow.EXTENSION || "";
          }
        }

        rows.push({
          Day: formatDate(dayDate),
          Time: timeStr,
          "Roll No": `${startRoll} to ${endRoll}`,
          Venue: block.BLOCK,
          Department: block.DEPARTMENT,
          Capacity: block.PCS,
          Invigilator: invig,
          Extension: extension,
          "Department Incharge": block.DEPARTMENT_INCHARGE
        });

        rollCounter += assignNow;
        assignedHere += assignNow;
      }
    }
  }

  return rows;
}

function generateSchedule(blocks, totalStudents, invigilators, dayDates, shiftTimes) {
  return assignStudentsToBlocks(blocks, totalStudents, invigilators, dayDates, shiftTimes);
}

module.exports = {
  validateCapacity,
  assignStudentsToBlocks,
  generateSchedule
};
