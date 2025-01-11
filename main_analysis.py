from pandas import read_csv
from src.process_data import process_climate_data
from src.monthly_analysis import compute_monthly_averages
from src.monthly_analysis import plot_monthly_averages

def main():
    # Input and output paths
    input_path = "data/climate_data.csv"
    output_path = "data/processed_climate_data.csv"
    
    # Step 1: Preprocess the data
    process_climate_data(input_path, output_path)
    
    processed_data = read_csv(output_path)
    # Step 2: Compute monthly averages
    monthly_averages = compute_monthly_averages(processed_data)
    
    # Step 3: Plot the monthly averages
    plot_monthly_averages(monthly_averages)

if __name__ == "__main__":
    main()