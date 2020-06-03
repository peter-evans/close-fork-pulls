import * as core from '@actions/core'
import * as github from '@actions/github'
import {inspect} from 'util'

async function run(): Promise<void> {
  try {
    const inputs = {
      token: core.getInput('token'),
      repository: core.getInput('repository'),
      comment: core.getInput('comment')
    }
    core.debug(`Inputs: ${inspect(inputs)}`)

    const [owner, repo] = inputs.repository.split('/')
    core.debug(`Repo: ${inspect(repo)}`)

    const octokit = new github.GitHub(inputs.token)

    const {data: pulls} = await octokit.pulls.list({
      owner: owner,
      repo: repo,
      state: 'open'
    })
    core.debug(`Pulls: ${inspect(pulls)}`)

    let closedCount = 0
    for (const pull of pulls) {
      if (pull.head.user.login != owner) {
        if (inputs.comment && inputs.comment.length > 0) {
          core.info('Adding a comment before closing the pull request')
          await octokit.issues.createComment({
            owner: owner,
            repo: repo,
            issue_number: pull.number,
            body: inputs.comment
          })
        }

        await octokit.pulls.update({
          owner: owner,
          repo: repo,
          pull_number: pull.number,
          state: 'closed'
        })
        closedCount++
      }
    }
    if (closedCount > 0) {
      core.info(`Pull requests closed: ${closedCount}`)
    } else {
      core.info(`No pull requests from forks found.`)
    }
  } catch (error) {
    core.debug(inspect(error))
    core.setFailed(error.message)
  }
}

run()
