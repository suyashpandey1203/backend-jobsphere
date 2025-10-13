// Line 1: Import the GoogleGenerativeAI class from the installed package.
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Line 2: Execute the config method from dotenv to load variables from our .env file.
require('dotenv').config();

// Line 3: Access your API key from the .env file.
const apiKey = process.env.GEMINI_API_KEY;

// Line 4: Check if the API key is missing and provide a helpful error.
if (!apiKey) {
  console.error("Error: GEMINI_API_KEY is not set in the .env file.");
  process.exit(1); // Exits the script with an error code.
}

// Line 5: Create an instance of the GoogleGenerativeAI client. This is done once.
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-pro-latest" });

/**
 * Generates test cases for a given programming problem using Google Gemini.
 * @param {string} title - The title of the problem.
 * @param {string} content - The detailed description of the problem.
 * @param {string} sampleCases - A string containing sample test cases.
 * @returns {Promise<Array>} A promise that resolves to an array of test case objects.
 */
async function generateTestCases(title, content, sampleCases) {
  // Line 11: We combine your inputs into a single, structured problem description for the AI.
  const problemDescription = `
    Title: ${title}
    Description: ${content}
    Sample Test Cases: ${sampleCases}
  `;

  // Line 18: This is the prompt engineering part. We give the AI a role and clear instructions.
  const prompt = `
    You are an expert Software Quality Assurance Engineer specializing in creating comprehensive test cases.
    Your task is to generate a JSON array of 10 diverse test case objects for the following coding problem.

   Each object in the array must have exactly two keys: "input" and "expected_output".
- "input": A string representation of the input values for the function.
   - The numbers in arrays must be written as space-separated values without commas or square brackets.
   - Example: instead of "[2,7,11,15]\\n9", use "2 7 11 15\\n9".
- "expected_output": A string representation of the expected result.
   

    Here is the coding problem:
    ---
    ${problemDescription}
    ---

    Generate the JSON array of test cases now. Do not include any explanation or markdown wrappers.
  `;

  console.log("🤖 Sending request to Gemini to generate test cases...");

  try {
    // Line 39: Send the prompt to the model and wait for the result.
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Line 44: Clean the text response. Gemini might wrap JSON in markdown backticks.
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

    // Line 47: Parse the cleaned text string into a JavaScript array of objects.
    const testCasesArray = JSON.parse(cleanedText);

    console.log("✅ Successfully generated test cases!");
   
    // Line 52: Instead of logging, we RETURN the array so other parts of your app can use it.
    return testCasesArray;

  } catch (error) {
    // Line 56: If any part of the 'try' block fails, this code will run.
    console.error("❌ Error generating test cases:", error);
    // Return an empty array in case of an error to prevent the app from crashing.
    return [];
  }
}

// Line 62: Export the function so you can use it in other files.
module.exports = { generateTestCases };