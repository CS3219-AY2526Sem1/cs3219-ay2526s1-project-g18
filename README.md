[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/QUdQy4ix)
# CS3219 Project (PeerPrep) - AY2526S1
## Group: G18
Members:

Dhareshwar Sanchita Ashwin [@sannie-beep](https://github.com/sannie-beep)

Lai Xue Le, Shaun [@casaarlai](https://github.com/casaarlai)

Prisha V Prakash [@PrishaVP](https://github.com/PrishaVP)

Sun Zhiyuan Felix[@potatodudedude](https://github.com/potatodudedude)

Wu Jinhan[@WuJinhan1](https://github.com/WuJinhan1)

## About PeerPrep
PeerPrep is a technical interview preparation platform that allows you to connect with code buddies and solve common interview practise questions together. Users are able to to pick programming topics they want to practise, select a preferred difficulty level and work with their matched buddy on it. You are encouraged to engage in productive discussion via the in-session chat and draft solutions together in psuedocode, focusing on understanding and conveying the logic together.

Our group has developed and deployed a web app so everyone can access and use this platform!
Link: https://g18-peerprep.vercel.app/

### Services implemented
| Service          | Description | Deployed link | Readme |
|------------------|-------------|---------------|--------|
| User Service     |      A service that handles authentication of users and registering/fetching their details      | https://peerprep-user-service-354103976519.asia-southeast1.run.app|[README](https://github.com/CS3219-AY2526Sem1/cs3219-ay2526s1-project-g18/blob/master/peerprep/backend/user-service/README.md)|
| Question Service |  A service that handles the retreival of questions and required fields (topic+difficulty)     | https://peerprep-question-service-354103976519.asia-southeast1.run.app|[README](https://github.com/CS3219-AY2526Sem1/cs3219-ay2526s1-project-g18/blob/master/peerprep/backend/question-service/README.md)|
| Matching Service |  A service that handles matching users based on topic and difficulty           | https://peerprep-matching-serivce-354103976519.asia-southeast1.run.app              |[README](https://github.com/CS3219-AY2526Sem1/cs3219-ay2526s1-project-g18/tree/master/peerprep/backend/matching-service#readme)        |
| Collaboration Service |  A service that provides the collaborative session - including a collaborative code editor and in-session chat for users to discuss their attempt           | https://peerprep-collab-service-354103976519.asia-southeast1.run.app              |   -     |
| Attempt History Service |  A nice-to-have service that handles saving and loading of records of prior attempts           |    -         |     -   |

### Architecture diagram
Our architecture diagram below shows how all our 5 microservices interact
<img width="1133" height="599" alt="image" src="https://github.com/user-attachments/assets/702df582-639c-479d-8626-42d734cabc11" />

### Deployment diagram
<img width="1919" height="757" alt="image" src="https://github.com/user-attachments/assets/46d37ee2-2740-4da2-8005-d87e051bad93" />


## Setting up for development
Here is how to set up our repository and get the services running for development
1. Clone our repository
2. Run the frontend using npm run dev

## AI Use Declaration
AI Use Summary
Tools: ChatGPT (GPT-5 Thinking), GitHub Copilot (GPT-5 Mini), Claude Sonnet 4.5
Prohibited phases avoided: requirements elicitation; architecture/design decisions.
Allowed uses:
- Generated initial implementation and debugging fixes for popup chat and collaborative editor components in React.
- Implemented AI assistant message handling functions, timer boilerplate, and parts of the AI assistant UI.
- Suggested setup steps and boilerplate for PostgreSQL + Prisma + Express backend.
- Generated Lua scripts for atomic queue/room operations and SSE connection helpers.
- Drafted a class based on specified data structure for collab service data persistence (snapshot, awareness, updatedAt).
- Provided examples for SSE listener code listener set up and teardown for the matching service.
- Suggested refactorings for parsing functions and provided test edge-case ideas.

Verification: All AI outputs reviewed, edited, and tested by the authors.
Our AI use declaration can be found in `./ai/ai_log.md`
