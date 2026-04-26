# planner/views.py
from django.views.decorators.csrf import csrf_exempt 
from django.http import JsonResponse, HttpResponse
from django.middleware.csrf import get_token
import pandas as pd
import json
from . import logic_bachelor, bachelor_data_cleaning, logic_masters, master_data_cleaning
from datetime import datetime
from io import StringIO, BytesIO
import traceback
import random
import os
import numpy as np
import logging
from .venue_plan import generate_venue_plan, generate_venue_plan_preview
from functools import wraps

logger = logging.getLogger(__name__)

# ---------------- HELPERS (Missing in original) ----------------

def safe_get(row, col_map, key):
    """Safely get value from row using mapped column names"""
    col_name = col_map.get(key.lower().strip())
    if col_name and col_name in row:
        val = row[col_name]
        return val if pd.notna(val) else ""
    return ""

def format_preview_date(date_obj):
    """Formats date objects for the venue plan preview"""
    try:
        return date_obj.strftime("%a, %b %d")
    except:
        return str(date_obj)

# ---------------- CORS Helper Functions ----------------
def add_cors_headers(response):
    response["Access-Control-Allow-Origin"] = "*"
    response["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-CSRFToken"
    return response

def cors_exempt(view_func):
    @wraps(view_func)
    def wrapped_view(request, *args, **kwargs):
        if request.method == "OPTIONS":
            response = HttpResponse()
            return add_cors_headers(response)
        response = view_func(request, *args, **kwargs)
        return add_cors_headers(response)
    return wrapped_view

# ---------------- HELPER FUNCTIONS ----------------
def parse_days_dates(days_dates_raw, expected_count):
    try:
        days_list = json.loads(days_dates_raw)
        parsed = []
        for d in days_list:
            try:
                date_obj = datetime.strptime(d, "%m-%d-%Y").date()
            except ValueError:
                try:
                    date_obj = datetime.strptime(d, "%d-%m-%Y").date()
                except ValueError:
                    date_obj = datetime.strptime(d, "%Y-%m-%d").date()
            parsed.append(date_obj)

        if len(parsed) != expected_count:
            raise ValueError("Number of provided dates does not match 'Days'.")
        return parsed
    except Exception as e:
        raise ValueError(f"Invalid dates format: {str(e)}")

def parse_shift_times(shift_times_raw):
    try:
        shift_times = json.loads(shift_times_raw)
        parsed_shifts = []
        for shift in shift_times:
            start = datetime.strptime(shift["start"], "%I:%M %p").time()
            end = datetime.strptime(shift["end"],"%I:%M %p").time()
            parsed_shifts.append({"start": start, "end": end})
        return parsed_shifts
    except (json.JSONDecodeError, KeyError, ValueError):
        raise ValueError("Invalid shift times format.")

def read_file(file_obj):
    file_name = file_obj.name.lower()
    try:
        if file_name.endswith(('.xlsx', '.xls')):
            return pd.read_excel(file_obj)
        elif file_name.endswith('.csv'):
            file_content = file_obj.read().decode('utf-8')
            return pd.read_csv(StringIO(file_content))
        else:
            raise ValueError(f"Unsupported format: {file_name}")
    except Exception as e:
        raise ValueError(f"Error reading {file_obj.name}: {str(e)}")

# ---------------- VIEW ENDPOINTS ----------------

@csrf_exempt
@cors_exempt
def get_csrf_token(request):
    if request.method == "GET":
        token = get_token(request)
        response = JsonResponse({"csrfToken": token})
        return add_cors_headers(response)
    return HttpResponse(status=405)

def bachelor(request):
    try: 
        blocks_file = request.FILES['Blocks']
        invigilators_file = request.FILES['Invigilators']
        total_students = int(request.POST.get('Number_Of_Students')) 
        num_days = int(request.POST.get('Days'))
        days_dates_raw = request.POST.get('Day Dates') 
        num_shifts = int(request.POST.get('Number Of Shifts')) 
        shift_times_raw = request.POST.get('Shift Times') 

        shift_times = parse_shift_times(shift_times_raw)
        days_dates = parse_days_dates(days_dates_raw, num_days)

        blocks_df = read_file(blocks_file)
        invigilators_df = read_file(invigilators_file)

        blocks = bachelor_data_cleaning.clean_data(blocks_df, expected_columns=['DEPARTMENT', 'BLOCK', 'PCS', 'DEPARTMENT_INCHARGE'], filename=blocks_file.name)
        invigilators = bachelor_data_cleaning.clean_data(invigilators_df, expected_columns=['NAME', 'EXTENSION'], filename=invigilators_file.name)

        logic_bachelor.validate_capacity(blocks, total_students, num_days, num_shifts)
        return logic_bachelor.generate_schedule(blocks, total_students, invigilators, days_dates, shift_times)
    except Exception as e:
        raise e

def master(request):
    try:
        blocks_file = request.FILES['Blocks']
        invigilators_file = request.FILES['Invigilators']
        students_file = request.FILES['Students']
        
        num_days = int(request.POST.get('Days'))
        days_dates_raw = request.POST.get('Day Dates')
        num_shifts = int(request.POST.get('Number Of Shifts'))
        shift_times_raw = request.POST.get('Shift Times')

        shift_times = parse_shift_times(shift_times_raw)
        days_dates = parse_days_dates(days_dates_raw, num_days)

        blocks_df = read_file(blocks_file)
        invigilators_df = read_file(invigilators_file)
        students_df = read_file(students_file)

        blocks = master_data_cleaning.clean_data(blocks_df, expected_columns=['DEPARTMENT', 'BLOCK', 'PCS', 'DEPARTMENT_INCHARGE'], filename=blocks_file.name)
        invigilators = master_data_cleaning.clean_data(invigilators_df, expected_columns=['NAME', 'EXTENSION'], filename=invigilators_file.name)
        students = master_data_cleaning.clean_data(students_df, expected_columns=['DEPARTMENT', 'SHORT_FORM', 'STUDENTS_FOR_EVENING', 'STUDENTS_FOR_WEEKEND'], filename=students_file.name)

        logic_masters.validate_capacity_per_department(blocks, students, num_days, num_shifts)
        return logic_masters.generate_schedule(blocks, invigilators, students, days_dates, shift_times)
    except Exception as e:
        raise e

@csrf_exempt
@cors_exempt
def run_planner(request):
    if request.method != "POST":
        return add_cors_headers(JsonResponse({"status": "error", "message": "Only POST allowed."}))
    
    try:
        program = request.POST.get('Program', '').lower()
        if program == 'bachelor':
            planner_df = bachelor(request)
        elif program == 'master':
            planner_df = master(request)
        else:
            return add_cors_headers(JsonResponse({"status": "error", "message": "Invalid program."}))

        if isinstance(planner_df, JsonResponse):
            return add_cors_headers(planner_df)
        
        schedule_df = planner_df.copy()
        schedule_df.replace('', np.nan, inplace=True)

        col_map = {c.lower().strip(): c for c in schedule_df.columns}
        time_col = col_map.get("time")
        dept_col = col_map.get("department")
        incharge_col = col_map.get("department incharge")
        invigilator_col = col_map.get("invigilator")
        extension_col = col_map.get("extension")
        venue_col = col_map.get("venue")
        day_col = col_map.get("day")
        
        if time_col:
            fill_cols = [dept_col, incharge_col, invigilator_col, extension_col]
            for col in fill_cols:
                if col: schedule_df[col] = schedule_df.groupby(time_col)[col].ffill()
        
        schedule_df = schedule_df.replace({np.nan: None})

        if not venue_col or not day_col:
            raise KeyError("Schedule is missing 'Venue' or 'Day' column.")
        
        # Venue Preview Logic
        date_width, time_width, roll_width = 22, 20, 18
        venue_preview_parts = []
        
        try:
            schedule_df['DateObject'] = pd.to_datetime(schedule_df[day_col], format="%m-%d-%Y")
        except:
            schedule_df['DateObject'] = pd.to_datetime(schedule_df[day_col])
        
        for venue, group in schedule_df.groupby(venue_col):
            group = group.sort_values(by=['DateObject'])
            if time_col: group = group.sort_values(by=[time_col])
            
            first_row = group.iloc[0]
            lines = [
                f"Block {venue} - {safe_get(first_row, col_map, 'department')}",
                f"Incharge: {safe_get(first_row, col_map, 'department incharge')}",
                "", 
                "Date".ljust(date_width) + "Time".ljust(time_width) + "Roll No".ljust(roll_width),
                "-" * (date_width + time_width + roll_width)
            ]

            for _, row in group.iterrows():
                line = format_preview_date(row['DateObject']).ljust(date_width) + \
                       str(safe_get(row, col_map, 'time')).ljust(time_width) + \
                       str(safe_get(row, col_map, 'roll no')).ljust(roll_width)
                lines.append(line)
            venue_preview_parts.append("\n".join(lines))
        
        venue_plan_text = "\n\n".join(venue_preview_parts)
        schedule_df.drop(columns=['DateObject'], inplace=True)
        
        schedule_json = schedule_df.to_dict(orient="records")
        request.session["schedule_data"] = schedule_json
        request.session.save()

        return add_cors_headers(JsonResponse({
            "status": "success",
            "schedule": schedule_json,
            "venuePlan": venue_plan_text
        }))

    except ValueError as e:
        msg = str(e)
        if "NOT ENOUGH" in msg:
            errors = [err.strip() for err in msg.split('\n') if err.strip()]
            return add_cors_headers(JsonResponse({"status": "error", "type": "capacity", "errors": errors}))
        return add_cors_headers(JsonResponse({"status": "error", "message": msg}))
    except Exception as e:
        print(traceback.format_exc())
        return add_cors_headers(JsonResponse({"status": "error", "message": f"Server Error: {str(e)}"}))

# --- Keep preview_venue_plan and download_venue_plan as they were ---
@csrf_exempt
@cors_exempt
def preview_venue_plan(request):
    try:
        schedule_data = request.session.get("schedule_data")
        if not schedule_data:
            return add_cors_headers(JsonResponse({"error": "No data"}, status=400))
        
        schedule_df = pd.DataFrame(schedule_data)
        venue_plan_text = generate_venue_plan_preview(schedule_df)
        return add_cors_headers(JsonResponse({"status": "success", "venuePlan": venue_plan_text}))
    except Exception as e:
        return add_cors_headers(JsonResponse({"error": str(e)}, status=500))

@csrf_exempt
@cors_exempt
def download_venue_plan(request):
    try:
        schedule_data = request.session.get("schedule_data")
        if not schedule_data:
            return add_cors_headers(JsonResponse({"error": "No data"}, status=400))
        
        schedule_df = pd.DataFrame(schedule_data)
        docx_buffer = generate_venue_plan(schedule_df)
        response = HttpResponse(docx_buffer.getvalue(), content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        response["Content-Disposition"] = 'attachment; filename="venue_plan.docx"'
        return add_cors_headers(response)
    except Exception as e:
        return add_cors_headers(JsonResponse({"error": str(e)}, status=500))