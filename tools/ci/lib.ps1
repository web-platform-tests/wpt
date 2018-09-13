function hosts_fixup {
    $path="$env:SystemRoot\System32\drivers\etc\hosts"
    Get-Content $path
    python wpt make-hosts-file | Out-File $path -Encoding ascii -Append
    Get-Content $path
}

function run_applicable_tox {
    # instead of just running TOXENV (e.g., py27)
    # run all environments that start with TOXENV
    # (e.g., py27-firefox as well as py27)
    $OLD_TOXENV=$env:TOXENV
    Remove-Item env:TOXENV
    $RUN_ENVS = $(tox -l).split(
        [string[]]$null,
        [System.StringSplitOptions]::RemoveEmptyEntries
    ).Where({$_.StartsWith("$OLD_TOXENV-") -or $_.Equals($OLD_TOXENV)}) -join ","
    if ($RUN_ENVS) {
        tox -e "$RUN_ENVS"
    }
    if ($LastExitCode -ne 0) {
        throw
    }
    $env:TOXENV = $OLD_TOXENV
}
