'use strict'

const sumList = numbers =>
  numbers.reduce((a, b) => (a + b), 0)

const formatCount = (status, count) => {
  const statusStr = status.padEnd(12)
  const countStr = `${count}`.padStart(7)
  return `${statusStr}|${countStr}`
}

const formatPercentage = number => {
  return `${(number * 10000 | 0) / 100}%`
}

const formatCoverage = report => {
  const divider = '='.repeat(20)

  const total = sumList([...report.values()])

  const statusLines = [...report.entries()]
    .map(([status, count]) => formatCount(status, count))

  const totalLine = formatCount('total', total)

  const coverage = (total - report.get('todo')) / total

  const coverageLine = formatCount('coverage',
    formatPercentage(coverage))

  return (
`${divider}
${statusLines.join('\n')}
${divider}
${totalLine}
${coverageLine}
${divider}`)
}

const formatSectionCoverage = sections => {
  const sectionEntries = [...sections.entries()]

  const sectionTexts = sectionEntries
  .map(([sectionNum, coverage]) => {
    const coverageText = formatCoverage(coverage)
    return (
`Section: ${sectionNum}
${coverageText}`)
  })

  return sectionTexts.join('\n\n')
}

module.exports = {
  formatCoverage,
  formatSectionCoverage
}
