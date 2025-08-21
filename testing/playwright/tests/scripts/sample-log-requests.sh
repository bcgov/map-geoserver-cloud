#!/bin/bash

# Check if the correct number of arguments is provided
if [ "$#" -ne 3 ]; then
    echo "Usage: $0 <input_file> <number_of_lines_to_sample>"
    exit 1
fi

# Example command:
# ./sample_log_requests.sh /Users/jhume/documents/202407/openmaps.gov.bc.ca-access.20240731.log 10000 openmaps.20240731.json
INPUT_FILE="$1"
NUM_LINES_TO_SAMPLE="$2"
OUTPUT_FILE="../../fixtures/$3"

# Sample N lines from the original log.
awk 'BEGIN {srand()} {print rand() "\t" $0}' "$INPUT_FILE" | sort -k1,1n | cut -f2- | head -n "$NUM_LINES_TO_SAMPLE" > temp_sampled_lines.txt

# Extract GET and POST requests. Additional request types could be added.
grep -Eo 'GET /geo[^ ]+' temp_sampled_lines.txt | awk '{print $2}' | sort -u > temp_get_geo_urls.txt
grep -Eo 'POST /geo[^ ]+' temp_sampled_lines.txt | awk '{print $2}' | sort -u > temp_post_geo_urls.txt

# Convert the list of URLs into a JSON array
echo "[" > "$OUTPUT_FILE"
awk '{printf "  \"%s\",\n", $0}' temp_get_geo_urls.txt | sed '$ s/,$//' >> "$OUTPUT_FILE"
echo "]" >> "$OUTPUT_FILE"

# Clean up temporary files
# rm temp_sampled_lines.txt temp_get_geo_urls.txt temp_post_geo_urls.txt

echo "Sampled requests have been saved to $OUTPUT_FILE"
