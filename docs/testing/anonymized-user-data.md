# Anonymized User Data — Guidelines

This document explains how anonymized user data should be handled in tests and benchmark files within this repository.

## What is anonymized data?
Anonymized data is user-related information that has been modified so that it cannot reasonably identify a real individual. Examples:
- Removing direct identifiers  
- Replacing identifiers with random tokens  
- Masking IP addresses  
- Generalizing precise values  

## When should anonymized data be used?
- When including user-like content in tests  
- When copying example content from third-party sources  
- When verifying behavior without exposing any real personal data  

## Techniques for anonymization
- Tokenization (`user-001`, `id-xyz`)  
- Hashing (non-reversible)  
- Masking (`192.0.2.xxx`)  
- Using test-only ranges (RFC 5737 for IPs)  
- Generalization (city → country)

## Notes for contributors
- Do **not** include real personal data in tests.  
- Update documentation/benchmark text to **anonymized** spelling if needed.  
- Test fixtures (like those under `conformance-checkers/`) may intentionally use different spellings or casings – check with maintainers before modifying them.

## Related issue
This documentation relates to clarifying anonymized data usage for issue #55936.
