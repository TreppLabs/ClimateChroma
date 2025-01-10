import pandas as pd

def process_climate_data(input_file, output_file):
    # Step 1: Load the data
    data = pd.read_csv(input_file)

    # Step 2: Drop rows with missing TMAX or TMIN
    data = data.dropna(subset=["TMAX", "TMIN"])

    # Step 3: Convert Fahrenheit to Celsius
    data["TMAX_C"] = (data["TMAX"] - 32) * 5 / 9
    data["TMIN_C"] = (data["TMIN"] - 32) * 5 / 9

    # Step 4: Add derived columns
    data["TAVG_C"] = (data["TMAX_C"] + data["TMIN_C"]) / 2
    data["TRANGE_C"] = data["TMAX_C"] - data["TMIN_C"]

    # Step 5: Save the processed dataset
    data.to_csv(output_file, index=False)
    return data  # Optionally return the processed DataFrame

