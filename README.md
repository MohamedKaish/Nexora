# Nexora — Personal Productivity OS (Android)

Nexora is a premium Personal Productivity Operating System designed to help users execute meaningful work. It merges task management, habit tracking, project organization, scheduled timetables, deep work focus timers, and a personal companion into a unified Android interface built with Kotlin and Jetpack Compose.

## Core Features

- **Dashboard**: Central hub featuring an interactive customizable companion avatar, dynamic greeting, smart encouragement messages, quick action buttons, and productivity stat cards (Active Tasks, Daily Habits, Milestone Goals, Projects).
- **Tasks & Subtasks**: Complete task management with Eisenhower priority matrix (Urgent, High, Medium, Low), timeframes (Daily, Weekly, Monthly), project association, and expandable checklist subtasks.
- **Habit Tracker**: Build daily momentum with 7-day rolling completion heatmaps, streak flame counters, and one-tap daily check-in.
- **Goals & Milestones**: Track daily, weekly, and monthly goals with interactive progress sliders.
- **Projects**: Organize work across custom colored project spaces with automated completion percentage calculations.
- **Focus Mode**: Deep work and Pomodoro timer (25m Pomodoro, 5m Short Break, 15m Long Break, Stopwatch, Deep Work) with an animated circular progress countdown and completed session history logging.
- **Timetable**: Fixed weekly routines and recurring focus block schedules across days of the week.
- **Companion & Agent Customizer**: Personalize your companion with unique hairstyles, hair colors, outfits, glasses, expressions, and choose your agent's personality persona.
- **Settings & Workspace**: Dark/Light theme toggle, profile display name, and local SQLite data management.

## Tech Stack

- **Platform**: Android
- **Language**: Kotlin 2.1.0
- **UI Framework**: Jetpack Compose (Material 3)
- **Architecture**: MVVM with Coroutines & StateFlow
- **Persistence**: Room Database (SQLite) with pre-seeded demo data
- **Build System**: Gradle Kotlin DSL (`build.gradle.kts`)
