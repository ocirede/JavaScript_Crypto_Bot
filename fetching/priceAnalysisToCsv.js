import fs from 'fs';
import path from 'path';
import { Parser } from "@json2csv/plainjs";

export function priceAnalysisToCsv(analysisResults, filePath, resetFile = false) {
  console.log("analysisResults function has been called");
  console.log(analysisResults);

  // Ensure the directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }

  // Flatten the priceAnalysis object and transform into vertical format
  const flattenObjectToArray = (obj, prefix = '') => {
    const result = [];
    
    for (const [key, value] of Object.entries(obj)) {
      // Remove time prefix (like '5m', '4h') from the key
      const newKey = prefix ? `${prefix}.${key.replace(/\d+(m|h)/, '')}` : key.replace(/\d+(m|h)/, '');

      if (typeof value === 'object' && value !== null) {
        // If the value is an object (like a timeframe), recursively flatten it
        result.push(...flattenObjectToArray(value, newKey));
      } else {
        // Otherwise, push it as a key-value pair
        result.push({ Field: newKey, Value: value });
      }
    }
    return result;
  };

  // Flatten the analysisResults object
  const flattenedAnalysis = flattenObjectToArray(analysisResults);
  
  // Create a CSV string using the vertical format
  const json2csvParser = new Parser({ header: true });
  const csv = json2csvParser.parse(flattenedAnalysis);

  // Handle file saving or resetting
  if (resetFile && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`File ${filePath} has been reset.`);
  }

  // Save the CSV data to the file
  fs.writeFileSync(filePath, csv, 'utf8');
  console.log(`CSV file has been saved to ${filePath}`);
}
