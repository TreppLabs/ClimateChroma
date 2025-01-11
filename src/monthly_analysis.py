# src/monthly_analysis.py

import pandas as pd
import matplotlib.pyplot as plt

def compute_monthly_averages(data):
    """
    Compute monthly averages of TMAX and TMIN from the input DataFrame.

    Parameters:
        data (pd.DataFrame): DataFrame containing 'DATE', 'TMAX', and 'TMIN' columns.

    Returns:
        pd.DataFrame: DataFrame with 'MONTH', 'TMAX', and 'TMIN' columns averaged by month.
    """
    data['DATE'] = pd.to_datetime(data['DATE'])  # Ensure DATE is datetime
    data['MONTH'] = data['DATE'].dt.month       # Extract month
    monthly_averages = data.groupby('MONTH')[['TMAX', 'TMIN']].mean().reset_index()
    return monthly_averages

def plot_monthly_averages(monthly_averages):
    """
    Plot monthly averages of TMAX and TMIN.

    Parameters:
        monthly_averages (pd.DataFrame): DataFrame with 'MONTH', 'TMAX', and 'TMIN' columns.
    """
    plt.figure(figsize=(10, 6))
    plt.plot(monthly_averages['MONTH'], monthly_averages['TMAX'], marker='o', label='TMAX')
    plt.plot(monthly_averages['MONTH'], monthly_averages['TMIN'], marker='o', label='TMIN')
    plt.title('Monthly Average Temperatures', fontsize=16)
    plt.xlabel('Month', fontsize=14)
    plt.ylabel('Temperature (°C)', fontsize=14)
    plt.xticks(ticks=range(1, 13), labels=[
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ], fontsize=12)
    plt.legend(fontsize=12)
    plt.grid(True)
    plt.show()
