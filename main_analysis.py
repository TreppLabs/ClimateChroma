from pandas import read_csv
from src.process_data import process_climate_data
from src.monthly_analysis import compute_monthly_averages
from src.monthly_analysis import plot_monthly_averages
from src.monthly_analysis import (
    compute_historical_monthly_averages,
    calculate_anomalies,
    plot_anomalies,

)
from src.yearly_trend import plot_trend

def main():
    # Input and output paths
    input_path = "data/climate_data.csv"
    
    # Step 1: Preprocess the data
    
    processed_data = process_climate_data(input_path)

    # Step 2: Compute monthly averages
    monthly_averages = compute_monthly_averages(processed_data)
    
    # Step 3: Plot the monthly averages
    plot_monthly_averages(monthly_averages)

    # starting again with the original processed data, compute historical averages and plot anomalies

    # Step 1: Compute historical monthly averages
    historical_averages = compute_historical_monthly_averages(processed_data)

    # Step 2: Calculate anomalies
    data_with_anomalies = calculate_anomalies(processed_data, historical_averages)

    # Step 3: Plot anomalies
    plot_anomalies(data_with_anomalies)

    # starting again with the original processed data, compute trends over time
    plot_trend(processed_data, 'TMAX', 'TMAX Trend Over Time')
    plot_trend(processed_data, 'TMIN', 'TMIN Trend Over Time')


if __name__ == "__main__":
    main()
