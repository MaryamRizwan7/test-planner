import pandas as pd

def clean_data(df, expected_columns=None, filename=None, blocks_df=None, file_type=None):
    """
    Cleans input DataFrame (Blocks, Invigilators, or Students).
    """

    # --- Standardize column names FIRST ---
    def standardize_columns(df_to_clean):
        column_map = {
            col: str(col).strip().replace('"', '').replace("'", "").replace(' ', '_').upper()
            for col in df_to_clean.columns
        }
        return df_to_clean.rename(columns=column_map)

    df = standardize_columns(df)
    
    # --- Standardization map for common variants ---
    standardization_map = {
        'DEPARTMENT': ['DEPARTMENT', 'DEPT', 'DISCIPLINE'],
        'BLOCK': ['BLOCK', 'ROOM', 'VENUE'],
        'PCS': ["PCS", "PC'S", "COMPUTERS", "PC_COUNT", "PCS_COUNT"],
        'DEPARTMENT_INCHARGE': ['DEPARTMENT_INCHARGE', 'INCHARGE', 'HOD'],
        'NAME': ['NAME', 'INVIGILATOR', 'INVIGILATOR_NAME', 'NAMES'],
        'EXTENSION': ['EXTENSION', 'EXT', 'PHONE', 'PHONE_EXT'],
        'SHORT_FORM': ['SHORT_FORM', 'SHORT', 'CODE'],
        'STUDENTS_FOR_EVENING': ['STUDENTS_FOR_EVENING', 'EVENING', 'EVE'],
        'STUDENTS_FOR_WEEKEND': ['STUDENTS_FOR_WEEKEND', 'WEEKEND', 'WEEK']
    }

    # --- Apply standardization mapping ---
    for standard_name, variants in standardization_map.items():
        for variant in variants:
            if variant in df.columns:
                df = df.rename(columns={variant: standard_name})

    # --- Drop empty rows ---
    df = df.dropna(how="all")
    df = df[~df.apply(lambda row: all(str(cell).strip() in ['', 'nan', 'None'] for cell in row if pd.notna(cell)), axis=1)]

    # --- Clean string columns ---
    for col in df.select_dtypes(include=['object']):
        df[col] = df[col].astype(str).str.strip().replace(['nan', 'NaN', 'None', ''], pd.NA)

    # --- Uppercase DEPARTMENT for consistent matching ---
    if 'DEPARTMENT' in df.columns:
        df['DEPARTMENT'] = df['DEPARTMENT'].str.upper()

    # --- AUTO-DETECT FILE TYPE IF NOT PROVIDED ---
    # This makes the function more resilient if views.py forgets the file_type arg
    if not file_type:
        if 'STUDENTS_FOR_EVENING' in df.columns or 'STUDENTS_FOR_WEEKEND' in df.columns:
            file_type = "students"
        elif 'BLOCK' in df.columns or 'PCS' in df.columns:
            file_type = "blocks"
        elif 'NAME' in df.columns and 'EXTENSION' in df.columns:
            file_type = "invigilators"

    # --- Special handling for Students file ---
    if file_type == "students":
        # Convert student counts to integers (missing -> 0)
        for col in ['STUDENTS_FOR_EVENING', 'STUDENTS_FOR_WEEKEND']:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).astype(int)
            else:
                # If a column is missing, create it as zeros to prevent logic crashes
                df[col] = 0

        # Validate discipline exists in blocks (if blocks_df provided)
        if blocks_df is not None:
            blocks_df = standardize_columns(blocks_df)
            # Re-map blocks_df columns too
            if 'DEPT' in blocks_df.columns: blocks_df.rename(columns={'DEPT': 'DEPARTMENT'}, inplace=True)
            if 'DISCIPLINE' in blocks_df.columns: blocks_df.rename(columns={'DISCIPLINE': 'DEPARTMENT'}, inplace=True)
            
            blocks_depts = set(blocks_df['DEPARTMENT'].str.upper().dropna())
            student_depts = set(df['DEPARTMENT'].str.upper().dropna())

            missing = student_depts - blocks_depts
            if missing:
                missing_list = ", ".join(sorted(missing))
                raise ValueError(f"Students file contains departments not found in Blocks: {missing_list}")

    # --- Enforce required columns ---
    if expected_columns:
        # Before failing, check if we have the standard names
        missing = set(expected_columns) - set(df.columns)
        if missing:
            missing_list = ", ".join(sorted(missing))
            file_info = f" in '{filename}'" if filename else ""
            raise ValueError(f"Missing required columns{file_info}: {missing_list}")
        
        # Return only the columns we need, in the order we expect
        df = df[expected_columns]

    return df.reset_index(drop=True)