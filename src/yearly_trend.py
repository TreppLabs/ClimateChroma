import numpy as np
from sklearn.linear_model import LinearRegression
import matplotlib.pyplot as plt
# 
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
