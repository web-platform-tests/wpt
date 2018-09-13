Set-PSDebug -Trace 1

git fetch -q --depth=50 origin master

$env:PATH = "$env:PYTHON;$env:PATH"

$RELEVANT_JOBS = $(python ./wpt test-jobs).split(
    [string[]]$null,
    [System.StringSplitOptions]::RemoveEmptyEntries
)

if ($env:RUN_JOB -or $RELEVANT_JOBS.contains($env:JOB)) {
    $env:RUN_JOB = $true
} else {
    $env:RUN_JOB = $false
}

if ($env:RUN_JOB) {
    pip install -U setuptools
    pip install -U requests
}
