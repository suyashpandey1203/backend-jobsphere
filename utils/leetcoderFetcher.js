
const fetch = require('node-fetch');

// GraphQL query


const query = `
query getQuestionDetail($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    questionId
    title
    content
    difficulty
    exampleTestcases
  }
}
`;

// Function to extract titleSlug from user input URL
function getTitleSlug(url) { // url : https://leetcode.com/problems/two-sum/
  try {
    const parts = new URL(url).pathname.split('/');
    // Example: "/problems/two-sum/" -> ["", "problems", "two-sum", ""]
    return parts[2]; 
  } catch (err) {
    throw new Error("Invalid URL");
  }
}

// Main function
async function getProblemFromLink(userLink) {
  console.log("Fetching problem for link:", userLink);
  const titleSlug = getTitleSlug(userLink);
  const variables = { titleSlug };

  const res = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Referer": userLink,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36",
      "Accept": "*/*",
      "Origin": "https://leetcode.com",
    },
    body: JSON.stringify({ query, variables }),
  });

  const text = await res.text();
  try {
    
    const data = JSON.parse(text);
   
    return data;
  } catch (err) {
    console.error("Not JSON:", text.slice(0, 300));
    return err;
  }
}

module.exports = { getProblemFromLink };