/**
 * Contact-hour rubric (plan v3). Minutes per unit. Used by the schedule and lesson plan.
 */
export const RUBRIC = {
  readingMinPerPage: 4,
  slidesMinPerSlide: 2,
  discussionMin: 15,
  quizMinPerQuestion: 1,
  assignmentMinPerQuestion: 10,
  /** How unfilled time is spread: reading/slides/discussion/assignments, in percent. */
  gapSpread: { reading: 45, slides: 20, discussion: 20, assignments: 15 },
} as const

/** Ideal Institute defaults for the schedule calculator. */
export const SCHEDULE_DEFAULTS = {
  weeks: 10,
  totalHours: 200,
  daysPerWeek: 4,
  sessionsPerDay: 2,
} as const
