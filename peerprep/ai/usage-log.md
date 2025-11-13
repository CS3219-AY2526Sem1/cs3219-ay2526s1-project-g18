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
Understanding CRDT and yjs works and how the collab editor coule be implemented and coming up with the initial implementation of collab editor. (in CollabEditor.tsx)
### Output Summary:
Provided example code snippets and suggestions for socket event handling, editor sync logic, and collaborative cursor display.
### Action Taken:
- [ ] Accepted as-is
- [X] Modified
- [ ] Rejected
### Author Notes:
I rewrote and adapted the AI-suggested code to fit our specific setup as I would like it to work with the rest of our code. 
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
Copilot was asked to generate functions for setting up and disconnecting a SSE connection.
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