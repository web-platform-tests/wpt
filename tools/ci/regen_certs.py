import argparse
import logging
import subprocess


logging.basicConfig()
logger = logging.getLogger()


def get_parser():
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkend-seconds", type=int, default=5184000,
                        help="The number of seconds the certificates must be valid for")
    parser.add_argument("--force", action="store_true",
                        help="Regenerate certificates even if not reaching expiry")
    return parser


def check_cert(certificate, checkend_seconds):
    """Checks whether an x509 certificate will expire within a set period.

    Returns 0 if the certificate will not expire, non-zero otherwise."""
    cmd = [
        "openssl", "x509",
        "-checkend", str(checkend_seconds),
        "-noout",
        "-in", certificate
    ]
    logger.info("Running '%s'" % " ".join(cmd))
    return subprocess.call(cmd)


def regen_certs():
    """Re-generate the wpt openssl certificates, by delegating to wptserve."""
    cmd = [
        "python", "wpt", "serve",
        "--config", "tools/certs/config.json",
        "--exit-after-start",
    ]
    logger.info("Running '%s'" % " ".join(cmd))
    subprocess.check_call(cmd)


def run(**kwargs):
    if kwargs["force"]:
        logger.info("Force regenerating WPT certificates")
    checkend_seconds = kwargs["checkend_seconds"]
    if (kwargs["force"] or
        check_cert("tools/certs/cacert.pem", checkend_seconds) or
        check_cert("tools/certs/web-platform.test.pem", checkend_seconds)):
        regen_certs()
    else:
        logger.info("Certificates are still valid for at least %s seconds, skipping regeneration" % checkend_seconds)
