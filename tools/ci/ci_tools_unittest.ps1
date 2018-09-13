Set-PSDebug -Trace 1

. "$PSScriptRoot\lib.ps1"

$WPT_ROOT = "$PSScriptRoot\..\.."
cd $WPT_ROOT

cd $env:TOX_DIR
pip install -U tox
run_applicable_tox

