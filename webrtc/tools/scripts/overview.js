'use strict'

const path = require('path')
const { loadDir } = require('../lib/load')
const { getOverallCoverage } = require('../lib/coverage')
const { formatCoverage } = require('../lib/format')

async function main () {
  const dirPath = path.resolve(__dirname, '../../coverage')
  const report = await loadDir(dirPath)
  const coverage = getOverallCoverage(report)
  console.log('Overall Coverage')
  console.log(formatCoverage(coverage))
}

main()
