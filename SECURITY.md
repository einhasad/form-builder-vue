# Security Policy

## Supported versions

Only the latest `0.x` release receives security fixes during the pre-1.0 period.

| Version | Supported |
| ------- | --------- |
| 0.1.x   | ✅        |
| < 0.1   | ❌        |

## Reporting a vulnerability

Please **do not open a public GitHub issue** for security vulnerabilities.

Email the maintainer directly at **loss.of.loss@gmail.com** with:

- a short description of the problem,
- reproduction steps or a proof of concept, and
- the package version affected.

You should get an acknowledgement within 72 hours. A fix and coordinated disclosure will follow.

## Scope

In scope:

- XSS vectors in `FormBuilder` / `FormRenderer` through field configuration or user input
- Prototype pollution through untrusted `formData` / `userData` input
- Supply-chain issues introduced by changes to `dist/` between git and npm

Out of scope:

- Vulnerabilities in your own consuming application code
- DoS via maliciously large form schemas (use your own input-size limits)
- Issues in `devDependencies` that don't ship in the published tarball
