# Seam

**Partner-seam complaint classifier for Grasshopper Bank's product team.**

Built by [Sidharth Sundaram](https://sidharthsundaram.com) as a PM internship application artifact.

[View Live](https://sid-grasshopper.vercel.app/)

---

## The Thesis

Grasshopper Bank's product isn't a monolith — it's a composition of 12+ partner systems (MANTL, Alloy, Narmi, FIS, Autobooks, Hummingbird, Plaid, FiVerity, MX, Lendio, EnFi, Visa). That partner-first model drove 191% revenue growth and 83% asset growth in 2025. It's the bank's superpower.

But it has a cost: **client intelligence is fragmented across partner boundaries.** No single system — and no single person on the product team — sees the full picture. When a client complains, the friction usually isn't inside any one partner. It's at the *handoff* between two.

The [PM intern JD](https://www.grasshopper.bank) literally describes the human middleware that fills this gap: "maintain a comprehensive view of partner roadmaps," "initial feedback triage (e.g., NPS)," "synthesizing notes from customer interviews." Those responsibilities exist because the tooling doesn't — yet.

**Seam is what that tooling looks like.**

---

## What It Does

Seam classifies client complaints by which partner system(s) are involved and whether the issue is:

- **Within-partner** — a bug or gap inside a single system
- **Between-partner (seam failure)** — friction at the handoff between two systems

For each complaint, it outputs:

| Field | What it tells you |
|---|---|
| **Primary / Secondary Partner** | Which systems are involved |
| **Seam Type** | Within-partner bug vs. between-partner handoff failure |
| **Lifecycle Stage** | Where in the client journey it occurs (onboarding, daily banking, compliance, lending, experience) |
| **Severity** | Low → Critical based on business impact |
| **Seam Analysis** | The architectural *why* — what data should flow between which systems and doesn't |
| **Suggested Owner** | Which partner team(s) + internal team should investigate |
| **Pattern Signal** | Strategic insight for the PM team — what to instrument, what to investigate |

The demo includes 4 pre-analyzed complaints sourced from real Trustpilot, BBB, and DepositAccounts reviews. In production, it uses the Claude API to classify any complaint in real time.

---

## Key Finding

3 of 4 real complaint patterns are **seam failures**, not within-partner bugs. The most critical:

> MANTL auto-approves accounts in minutes. Hummingbird/Internal flags them weeks later. The client experiences "approved then closed with no explanation" because the approval signal and the compliance signal come from different systems with different timelines.

This single pattern accounts for the majority of Grasshopper's 1-star reviews. It's not a compliance problem or an onboarding problem — it's a *timing mismatch across partner boundaries* that no single partner owns.

---

## Partner Ecosystem Map

| Partner | Function | Data It Owns | Source |
|---|---|---|---|
| FIS IBS | Core banking | Balances, transactions, ledger | [Narmi case study](https://www.narmi.com/case-studies/grasshopper-bank) |
| Narmi | Digital platform | UI, login, MCP, feature access | [Narmi case study](https://www.narmi.com/case-studies/grasshopper-bank) |
| MANTL | Account origination | Applications, approvals, docs | [MANTL partnership PR](https://www.mantl.com/news/customer-news/grasshopper-bank-partners-with-mantl/) |
| Alloy | Identity & KYC | ID verification, risk flags | [Banking Dive](https://www.bankingdive.com/news/grasshopper-bank-fintech-partners-economic-downturn-mike-butler/644506/) |
| Autobooks | Invoicing & payments | Invoice volume, payment acceptance | [Autobooks case study](https://www.autobooks.co/banking-stories/grasshopper-bank) |
| Plaid | Account linking | External account connections | [Grasshopper resources](https://www.grasshopper.bank/resources/) |
| Hummingbird | BSA compliance | SAR monitoring, transaction screening | [The Bank News](https://thebank.news/2022/06/15/grasshopper-digital-small-business-bank-relaunches-with-new-ceo/) |
| FiVerity | Fraud detection | Fraud patterns, false positives | [Grasshopper PR](https://www.grasshopper.bank/press-releases/grasshopper-banks-steady-growth-continues/) |
| MX | Data aggregation | Cross-institution financial data | [Financial Brand](https://thefinancialbrand.com/news/business-banking/inside-grasshopper-banks-first-of-its-kind-natural-language-banking-experience-for-smbs-and-startups-192336) |
| Lendio | SBA lending | Loan application pipeline | [Grasshopper H2 2025 blog](https://www.grasshopper.bank/who-we-are/blog/delivering-breakthrough-digital-banking-innovation-in-h2-2025/) |
| EnFi | Credit risk AI | Risk assessments | [Grasshopper H2 2025 blog](https://www.grasshopper.bank/who-we-are/blog/delivering-breakthrough-digital-banking-innovation-in-h2-2025/) |
| Visa | Debit card | Spend data, cashback | [Grasshopper products](https://www.grasshopper.bank/banking-solutions/startups/) |

---

## Evidence Sources

- **392 Trustpilot reviews** — [trustpilot.com/review/www.grasshopper.bank](https://www.trustpilot.com/review/www.grasshopper.bank)
- **BBB complaints** — [bbb.org/grasshopper-bank](https://www.bbb.org/us/ny/new-york/profile/banking-services/grasshopper-bank-0121-87168439/customer-reviews)
- **DepositAccounts reviews** — [depositaccounts.com/banks/grasshopper](https://www.depositaccounts.com/banks/grasshopper.html)
- **Grasshopper H2 2025 blog** — [grasshopper.bank/blog](https://www.grasshopper.bank/who-we-are/blog/delivering-breakthrough-digital-banking-innovation-in-h2-2025/)
- **Enova acquisition PR** — [ir.enova.com](https://ir.enova.com/2025-12-11-Enova-Announces-Definitive-Agreement-to-Acquire-Grasshopper-Bank)
- **MCP server launch** — [grasshopper.bank/press-releases](https://www.grasshopper.bank/press-releases/narmi-and-grasshopper-launch-first-mcp-server-by-a-u-s-bank-for-ai-driven-insights/)
- **Narmi case study** — [narmi.com/case-studies/grasshopper-bank](https://www.narmi.com/case-studies/grasshopper-bank)
- **MANTL partnership** — [mantl.com](https://www.mantl.com/news/customer-news/grasshopper-bank-partners-with-mantl/)

---
