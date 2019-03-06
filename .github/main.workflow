workflow "Manifest" {
  on = "push"
  resolves = ["Verify manifest", "Upload manifest"]
}

action "Update manifest" {
  uses = "docker://python:2.7-slim"
  runs = "./wpt manifest"
}

action "Verify manifest" {
  needs = "Update manifest"
  uses = "docker://python:2.7-slim"
  runs = "ls -l MANIFEST.json"
}

action "Filter master" {
  uses = "actions/bin/filter@master"
  args = "branch master"
}

action "Tag master" {
  needs = ["Update manifest", "Filter master"]
  uses = "docker://python:2.7-slim"
  runs = "python tools/ci/tag_master.py"
  secrets = ["GITHUB_TOKEN"]
}

action "Upload manifest" {
  needs = "Tag master"
  uses = "./tools/ci/actions/upload_manifest"
  secrets = ["GITHUB_TOKEN"]
}
