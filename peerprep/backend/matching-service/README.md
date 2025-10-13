# Matching Service

A microservice for matchmaking in the PeerPrep application.

## Overview

The matching service handles user matching requests, matching users based on criteria and sending necessary information to the collaboration service.

## Features

- Add users to criteria queue
- Matching users with the same criteria
- Retrieving questions from the question service
- RESTful API endpoints

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm
- Database (Redis)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file by referencing the `.env.example` file and set the necessary environment variables.

### Running the Service

```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

- `POST /requests` - Add user to queue based on criteria
- `DELETE /requests` - Remove user from queue based on criteria
- `DELETE /matches` - Match users in the given queue