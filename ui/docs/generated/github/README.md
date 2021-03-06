# Github Service

This service monitors all of the repositories associated with an organization for changes and schedules Taskcluster tasks for any repository which contains a `.taskcluster.yml` configuration file. The goal of this project is to provide project owners a method for scheduling jobs in Taskcluster which is quick and straight forward.

**NOTE: This project used to provide a base docker image for convenience's sake, but it has been deprecated due to not being that useful and not being kept up-to-date. The image will continue existing, but we recommend migrating to another image.**

### Adding status badges to your project's README:
Insert the following string (replacing the words in caps with your organization or user name, repository name and the branch name) to the readme file in your project's repository:
`[![Task Status](https://github.taskcluster.net/v1/repository/USERNAME/REPONAME/BRANCHNAME/badge.svg)](https://github.taskcluster.net/v1/repository/USERNAME/REPONAME/BRANCHNAME/latest)`


## Components

### API Server
Listens for WebHooks and, if they are valid, forwards them to a pulse exchange.

### Handlers
Listen for WebHook triggered pulse messages and attempts to schedule Taskcluster tasks for any events related to a repository which contains a `.taskcluster.yml` file.

## Contributing

### Run Tests
To run the tests, use `yarn test`.  No credentials are necessary. Some tests will be skipped, but it is fine to submit a pull request as long as nothing fails.

To run all tests, you will need appropriate Taskcluster credentials. Using taskcluster-cli, run `eval $(taskcluster signin --scopes assume:project:taskcluster:tests:taskcluster-github)`, then run `yarn test` again.

To test the components separately, run:
- server: `<set the environment variables> node src/main.js server`
- handlers: `<set the environment variables> node src/main.js worker`

## Copyright notes
Emoji fonts for this project were taken from:
- [Mozilla Firefox OS Emojis](https://github.com/mozilla/fxemoji)
- [Google Internationalization (i18n)](https://github.com/googlei18n/noto-emoji) (provided under the [SIL Open Font License, version 1.1](https://github.com/googlei18n/noto-emoji/blob/master/fonts/LICENSE))
- [EmojiOne](http://emojione.com/) (provided under the [Creative Commons License](http://emojione.com/licensing/))

## Service Owner

Service Owner: bstack@mozilla.com
