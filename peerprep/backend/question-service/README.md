# Question Service

A microservice for managing questions in the PeerPrep application.

## Overview

The Question Service handles CRUD operations for programming questions, including question metadata, difficulty levels, categories, and content management.

## Features

- Create, read, update, and delete questions
- Filter questions by difficulty and category
- Question validation and formatting
- RESTful API endpoints

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm
- Database (PostgreSQL)

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

- `GET /api/questions` - Get all questions
- `GET /api/question/:id` - Get question by ID
- `POST /api/questions` - Create new question
- `PUT /api/question/:id` - Update question
- `DELETE /api/question/:id` - Delete question