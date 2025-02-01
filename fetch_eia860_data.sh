#!/bin/bash
# This script actually doesn't work.  CLose but no cigar.
# In the end, I manually downloaded and unzipped.

# Define the year (you can change this to any year you want)
YEAR="2023"

# Define the download URL using the year variable
URL="https://www.eia.gov/electricity/data/eia860/xls/eia860${YEAR}.zip"

# Define the output directory and file name
OUTPUT_DIR="./data"
OUTPUT_FILE="${OUTPUT_DIR}/eia860_${YEAR}.zip"

# Create the directory if it doesn't exist
mkdir -p $OUTPUT_DIR

# Download the file
echo "Downloading EIA 860 dataset for the year ${YEAR}..."
curl -o $OUTPUT_FILE $URL

# Check if the file was downloaded successfully
if [[ -f $OUTPUT_FILE ]]; then
  echo "Download successful: ${OUTPUT_FILE}"
else
  echo "Download failed. Please check the URL and try again."
fi
#!/bin/bash

# Define the working directory for EIA-860 data
WORK_DIR="./eia860_data"
DOWNLOAD_DIR="$WORK_DIR/downloads"
EXTRACT_DIR="$WORK_DIR/extracted"
ZIP_FILE_NAME="eia860.zip"

# Ensure the working directory exists
mkdir -p $DOWNLOAD_DIR
mkdir -p $EXTRACT_DIR

# Navigate to the download directory
cd $DOWNLOAD_DIR

# Fetch the latest EIA-860 zip file from the EIA website
echo "Downloading EIA-860 data..."
curl -L "https://www.eia.gov/electricity/data/eia860/archive/xls/eia860_$(date +%Y).zip" -o $ZIP_FILE_NAME

# Check if the download was successful
if [ $? -ne 0 ]; then
  echo "Download failed. Exiting script."
  exit 1
fi

# Extract the downloaded zip file
echo "Extracting the ZIP file..."
unzip $ZIP_FILE_NAME -d $EXTRACT_DIR

# Check if extraction was successful
if [ $? -ne 0 ]; then
  echo "Extraction failed. Exiting script."
  exit 1
fi

echo "EIA-860 data downloaded and extracted successfully."
echo "Data available in $EXTRACT_DIR"

