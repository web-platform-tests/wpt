workflow "Tag master + upload manifest" {
  on = "push"
  resolves = "Upload manifest"
}

action "Filter master" {
  uses = "actions/bin/filter@master"
  args = "branch master"
}

action "Tag master" {
  needs = "Filter master"
  uses = "docker://python:2.7-slim"
  runs = "python tools/ci/tag_master.py"
  secrets = ["GITHUB_TOKEN"]
}

action "Upload manifest" {
  needs = "Tag master"
  uses = "./tools/ci/actions/upload_manifest"
  secrets = ["GITHUB_TOKEN"]
}
