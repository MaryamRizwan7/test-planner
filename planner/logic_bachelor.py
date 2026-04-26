import pandas as pd
from datetime import datetime
import random

def validate_capacity(blocks, total_students, num_days, num_shifts):
    errors = []
    total_capacity = blocks["PCS"].sum() * num_days * num_shifts
    if total_students > total_capacity:
        day_label = "day" if num_days == 1 else "days"
        shift_label = "shift" if num_shifts == 1 else "shifts"       
        errors.append(
            f"Insufficient seating capacity: {total_students} students scheduled "
            f"but only {total_capacity} seats available across {num_days} {day_label} and {num_shifts} {shift_label}."
        )

    if errors:
        raise ValueError(" | ".join(errors))

def assign_students_to_blocks(blocks, total_students, invigilators, days_dates, shift_times):
    rows = []
    roll_counter = 1

    invigilators_list = invigilators['NAME'].tolist()

    # ---- Student distribution plan (fair split) ----
    total_slots = len(days_dates) * len(shift_times)
    base_students_per_slot = total_students // total_slots
    remainder = total_students % total_slots

    slot_targets = []
    for i in range(total_slots):
        target = base_students_per_slot + (1 if i < remainder else 0)
        slot_targets.append(target)

    slot_index = 0

    for day_idx, day_date in enumerate(days_dates):
        if roll_counter > total_students:
            break

        for shift_index, shift in enumerate(shift_times):
            if roll_counter > total_students:
                break

            shift_start = shift["start"].strftime("%I:%M %p")
            shift_end = shift["end"].strftime("%I:%M %p")
            time_str = f"{shift_start} to {shift_end}"

            # ---- Reset invigilators for this shift ----
            shift_invigilators = invigilators_list.copy()
            random.shuffle(shift_invigilators)

            # ---- Reset block availability for this shift ----
            available_blocks = list(blocks.itertuples(index=False))

            # Target number of students for this slot
            target_students = slot_targets[slot_index]
            slot_index += 1
            assigned_here = 0

            # ---- How many blocks will actually be needed for this shift? ----
            needed_blocks = 0
            remaining = target_students
            for block in available_blocks:
                if remaining <= 0:
                    break
                needed_blocks += 1
                remaining -= block.PCS

            # ---- Error check (only against needed blocks, not all) ----
            if needed_blocks > len(shift_invigilators):
                block_word = "venue" if needed_blocks == 1 else "venues"
                invigilator_word = "invigilator" if len(shift_invigilators) == 1 else "invigilators"
                raise ValueError(
                    f"Insufficient invigilators: {needed_blocks} {block_word} require supervision per shift "
                    f"but only {len(shift_invigilators)} {invigilator_word} available per shift."
                )

            # ---- Allocate students into blocks for this shift ----
            for block in available_blocks:
                if assigned_here >= target_students or roll_counter > total_students:
                    break  # ✅ stop once quota for this shift is done

                block_dict = block._asdict()
                block_capacity = block_dict["PCS"]

                remaining_global = total_students - roll_counter + 1
                remaining_slot = target_students - assigned_here
                assign_now = min(block_capacity, remaining_global, remaining_slot)

                if assign_now <= 0:
                    continue

                start_roll = roll_counter
                end_roll = roll_counter + assign_now - 1

                # Pick invigilator (unique per shift)
                if shift_invigilators:
                    invig = shift_invigilators.pop()
                    invig_row = invigilators[invigilators['NAME'] == invig]
                    extension = invig_row['EXTENSION'].values[0] if not invig_row.empty else ""
                else:
                    invig = ""
                    extension = ""

                rows.append({
                    "Day": day_date.strftime("%m-%d-%Y"),
                    "Time": time_str,
                    "Roll No": f"{start_roll} to {end_roll}",
                    "Venue": block_dict["BLOCK"],
                    "Department": block_dict["DEPARTMENT"],
                    "Capacity": block_dict["PCS"],
                    "Invigilator": invig,
                    "Extension": extension,
                    "Department Incharge": block_dict["DEPARTMENT_INCHARGE"]
                })

                roll_counter += assign_now
                assigned_here += assign_now

    return rows

def generate_schedule(blocks, total_students, invigilators, days_dates, shift_times):
    rows = assign_students_to_blocks(blocks, total_students, invigilators, days_dates, shift_times)
    return pd.DataFrame(rows)
