'use strict'

const filterStep = (step, pred) => {
  const keepStep = pred(step)

  if (!step.steps) {
    return keepStep ? step : null
  }

  const subSteps = filterSteps(step.steps, pred)
  const hasSubSteps = subSteps.length > 0

  if (!keepStep && !hasSubSteps) {
    return null
  }

  const result = Object.assign({}, step)
  if (hasSubSteps) {
    result.steps = subSteps
  } else {
    delete result.steps
  }

  return result
}

function filterSteps (steps, pred) {
  return steps
    .map(step => filterStep(step, pred))
    .filter(step => (step !== null))
}

const filterReport = (report, pred) => {
  const { section, desc, steps } = report
  return {
    section,
    desc,
    steps: filterSteps(steps, pred)
  }
}

const filterReports = (reports, pred) => {
  return reports
    .map(report => filterReport(report, pred))
    .filter(report => (report.steps.length > 0))
}

module.exports = {
  filterReports
}
