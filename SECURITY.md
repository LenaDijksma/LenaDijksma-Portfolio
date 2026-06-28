# Security Policy

## Supported Versions

Security updates are guaranteed only for the latest release of this project.

Older versions may receive security updates on a case-by-case basis if backporting a fix is practical and provides a meaningful security benefit. Users are encouraged to upgrade to the latest version whenever possible.

## Reporting a Vulnerability

If you discover a security vulnerability, please report it privately by email:

**Email:** [lenadijksma08@gmail.com](mailto:lenadijksma08@gmail.com)

Please **do not** create a public GitHub issue for security vulnerabilities.

Include as much information as possible, such as:

* A description of the vulnerability.
* Steps to reproduce the issue.
* The affected version or commit.
* Any relevant logs or screenshots.
* A suggested fix, if available.

Please **do not** include:

* `.env` files.
* API keys, access tokens, passwords, or other secrets.
* Personal information belonging to yourself or others.

If sensitive configuration is required to demonstrate an issue, replace it with placeholder values.

## Response Process

When a valid security report is received:

1. I will acknowledge receipt within **48 hours**.
2. I will investigate and verify the report.
3. If confirmed, I will work on a fix.
4. The vulnerability will be disclosed publicly only after a fix has been released.
5. The security fix will be mentioned in the release notes.

## Responsible Disclosure

Please keep security reports private until a fix has been released.

Public disclosure before a fix is available may put users at unnecessary risk.

## Scope

Examples of security issues include, but are not limited to:

* Sensitive information exposure.
* Dependency vulnerabilities that have a demonstrable impact on this project.
* Other vulnerabilities that could reasonably compromise the confidentiality, integrity, or availability of the application.

## Out of Scope

The following generally do **not** qualify as security vulnerabilities:

* Missing security headers on localhost or development environments.
* Self-XSS requiring use of the browser developer console.
* Issues caused solely by outdated or unsupported browsers.
* Vulnerabilities in third-party dependencies without demonstrated impact on this project.
* General best-practice recommendations that do not represent an actual security issue.

## Security Testing

Please test responsibly.

Do **not** perform security testing against the live website or production services.

Instead, reproduce and verify issues using:

* A local development environment.
* Your own fork of the repository.

## Recognition

If you responsibly disclose a valid security vulnerability, you will be credited in the release notes unless you request to remain anonymous.

Thank you for helping keep this project secure.
