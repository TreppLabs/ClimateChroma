import argparse
import pandas as pd

# Set up argument parsing
parser = argparse.ArgumentParser(description="Read CSV file and check columns for nulls and empty values.")
parser.add_argument('filename', type=str, help="Path to the CSV file")
args = parser.parse_args()

# Read the CSV file with two header lines
df = pd.read_csv(args.filename, header=1, low_memory=False)

# Check for columns with null, empty values, or pure white space
for col in df.columns:
    # Count NULL values
    null_count = df[col].isnull().sum()
    
    # Count empty or whitespace values (convert to string and strip whitespaces)
    whitespace_count = (df[col].astype(str).str.strip() == '').sum()
    
    # Total count of NULL, empty, or whitespace values
    total_invalid = null_count + whitespace_count
    
    if total_invalid > 0:
        print(f"Column '{col}' has {total_invalid} NULL, empty, or whitespace values.")
    else:
        print(f"Column '{col}' has no NULL, empty, or whitespace values.")
