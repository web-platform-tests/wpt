'use strict'

const fs = require('fs')
const path = require('path')
const util = require('util')
const yaml = require('js-yaml')

const { sortFilePaths } = require('./sort')

const readFile = util.promisify(fs.readFile)
const readDir = util.promisify(fs.readdir)

const loadFile = async filePath => {
  const rawText = await readFile(filePath, 'utf8')
  try {
    const entry = yaml.safeLoad(rawText)
    entry.file = filePath
    return entry
  } catch (err) {
    throw new Error(`Error parsing YAML file at ${filePath}: ${err.message}`)
  }
}

const mapAsync = async (list, mapper) => {
  const res = []
  for (const item of list) {
    const mapped = await mapper(item)
    res.push(mapped)
  }
  return res
}

const loadDir = async dirPath => {
  const files = await readDir(dirPath)
  const yamlFiles = sortFilePaths(
    files.filter(filePath =>
      (path.extname(filePath) === '.yaml')))

  const reports = await mapAsync(yamlFiles,
    filePath => loadFile(path.join(dirPath, filePath)))

  return reports
}

module.exports = {
  loadFile,
  loadDir
}
