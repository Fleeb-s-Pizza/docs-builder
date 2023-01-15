import * as core from '@actions/core'
import {wait} from './wait'
import * as fs from 'fs'
import * as exec from '@actions/exec'
import { Category } from './interfaces/Category'
import { generateCategoriesJSON, generatePage } from './utils/generators'

async function run(): Promise<void> {
  try {
    fs.mkdirSync('temp')
    core.debug(`Created temp folder`)

    // Clone the repo
    const repo = core.getInput('repo')
    const branch = core.getInput('branch')

    core.debug(`Cloning ${repo} on branch ${branch}`)
    const clone = await exec.exec('git', [
      'clone',
      '--depth',
      '1',
      '--branch',
      branch,
      repo,
      "temp",
    ])

    core.debug(`Cloned ${repo} on branch ${branch}`)
    fs.unlinkSync('temp/README.md')

    const categories = fs.readdirSync('temp')

    const pages: Category[] = []
    categories.forEach((category) => {
      const files = fs.readdirSync(`
      temp/${category}`)
      core.debug(`Found ${files.length} pages in ${category}`)

      pages.push({
        name: category,
        pages: files.map((file) => {
          // read the file
          let content = fs.readFileSync
          (`temp/${category}/${file}`, 'utf8')

          // get metadata after --- and before ---
          const regex = /---([\s\S]*?)---/g
          const metadata = regex.exec(content)

          if(!metadata) {
            throw new Error(`No metadata found in ${file}`)
          }

          // parse metadata per line
          const metadataLines = metadata[1].split('\n')
          const metadataObject: any = {}
          metadataLines.forEach((line) => {
            const [key, value] = line.split(':')
            metadataObject[key] = value.trim()
          })

          content = content.replace(regex, '')

          return {
            slug: file.replace('.md', ''),
            content,

            title: metadataObject.title,
            author: metadataObject.author,
            lastChangedBy: metadataObject.lastChangedBy,
            lastChangedAt: metadataObject.lastChangedAt,
          }
        }),
      })
    })

    core.debug(`Found ${pages.length} categories`)
    core.debug(`Generating JSON file`)
    const json = generateCategoriesJSON(pages)
    core.debug(`Generated JSON file`)
    fs.writeFileSync('temp/categories.json', JSON.stringify(json))

    // delete all categories folders
    categories.forEach((category) => {
      fs.rmdirSync(`temp/${category}`, { recursive: true })
      fs.mkdirSync(`temp/${category}`)

      // create mdx files by slug
      pages.forEach((pageCategory) => {
        if (pageCategory.name === category) {
          pageCategory.pages.forEach((page) => {
            fs.writeFileSync(
              `temp/${category}/${page.slug}.mdx`,
              generatePage(page)
            )
          })
        }
      })
    })

    core.debug(`Generated MDX files`)

    // Move all files in temp to ./pages/docs
    fs.rmdirSync('pages/docs', { recursive: true })
    fs.mkdirSync('pages/docs')
    fs.readdirSync('temp').forEach((file) => {
      fs.rename
      (`temp/${file}`, `pages/docs/${file}`, (err) => {
        if (err) throw err
      })
    })

    core.debug(`Moved files to pages/docs`)
    fs.rmdirSync('temp', { recursive: true })
    core.setOutput('time', new Date().toTimeString())
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
