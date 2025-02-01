import psycopg2
import csv
# 
# This file loads the EIA-860 data into a PostgreSQL database.
# This is electric power plant data.
# Extracting a small subset, see below.
# Process for getting this data:
#  * Data source: https://www.eia.gov/electricity/data/eia860/
#  * download the zip file and extract the contents to the eia860_data folder
#  * The data files are in Excel format, so we need to convert them to CSV
#  * Run the convert_eia860_files.py script to convert the Excel files to CSV
#  * Run the checknulls.py script to check for NULL, empty, or whitespace values in the CSV files
#    * The "generator" file has a "NOTE" row at the very end, which should be removed
#  * Create a new database in PostgreSQL called 'climatechroma'
#  * Run this script to load the data into the database
#  * Load order is utilities, plants, generators, to maintain foreign key constraints
# 
def create_tables(conn):
    with conn.cursor() as cur:
        cur.execute("""

        CREATE TABLE IF NOT EXISTS utilities (
            utility_id INTEGER PRIMARY KEY,
            utility_name TEXT
        );

        CREATE TABLE IF NOT EXISTS plants (
            plant_code INTEGER PRIMARY KEY,
            utility_id INTEGER,
            plant_name TEXT,
            latitude REAL,
            longitude REAL,
            FOREIGN KEY (utility_id) REFERENCES utilities(utility_id)
        );

        CREATE TABLE IF NOT EXISTS generators (
            plant_code INTEGER,
            generator_id TEXT,
            technology TEXT,
            nameplate_capacity_mw REAL,
            status TEXT,
            PRIMARY KEY (plant_code, generator_id),
            FOREIGN KEY (plant_code) REFERENCES plants(plant_code)
        );
        """)
        conn.commit()

def convert_boolean(value):
    """Convert 'Yes'/'No' to boolean, and handle case sensitivity."""
    if isinstance(value, str):
        value = value.strip().lower()
        if value == 'yes':
            return True
        elif value == 'no':
            return False
    return None

def convert_numeric(value, dtype):
    # print(f"Converting value: {value} to {dtype}")  # Log the arguments
    """Convert empty strings and spaces to None, otherwise cast to int or float."""
    if value.strip() == '':
        return None
    try:
        return dtype(value)
    except ValueError:
        print(f"Warning: Could not convert value '{value}' to {dtype}")
        return None

def convert_text(value):
    """Convert empty strings to None for text fields."""
    return None if value.strip() == '' else value

def load_data(conn, file_path, table_name, column_names, converters=None):
    if converters is None:
        converters = {}

    with conn.cursor() as cur, open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader)  # Skip the first header line (metadata)
        headers = next(reader)  # Read the actual column names
        print(f"Loading data into {table_name}. CSV Columns: {headers}")

        # Mapping of CSV column names → DB column names
        # kinda janky to put table-specific stuff here, but whatever
        # risk is that mapping are not consistent across tables
        csv_to_db_mapping = {
            # Utilities table
            'Utility ID': 'utility_id',
            'Utility Name': 'utility_name',

            # Plants table
            'Plant Code': 'plant_code',
            'Utility ID': 'utility_id',
            'Plant Name': 'plant_name',
            'Latitude': 'latitude',
            'Longitude': 'longitude',

            # Generators table
            'Plant Code': 'plant_code',
            'Generator ID': 'generator_id',
            'Technology': 'technology',
            'Nameplate Capacity (MW)': 'nameplate_capacity_mw',
            'Status': 'status'
        }

        for row in reader:
            # print(f"Original row: {row}")  # Debugging output
            
            # Convert row into a dictionary with DB column names
            row_dict = {
                csv_to_db_mapping.get(col, col): converters.get(col, convert_text)(val)
                for col, val in zip(headers, row)
                if col in csv_to_db_mapping  # Only keep mapped columns
            }
            # print(f"Converted row dict: {row_dict}")  # Debugging output

            # Extract values in the correct order
            row = [row_dict[col] for col in column_names]
            # print(f"Filtered row: {row}")  # Debugging output

            placeholders = ', '.join(['%s'] * len(column_names))
            query = f"INSERT INTO {table_name} ({', '.join(column_names)}) VALUES ({placeholders}) ON CONFLICT DO NOTHING;"
            # print(f"Executing query: {query}")  # Debugging output
            # print(f"With values: {row}")  # Debugging output

            print(f"Inserting into {table_name}: {row}")  # Debugging output

            try:
                cur.execute(query, row)
            except psycopg2.Error as e:
                print(f"Error inserting into {table_name}: {e}")
                print(f"Problematic row: {row}")
                conn.rollback()
        
        conn.commit()

def main():
    conn = psycopg2.connect(dbname='climatechroma', user='postgres', host='localhost')
    create_tables(conn)
    
    # Load data from CSV files into the database
    # NOTE: To maintain foreign key constraints, we need to load the data in the following order:
    # 1. Load utilities
    # 2. Load plants
    # 3. Load generators
    # Alternatively we could use DEFERRABLE INITIALLY DEFERRED constraints, but that's more complex.
    
    load_data(conn, 'eia860_data/extracted/1___Utility_Y2023.csv', 'utilities', [
        'utility_id', 'utility_name'
    ])
    
    load_data(conn, 'eia860_data/extracted/2___Plant_Y2023.csv', 'plants', [
        'plant_code', 'utility_id', 'plant_name', 'latitude', 'longitude'
    ], converters={
        'Latitude': lambda x: convert_numeric(x, float),
        'Longitude': lambda x: convert_numeric(x, float)
    })

    load_data(conn, 'eia860_data/extracted/3_1_Generator_Y2023.csv', 'generators', [
        'plant_code', 'generator_id', 'technology', 'nameplate_capacity_mw','status'
    ], converters={
        'Nameplate Capacity (MW)': lambda x: convert_numeric(x, float)
    })

    conn.close()
if __name__ == "__main__":
    main()

