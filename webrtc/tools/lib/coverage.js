'use strict'

const makeStatusTable = () => {
  // Create with essential keys to make them sorted first
  return new Map([['todo', 0], ['tested', 0]])
}

const addStatus = (statusTable, status) => {
  if (statusTable.has(status)) {
    statusTable.set(status, statusTable.get(status) + 1)
  } else {
    statusTable.set(status, 1)
  }
}

const calculateCoverage = (statusTable, steps) => {
  for (const step of steps) {
    const { status = 'unknown' } = step
    addStatus(statusTable, status)

    if (step.steps) {
      calculateCoverage(statusTable, step.steps)
    }
  }
}

const getOverallCoverage = entries => {
  const statusTable = makeStatusTable()

  for (const entry of entries) {
    calculateCoverage(statusTable, entry.steps)
  }
  return statusTable
}

const getCoverageBySection = entries => {
  const sectionTable = new Map()

  for (const entry of entries) {
    const section = entry.section.toString()
    const majorSection = parseInt(section.split('.')[0])

    if (!sectionTable.has(majorSection)) {
      sectionTable.set(majorSection, makeStatusTable())
    }

    calculateCoverage(sectionTable.get(majorSection), entry.steps)
  }
  return sectionTable
}

module.exports = {
  getOverallCoverage,
  getCoverageBySection
}
