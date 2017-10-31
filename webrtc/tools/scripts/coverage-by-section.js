'use strict'

const path = require('path')
const { loadDir } = require('../lib/load')
const { getCoverageBySection } = require('../lib/coverage')
const { formatSectionCoverage } = require('../lib/format')

async function main () {
  const dirPath = path.resolve(__dirname, '../../coverage')
  const report = await loadDir(dirPath)
  const sectionCoverage = getCoverageBySection(report)

  console.log(formatSectionCoverage(sectionCoverage))
}

main()
