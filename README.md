# release-actions

GitHub Actions for automating releases

## Usage

Use the repository + path to the action subdirectory in the workflow.

As an example - in a workflow's `jobs.<job_id>.steps` section:
```yaml
- name: Create & checkout PR branch
  uses: cylc/release-actions/stage-1/checkout-pr-branch@v1
```

Some actions require inputs or env variables, e.g.
```yaml
- name: Comment on the release PR with the results & next steps
  uses: cylc/release-actions/stage-2/comment-on-pr@v1
  with:
    release-url: ${{ steps.create-release.outputs.html_url }}
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

See the `action.yml` file for what is required for a particular action.

## Contributing

Open pull requests against the branch for the version you are adding a feature/bugfix/etc to.

At time of writing, there is only `v1` (the default branch). The `v1` branch should always point at the latest release that maintains backwards compatibility (when I say "release", I mean commit, really, as we're not using tags to mark releases).

When a breaking change is introduced, we should create a `v2` branch and make it the default branch (might also be a good idea to add a `v2.0.0` tag just to mark the start point).

Note: Certain modules (e.g. `cylc-action-utils.js`) may be kept in `node_modules/` so that they don't have to be referenced by path when using `require()`, and should be unignored in `.gitignore`. For some reason, `yarn install` causes these modules to be deleted, so stick to `npm install`.

Info on "composite run step" actions:
- https://docs.github.com/en/actions/creating-actions/creating-a-composite-run-steps-action
- https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions#runs-for-composite-run-steps-actions
