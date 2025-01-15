# src/monthly_analysis.py

import pandas as pd
import matplotlib.pyplot as plt

import numpy as np
from sklearn.linear_model import LinearRegression
import matplotlib.pyplot as plt

def plot_trend(data, column, title):
    data['YEAR'] = data['DATE'].dt.year  # Extract year
    yearly_avg = data.groupby('YEAR')[column].mean().reset_index()

    # Fit a linear regression model
    X = yearly_avg['YEAR'].values.reshape(-1, 1)
    y = yearly_avg[column].values
    model = LinearRegression()
    model.fit(X, y)
    trend_line = model.predict(X)

    # Plot
    plt.figure(figsize=(10, 6))
    plt.plot(yearly_avg['YEAR'], y, marker='o', label=f'Average {column}')
    plt.plot(yearly_avg['YEAR'], trend_line, color='red', linestyle='--', label='Trend Line')
    plt.title(title, fontsize=16)
    plt.xlabel('Year', fontsize=14)
    plt.ylabel('Temperature (°C)', fontsize=14)
    plt.legend(fontsize=12)
    plt.grid(True)
    plt.show()

    # Print slope of the trend
    print(f"Trend: {model.coef_[0]:.4f}°C per year")


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

def compute_historical_monthly_averages(data):
    """
    Compute 40-year historical monthly averages of TMAX and TMIN.

    Parameters:
        data (pd.DataFrame): DataFrame containing 'DATE', 'TMAX', and 'TMIN'.

    Returns:
        pd.DataFrame: DataFrame with 'MONTH', 'TMAX', and 'TMIN' averages over all years.
    """
    data['DATE'] = pd.to_datetime(data['DATE'])  # Ensure DATE is datetime
    data['MONTH'] = data['DATE'].dt.month       # Extract month
    historical_averages = data.groupby('MONTH')[['TMAX', 'TMIN']].mean().reset_index()
    return historical_averages

def calculate_anomalies(data, historical_averages):
    """
    Calculate anomalies by subtracting historical monthly averages from actual values.

    Parameters:
        data (pd.DataFrame): DataFrame with 'DATE', 'MONTH', 'TMAX', and 'TMIN'.
        historical_averages (pd.DataFrame): DataFrame with historical monthly averages.

    Returns:
        pd.DataFrame: Original data with 'TMAX_ANOMALY' and 'TMIN_ANOMALY' columns added.
    """
    # Merge data with historical averages to align by month
    data = data.merge(historical_averages, on='MONTH', suffixes=('', '_HIST'))
    
    # Calculate anomalies
    data['TMAX_ANOMALY'] = data['TMAX'] - data['TMAX_HIST']
    data['TMIN_ANOMALY'] = data['TMIN'] - data['TMIN_HIST']
    return data

def plot_anomalies(data):
    """
    Plot anomalies of TMAX and TMIN over time.

    Parameters:
        data (pd.DataFrame): DataFrame containing 'DATE', 'TMAX_ANOMALY', and 'TMIN_ANOMALY'.
    """
    plt.figure(figsize=(12, 6))
    plt.plot(data['DATE'], data['TMAX_ANOMALY'], label='TMAX Anomaly', color='red', alpha=0.7)
    plt.plot(data['DATE'], data['TMIN_ANOMALY'], label='TMIN Anomaly', color='blue', alpha=0.7)
    plt.axhline(0, color='black', linestyle='--', linewidth=1)  # Reference line for zero anomaly
    plt.title('Temperature Anomalies Over Time', fontsize=16)
    plt.xlabel('Year', fontsize=14)
    plt.ylabel('Anomaly (°C)', fontsize=14)
    plt.legend(fontsize=12)
    plt.grid(True)
    plt.show()



