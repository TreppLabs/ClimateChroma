import pandas as pd



# List of .xlsx files to process
files = ['1___Utility_Y2023.xlsx', '2___Plant_Y2023.xlsx', '3_1_Generator_Y2023.xlsx']

# Loop through each file in the list
for file in files:
    # Load the .xlsx file
    df = pd.read_excel(file)
    
    # Convert to CSV
    csv_file = file.replace('.xlsx', '.csv')
    df.to_csv(csv_file, index=False)
    
    print(f"Processed {file} -> {csv_file}")

