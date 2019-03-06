workflow "Manifest" {
  on = "push"
  resolves = "Upload manifest"
}

action "Update manifest" {
  uses = "docker://python:2.7"
  runs = "./wpt manifest"
}

action "Verify manifest" {
  needs = "Update manifest"
  uses = "docker://python:2.7"
  runs = "ls -l MANIFEST.json"
}

action "Filter master" {
  needs = "Verify manifest"
  uses = "actions/bin/filter@master"
  args = "branch master"
}

action "Tag master" {
  needs = "Filter master"
  uses = "docker://python:2.7"
  runs = "python tools/ci/tag_master.py"
  secrets = ["GITHUB_TOKEN"]
}

action "Upload manifest" {
  needs = "Tag master"
  uses = "./tools/ci/actions/upload_manifest"
  secrets = ["GITHUB_TOKEN"]
}
