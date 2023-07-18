Step 1: Set up a web server with an API endpoint that receives the user's natural language message as input.

Step 2: Use GPT-4 or a similar language model to process the user's message and extract the intent, relative time, and absolute date. Since GPT-3.5 is the last version available in my knowledge, I can provide a solution using GPT-3.5. You may need to adapt it for GPT-4.

Step 3: Implement logic to handle different phrases and keywords in Turkish, such as "bugün" (today), "yarın" (tomorrow), "bu Cuma" (this Friday), "30 Temmuz" (30th of July), and extract the corresponding date and time information from the message.

Step 4: Construct the JSON response with the extracted intent and datetime information.

Step 5: Implement additional logic to classify intents other than new appointments as "other."

Step 6: Write a suite of tests to verify the correctness of the API endpoint. The tests should include different example inputs with expected intents and datetime values. The tests should also verify that intents other than new appointments are correctly classified as "other."