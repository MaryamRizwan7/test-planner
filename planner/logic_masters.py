import pandas as pd
import random
from collections import defaultdict

def validate_capacity_per_department(blocks, students, num_days, num_shifts_per_day):
    errors = []
    for _, student_row in students.iterrows():
        dept = student_row['DEPARTMENT']
        e_students = student_row['STUDENTS_FOR_EVENING']
        w_students = student_row['STUDENTS_FOR_WEEKEND']
        dept_blocks = blocks[blocks['DEPARTMENT'] == dept]

        if dept_blocks.empty:
            errors.append(f"No blocks found for {dept}")
            continue

        cap_per_shift = dept_blocks["PCS"].sum()
        # Simplistic split: half shifts for Evening, half for Weekend
        total_e_cap = cap_per_shift * (num_days * (num_shifts_per_day // 2 + num_shifts_per_day % 2))
        total_w_cap = cap_per_shift * (num_days * (num_shifts_per_day // 2))

        if e_students > total_e_cap:
            errors.append(f"{dept} Evening needs {e_students}, has {total_e_cap}")
        if w_students > total_w_cap:
            errors.append(f"{dept} Weekend needs {w_students}, has {total_w_cap}")

    if errors:
        raise ValueError("\n".join(errors))

def generate_schedule(blocks, invigilators, students, days_dates, shift_times):
    schedule_rows = []
    roll_counters = {}
    remaining_students = {}
    
    for _, row in students.iterrows():
        dept = row['DEPARTMENT']
        remaining_students[f"{dept}_E"] = row['STUDENTS_FOR_EVENING']
        remaining_students[f"{dept}_W"] = row['STUDENTS_FOR_WEEKEND']
        roll_counters[f"{dept}_E"] = 1
        roll_counters[f"{dept}_W"] = 1

    invigilator_pool = invigilators['NAME'].dropna().tolist()

    for day in days_dates:
        for s_idx, shift in enumerate(shift_times):
            shift_id = f"{day}_{s_idx}"
            session = "E" if s_idx % 2 == 0 else "W"
            available_invigs = invigilator_pool.copy()
            random.shuffle(available_invigs)

            for _, student_row in students.iterrows():
                dept = student_row['DEPARTMENT']
                key = f"{dept}_{session}"
                
                if remaining_students[key] <= 0:
                    continue
                
                dept_blocks = blocks[blocks['DEPARTMENT'] == dept].sort_values('PCS', ascending=False)
                
                for _, b_row in dept_blocks.iterrows():
                    if remaining_students[key] <= 0: break
                    if not available_invigs: break
                    
                    assigned = min(int(b_row['PCS']), remaining_students[key])
                    invig = available_invigs.pop(0)
                    ext = invigilators[invigilators['NAME'] == invig]['EXTENSION'].values[0]

                    schedule_rows.append({
                        "Day": day.strftime("%m-%d-%Y"),
                        "Time": f"{shift['start']} - {shift['end']}",
                        "Department": dept,
                        "Department Incharge": b_row['DEPARTMENT_INCHARGE'],
                        "Venue": b_row['BLOCK'],
                        "Roll No": f"{student_row['SHORT_FORM']}-{session}-{str(roll_counters[key]).zfill(3)} to {str(roll_counters[key]+assigned-1).zfill(3)}",
                        "Invigilator": invig,
                        "Extension": ext
                    })
                    
                    roll_counters[key] += assigned
                    remaining_students[key] -= assigned

    return pd.DataFrame(schedule_rows)