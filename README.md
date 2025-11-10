# Solvative-Test

A small client-side quiz application that demonstrates category selection, dynamic question loading from JSON, timed questions, per-question validation, and performance-based result pages.

## Getting started

Prerequisites:

- A modern browser (Chrome, Edge, Firefox).
- Optional: Python installed for a quick local HTTP server (recommended to avoid file:// restrictions).

Quick run (no server):

- Open `index.html` in your browser. This works for basic testing but some browsers restrict fetch() over `file://` which can block loading `assets/data.json`.

Recommended (run a simple local server):

Or use VS Code Live Server extension to serve the folder.

## Problem statement

Build a quiz application with the following capabilities:

- Let the user enter their name and choose a quiz category.
- Load the questions dynamically from a `data.json` file (per category).
- Present questions one at a time with a 10-second timer per question.
- Allow users to select an answer, skip questions, or navigate to the next question.
- Track score, unanswered and incorrect counts.
- After completion, show a results page (success / average / poor) based on score.

## What I implemented (completed tasks)

- Category selection on `index.html` and name input.
- Dynamic question loading from `assets/data.json` based on selected category.
- State management using a small `quizState` object and `sessionStorage` to pass questions between pages.
- Quiz UI (`quiz-page.html`) with:
  - Question text, multiple-choice options (shuffled), progress bar, question counter and a 10-second timer.
  - Next and Skip controls. Skip marks a question as unanswered and advances.
  - Custom radio styling to match the category selection design.
  - Exit Quiz link in the header that returns to the home page.
- Scoring and results handling:
  - Score is calculated and stored in `sessionStorage`.
  - Redirect to `success.html`, `average.html`, or `poor.html` depending on percent score.
  - Result pages read results from `sessionStorage` and display score and counts.
- Client-side validations and UX improvements:
  - Inline validation for the full-name and category inputs on the home page (shows messages below fields).
  - Inline validation on the quiz page: clicking Next without selecting an option shows an inline error; selecting an option or clicking Skip clears it.
  - Prevented JS errors by initializing DOM references per-page and scoping selectors so listeners attach to the correct buttons.

## Files of interest

- `index.html` — Home page (name + category selection).
- `quiz-page.html` — Quiz UI and question flow.
- `success.html`, `average.html`, `poor.html` — Result pages.
- `app.js` — Main application logic (category load, quiz flow, timer, validation).
- `style.css` — Styling and custom radio appearance.
- `assets/data.json` — Question bank (grouped by categories).

## Known notes & next steps

- The app is fully client-side and stores transient data in `sessionStorage`. A server or backend is not required for the scope of this test.
- If you encounter issues where questions don't load, run a local HTTP server (see Getting started) since fetch() can be blocked over `file://`.
- Possible enhancements:
  - Add a confirmation modal when clicking Exit Quiz to avoid accidental loss of progress.
  - Persist partial progress to localStorage to allow resuming a quiz.
