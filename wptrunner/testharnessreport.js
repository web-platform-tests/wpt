var props = {output:false,
             explicit_timeout: true};
if (window.opener && "timeout_multiplier" in window.opener) {
    props["timeout_multiplier"] = window.opener.timeout_multiplier;
}
setup(props);
