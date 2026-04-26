import pandas as pd

def clean_data(df, expected_columns=None, filename=None):
    """
    Cleans bachelor data DataFrame.
    - Standardizes column names
    - Renames common variants
    - Drops empty rows
    - Cleans strings and numeric columns
    - Ensures expected columns exist
    
    Args:
        df: DataFrame to clean
        expected_columns: List of required column names
        filename: Name of the file being processed (for error messages)
    """
    # --- Clean column names ---
    column_map = {col: str(col).strip().replace('"', '').replace("'", "").replace(' ', '_').upper()
                  for col in df.columns}
    df = df.rename(columns=column_map)

    # --- Standardize common columns ---
    standardization_map = {
        'DEPARTMENT': ['DEPARTMENT', 'DEPT', 'DISCIPLINE'],
        'BLOCK': ['BLOCK', 'ROOM', 'VENUE'],
        'PCS': ["PCS", "PC'S", "COMPUTERS", "PC_COUNT", "PCS_COUNT"],
        'DEPARTMENT_INCHARGE': ['DEPARTMENT_INCHARGE', 'INCHARGE', 'HOD'],
        'NAME': ['NAME', 'INVIGILATOR', 'INVIGILATOR_NAME', 'NAMES'],
        'EXTENSION': ['EXTENSION', 'EXT', 'PHONE', 'PHONE_EXT']
    }

    for standard_name, variants in standardization_map.items():
        for variant in variants:
            if variant in df.columns and standard_name not in df.columns:
                df = df.rename(columns={variant: standard_name})

    # --- BETTER EMPTY ROW HANDLING ---
    # Remove rows where all values are NaN/None
    df = df.dropna(how='all')
    
    # Remove rows where all string values are empty/whitespace only
    def is_empty_row(row):
        return all(str(cell).strip() == '' for cell in row if pd.notna(cell))
    
    # Create mask for empty rows
    empty_mask = df.apply(is_empty_row, axis=1)
    df = df[~empty_mask]
    
    # Remove rows where NAME is empty/whitespace (for invigilators)
    if 'NAME' in df.columns:
        df = df[df['NAME'].astype(str).str.strip() != '']
        df = df[df['NAME'].astype(str).str.strip() != 'nan']

    # --- Clean string columns ---
    for col in df.select_dtypes(include=['object']):
        df[col] = df[col].astype(str).str.strip()
        # Replace empty strings with NaN
        df[col] = df[col].replace('', pd.NA)
        df[col] = df[col].replace('nan', pd.NA)
        
        if col == 'EXTENSION':
            df[col] = pd.to_numeric(df[col], errors='coerce')

    # --- Remove rows with missing essential data ---
    if 'NAME' in df.columns:
        df = df.dropna(subset=['NAME'])
    if 'EXTENSION' in df.columns:
        df = df.dropna(subset=['EXTENSION'])

    # --- Fill numeric NaNs with 0 ---
    numeric_cols = df.select_dtypes(include=['number']).columns
    if not numeric_cols.empty:
        df[numeric_cols] = df[numeric_cols].fillna(0)

    df = df.reset_index(drop=True)

    # --- Enforce expected columns ---
    if expected_columns:
        missing = set(expected_columns) - set(df.columns)
        if missing:
            column_label = "column" if len(missing) == 1 else "columns"
            file_info = f" in file '{filename}'" if filename else ""
            raise ValueError(f"Missing required {column_label}: {missing}{file_info}")

    return df