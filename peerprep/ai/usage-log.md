# AI Usage log
This is a detailed, timestamped summary of our AI usage correspeonding to the files we have added our header declarations to. We have organised it by service.
# Frontend:
------------
### Date/Time:
2025-11-03
### Tool:
ChatGPT
### Prompt/Command:
Coming up with the initial implemetation for a popup chat in React and fixing bugs associated with it. (in ChatPopup.tsx)
### Output Summary:
ChatGPT provided the basic implementation of a popup chat in React and fixes for the bugs I have asked it to fix.
### Action Taken:
- [ ] Accepted as-is
- [X] Modified
- [ ] Rejected
### Author Notes:
Changed and adapted the structure to fit our specific setup and the design to fit our design in figma.

---------------
### Date/Time:
2025-11-03
### Tool:
ChatGPT
### Prompt/Command:
Provide me an introduction to how CRDT and yjs works and come up with the initial implementation of collab editor based on the architecture decisions made by my teammates. I provided the detailed requirements and architecture outlined by my teammates. 
### Output Summary:
Provided example code snippets and suggestions for socket event handling, editor sync logic, and collaborative cursor display.
### Action Taken:
- [ ] Accepted as-is
- [X] Modified
- [ ] Rejected
### Author Notes:
My teammates had fully planned the architecture for collab service and I was tasked to implement it but I wanted to learn more about CRDT and YJS first as I was not too familiar with how to implement it.
I rewrote and adapted the AI-suggested code to fit our specific architecture decisions as I would like it to work with the rest of our code. 
I verified for correctness to make sure everything worked as expected

----------------
### Date/Time:
2025-10-30
### Tool:
ChatGPT (model: GPT-5 Thinking), date: 
### Prompt/Command:
Prompt summary: Using the following notifications (match, timeout, error, close, join queue with/without difficulty), create an SSE connection to the matching service to listen for these events. Ensure that the user joins the queue only after the SSE connection. Make sure the close the listeners appropriately. Store the matching state in React state and display different UI based on the state. Also, suggest which exit points to use to close the SSE connection properly
### Output Summary:
Provided example code snippets for adding the listeners, add states to render different notification UI (all hand-implemented) and close them appropriately.
### Action Taken:
- [ ] Accepted as-is
- [X] Modified
- [ ] Rejected
### Author Notes:
I only added the AI-generated code to parts of the matching notifications page which required subscribing to the SSE notifications. The SSE notifications architecture implemented in Matching Service backend and subscribed to in this page were all conscious decisions made by us. We chose this architecture because it fits our requirements for realtime notifications. I ensured that all AI-generated code in this page were tested and reviewed to match our needs.

---------------

### Date/Time:
2025-09-15
### Tool:
Claude Sonnet 4.5
### Prompt/Command:
Prompt summary: Generate a dropdown menu component in React with TypeScript that allows users to select from a list of topics. The component should manage its open/closed state, handle outside clicks to close the menu, and notify parent components of topic selection and open state changes. It should also be accessible, supporting keyboard navigation and screen readers.
### Output Summary:
Provided a dropdownMenu.tsx component
### Action Taken:
- [X] Accepted as-is
- [X] Modified
- [ ] Rejected
### Author Notes:
I mainly accepted this as-is (since it's only a UI component). The code has been reviewed and adjusted for correctness, style, and functionality as needed. 

---------------

# Date/Time:
2025-11-12
# Tool:
ChatGPT 5
# Prompt/Command:
ChatGPT was asked to implement the sendInitFeedback and sendFollowUp function bodies on the client-side code for AI feedback feature given the function headers, parameters, specifications on what the function should do (like the format of messages to save on client side). I also gave it the client and server code I wrote in order for it to have more context.
# Output Summary:
Chatgpt provided an example of an entire client code. 
# Action Taken:
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
# Author Notes:
As I only intended for it to implement those 2 function bodies, I just referenced those 2 functioned bodies and ignored the rest. Also fixed bugs as it wasn't storing some messages as I specified. Also modified the sendInitFeedback given a bit to ensure the JSON is formatted properly before parsing. Also made modifications to account for various edge cases. Verified correctness by testing the ai feedback and chat on the client.

---------------

### Date/Time:
2025-11-13
### Tool:
ChatGPT 5
### Prompt/Command:
I asked it implement some of the UI for the AI feedback feature based on very strict and detailed specifications for the UI. Also provided it my existing UI as I wanted it to add the specified UI features into my existing structure.
### Output Summary:
ChatGPT gave me the UI implementation + some helper functions needed for this UI
### Action Taken:
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
### Author Notes:
I did some modifications to fix bugs and fix deviations from what I told it to implement. Verified correctness by testing the frontend and it had some bugs so i fixed it myself.

---------------

### Date/Time:
2025-11-13
### Tool:
ChatGPT 5
### Prompt/Command:
Asked it to explain why the ai feedback assistant refused to listen to my instructions not to use Markdown formatting in its response
### Output Summary:
Advised me not to use { } when I tell it the expected JSON response format 
### Action Taken:
- [x ] Accepted as-is
- [ ] Modified
- [ ] Rejected
### Author Notes:
Removed the { } from my guide for the expected JSON response format which seemed to mostly resolve the issue when I tested repeatedly by asking the assistant questions which might cause it to want to use Markdown such as asking for code help.

---------------

### Date/Time:
2025-11-13
### Tool:
GitHub Copilot (GPT-5 Mini)
### Prompt/Command:
 //when enter is pressed in textarea, call the sendFollowUp function
### Output Summary:
Copilot implemented a standard handleKeyDown function that calls the sendFollowUp function when enter key is pressed 
### Action Taken:
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
### Author Notes:
Verified by testing the user input prompt sends when i press enter. Added an if statement to return without calling sendFollowUp under certain conditions.

---------------

# Matching service:
---------------
### Date/Time:
2025-10-14
### Tool:
GitHub Copilot (GPT-5 Mini)
### Prompt/Command:
Copilot was asked to review multiple files (queue-controller, matchmaker) to help debug the queue algorithms.
### Output Summary:
Copilot identified potential bugs in parsing and provided suggested solutions
### Action Taken:
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
### Author Notes:
I modified and used some lines of the suggested solution in some helper parsing functions, and verified correctness with further testing.

---------------------------------------------------------------------------
### Date/Time:
2025-10-26
### Tool:
GitHub Copilot (GPT-5 Mini)
### Prompt/Command:
Copilot was asked to generate a LUA script for atomizing the joinQueue api function.
### Output Summary:
Copilot provided a LUA script file and suggested modifications to the api function.
### Action Taken:
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
### Author Notes:
I modified the LUA script for correctness in variable naming, and verified correctness with further testing.

-------------------------------
### Date/Time:
2025-10-26
### Tool:
GitHub Copilot (GPT-5 Mini)
### Prompt/Command:
Copilot was asked to generate functions for setting up and disconnecting a SSE connection based on our architecture specifications for matching service notifications.
### Output Summary:
Copilot provided an api function for joining, functions for notification, safe-writing and closing the SSE connection, as well as a sseClients hashmap.
### Action Taken:
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
### Author Notes:
I modified parameters, keys and variables to suit my other functions, edited and expanded on the given notification function to create multiple functions for sending different notification types, and corrected styling.

-----------------

### Date/Time:
2025-10-26
### Tool:
GitHub Copilot (GPT-5 Mini)
### Prompt/Command:
Copilot was asked to generate a html file for testing SSE connections.
### Output Summary:
Copilot provided a html file that allows manual SSE connection and logging.
### Action Taken:
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
### Author Notes:
I did some minor modifications to the api call route, other than that the html file was largely left as is.

---------------------------------------------------------------------------

### Date/Time:
2025-11-12
### Tool:
Github Copilot (Claude Sonnet 4)
### Prompt/Command:
Copilot was asked to generate a Dockerfile for a Node.js Express application to deploy the matching service.
### Output Summary:
Copilot generated a Dockerfile for the matching service.
### Action Taken:
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
### Author Notes:
I modified and used most of the suggested code and did testing by running it locally and when deploying. Further adjustments were made for correctness.

---------------------------------------------------------------------------

# Collab Service
-----------------

### Date/Time:
2025-11-02
### Tool:
ChatGPT (model: GPT-5 Thinking)
### Prompt/Command:
Data storage format I specified to chatGPT:
The data must be stored to Redis in the form of a HashSet with the 
key `room:${roomId}:data` (roomId will be passed into this PersistenceManager class).
values:
snapshot: current snapshot of yjs doc
awareness: current snapshot of awareness
updatedAt: dateTime string of when this was updated to the database
### Output Summary:
ChatGPT generated a PersistenceManager class that stores data in the specified format.
### Action Taken:
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
### Author Notes:
Used AI to generate initial implementation of PersistenceManager class, added later modifications myself

-------------------

# Date/Time:
2025-10-30
# Tool:
ChatGPT 5
# Prompt/Command:
Asked ChatGPT to rewrite my joinRoom to use a LUA script instead so that the operations are atomic. I provided it my existing joinRoom function as I wanted it to follow all my decisions but just atomize it.
# Output Summary:
ChatGPT provided the rewritten function with the LUA script 
# Action Taken:
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
# Author Notes:
At first I accepted it fully but later on, I wanted to change what I was storing to the redis therefore I updated the function and the LUA script to account for these changes. Verified correctness by reading through + testing that the users data was being stored properly using redis insight since before the atomization this had issues.

-------------------

# Date/Time:
2025-11-1
# Tool:
ChatGPT 5
# Prompt/Command:
I told ChatGPT to implement a timeout to delete the userMap from redis after 2 minutes 
# Output Summary:
Chatgpt provided code for a setTimout function as specified
# Action Taken:
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
# Author Notes:
This timer set up was just intended as boilerplate as I don’t like implementing setTimeout calls.  This was eventually heavily modified by me and others who worked on collab service in order to add the logic for different cases of disconnects to allow for differing timings and to do further necessary interactions with the redis. Verified correctness by checking that the userMap got deleted from redis after 2 min.

-------------------

# Date/Time:
2025-11-1
# Tool:
ChatGPT 5
# Prompt/Command:
I told ChatGPT to implement a clear timeout for the disconnect timer of a userId when he rejoins
# Output Summary:
Implemented code to clear the stored disconnect timer and delete it. It also put this into a basic joinRoom socket listener.
# Action Taken:
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
# Author Notes:
Ignored its socket listener as I do not accept architecture advice and already had a fixed plan as to where to put the clear and delete timer (in my on “connection” listener). I only took its clear and delete timer implementation and put it into part of my code where I wanted to clear and delete the timer. I just really dislike implementing timers. Verified correctness by testing that the user doesn’t get deleted if they rejoin in 2 min.

-------------------


### Date/Time:
2025-11-12
### Tool:
Github Copilot (Claude Sonnet 4)
### Prompt/Command:
Copilot was asked to generate a Dockerfile for a Node.js Express application to deploy the collaboration service.
### Output Summary:
Copilot generated a Dockerfile for the collaboration service.
### Action Taken:
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
### Author Notes:
I modified and used most of the suggested code and did testing by running it locally and when deploying. Further adjustments were made for correctness.

---------------------------------------------------------------------------

# User Service
-----------------
### Date/Time:
2025-11-12
### Tool:
Github Copilot (Claude Sonnet 4)
### Prompt/Command:
Copilot was asked to generate a Dockerfile for a Node.js Express application to deploy the user service.
### Output Summary:
Copilot generated a Dockerfile for the user service.
### Action Taken:
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
### Author Notes:
I modified and used most of the suggested code and did testing by running it locally and when deploying. Further adjustments were made for correctness.

---------------------------------------------------------------------------

# Attempt History Service
-----------------
### Date/Time:
2025-11-12
### Tool:
ChatGPT (model: GPT-5 Thinking)
### Prompt/Command:
Asked ChatGPT for guidance on how to set up postgresql database, prisma ORM and express app. 
### Output Summary:
ChatGPT provided a step-by-step guide with copy-paste terminal commands to execute to set up the boilerplate template for Attempt History Service.
### Action Taken:
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
### Author Notes:
Some commands were wrong/outdated so I used online resources to help me debug when chatgpt went wrong.

# AI Problem Solving
-----------------
### Date/Time:
2025-11-13
### Tool:
Gemini (model: 2.5 Flash)
### Prompt/Command:
Asked Gemini to generate a function to help with entering a newline only on shift + enter in textarea object
### Output Summary:
Gemini generated a handleKeyDown function.
### Action Taken:
- [x] Accepted as-is
- [ ] Modified
- [ ] Rejected
### Author Notes:
I validated for correctness and used it as is.