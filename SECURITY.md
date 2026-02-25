# Security Policy

## Supported Versions

The following packages receive security updates for their latest minor versions:

| Package | Supported Versions |
| ------- | ------------------ |
| config-eslint | Latest minor |
| config-playwright | Latest minor |
| config-tsup | Latest minor |
| config-typescript | Latest minor |
| config-vitest | Latest minor |
| utils | Latest minor |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, report vulnerabilities via email to **security@reasonabletech.io**.

## What to Include

When reporting a vulnerability, please provide:

- A clear description of the vulnerability
- Steps to reproduce the issue
- Affected package(s) and version(s)
- Your assessment of severity (Critical, High, Medium, Low)
- Any potential mitigations you've identified

## Response Timeline

- **Initial Response**: Within 48 hours of your report
- **Critical Issues**: Aim to release a fix within 7 days
- **Non-Critical Issues**: Addressed in the next scheduled release

## Disclosure Policy

We follow a coordinated disclosure process:

1. Reporter submits vulnerability privately
2. We confirm receipt and begin investigation
3. We develop and test a fix
4. We release the fix and publish a security advisory
5. Reporter may publicly disclose after the fix is released

We request that you do not publicly disclose the vulnerability until we have released a fix.

## Security Best Practices

For consumers of these packages:

- **Keep dependencies updated**: Regularly update to the latest versions
- **Use lockfiles**: Commit `pnpm-lock.yaml`, `package-lock.json`, or `yarn.lock` to ensure reproducible builds
- **Monitor advisories**: Watch for security advisories in this repository
- **Audit dependencies**: Run `pnpm audit` (or equivalent) periodically
