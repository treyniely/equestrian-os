# Provider setup and economical integration path

Reviewed November 7, 2026. This document describes integration readiness, not a claim that providers have been activated or sandbox-tested.

## Current boundary

`/api/services` exposes permission-scoped readiness and harmless setup preferences. Its POST uses the same-origin, authenticated academy boundary and requires management access to the selected service. It accepts a strict whitelist: reviewed, payroll new/existing, preferred pay frequency, and optional learning-announcement preference. It never accepts bank details, card details, SSNs, tax identifiers, credentials or a browser-supplied academy. Setup reviews do not activate any provider.

Preferences are stored in existing `resources` records with kind `integration-setup`; no migration or new dependency is required. Rollback preserves those records and they can be ignored by older UI. Configuration and connection are separate statuses. Stripe configuration is determined by the existing server-side enablement check; a connected account comes from `billing_accounts`. The response never includes account identifiers, tokens or credentials. Other provider adapters are pending and remain not connected regardless of arbitrary environment keys.

The service-review dialogs explain embedded setup and let the owner prepare choices. They are previews of the intended flow, not functional provider onboarding. Existing Stripe OAuth account linking is unchanged. Embedded Stripe account configuration requires review before onboarding or migrating existing accounts. Worker records, approved time, frozen exports and existing learning resources are retained.

## Mapping the preview to provider contracts

Do not implement a universal checklist of identity fields. Fetch the selected provider/account requirements and render its secure components. The frontend's short steps explain the process; the following is the engineering contract behind them.

| Provider | Required information and sequence | Status and recovery contract | Unsupported here |
| --- | --- | --- | --- |
| Stripe | Country, business type and requested capabilities determine applicable requirements. Embedded onboarding uses the Accounts API requirements and collects the relevant business, representative, verification and external-account details. | Surface outstanding requirements and return to onboarding to correct them. Separately verify payment capability, account mode and application sandbox workflows. | Embedded Account Session creation/component mounting, changing the existing account model, claiming live payments from a locally reviewed checklist. |
| Twilio US 10DLC | Choose Standard/Low-Volume Standard vs eligible sole-proprietor path. Collect the corresponding profile/brand fields, business contact/address and campaign details including purpose, message flow, samples and opt-in/opt-out information. | Track customer-profile/brand/campaign review and number association; pending or rejected registration keeps SMS disabled. Surface provider rejection reasons and corrective actions; apply STOP before dispatch. | Customer profile/brand/campaign submission, number provisioning, messages, live status callbacks. |
| SendGrid | Verify sender identity. Domain authentication requires the domain owner to publish generated DNS records and complete verification. | Show pending vs verified DNS/sender states independently of SMS; process delivery, bounce, spam and unsubscribe callbacks before launch. | Domain/subuser creation, provider validation, dispatch, suppression synchronization. |
| Cloudflare Stream | Server creates direct upload with maximum duration, enforces academy quotas, associates the resulting video with its resource, then waits for processing. Use resumable uploads when required by size or connection reliability. | Failed/expired uploads allow retry and never appear ready. Require signed playback and check authenticated family/resource eligibility before token issuance. | Stream-native upload and processing callbacks, private Stream token issuance, provider usage billing. |
| Gusto employee payroll | Accepted terms; filing/mailing/work locations; employer bank; federal fields `ein`, `tax_payer_type`, `filing_form`, `legal_name`; industry; pay frequency plus anchor dates; completed employee onboarding; state tax setup; verified funding bank; authorized signatory and required forms. Contractor-only companies follow the distinct contractor-only flow. | Read `onboarding_status` for missing steps. Bank verification and company risk review can delay readiness. Wait for provider approval and valid worker setup; moving payroll requires prior payroll/tax history migration review. | Employer/worker creation, secure forms, bank/tax collection, signing, submissions and payroll transfers. |

Detailed contracts:

- Stripe dynamic onboarding: https://docs.stripe.com/connect/embedded-onboarding
- Twilio information by registration path: https://www.twilio.com/docs/messaging/compliance/a2p-10dlc/collect-business-info
- SendGrid domain/DNS authentication: https://www.twilio.com/docs/sendgrid/ui/account-and-settings/how-to-set-up-domain-authentication
- Gusto step prerequisites/completion: https://docs.gusto.com/embedded-payroll/docs/onboard-a-company
- Gusto W-2 onboarding: https://docs.gusto.com/embedded-payroll/docs/onboard-a-w2-employee
- Cloudflare authorized uploads: https://developers.cloudflare.com/stream/uploading-videos/direct-creator-uploads/

## Low-cost development sequence

| Service | Development path | Production gate |
| --- | --- | --- |
| Stripe | Sandbox, test cards and simulated subscription events. These transactions do not move real funds. Reuse existing catalog, checkout and verified-event code. | Decide the connected-account model, configure secure runtime credentials and verify complete sandbox workflows before enabling live billing. |
| Gusto Embedded | Public demo environment for implementation exploration. Use fictional companies and workers. | Commercial, security and implementation approval; pricing/contract; secure embedded onboarding; provider test verification. A retail Gusto subscription is not embedded API approval. |
| Twilio SMS | Trial/testing is limited; real SMS, numbers and registration can incur costs. Start with dry-run queues and designated verified test recipients. | ISV/customer registration, sender provisioning, consent/suppression callbacks, delivery checks and explicit live dispatch gate. |
| SendGrid email | Advertised trial: 100 emails/day for 60 days. Local previews and fake delivery adapters can exercise rules without real dispatch. | Correct multi-customer plan, authenticated senders, production limits, suppression/events and isolated recipient tests. Trial access is temporary rather than a permanent free production plan. |
| Cloudflare Stream | Use local upload/processing previews while the adapter is pending; real storage and video delivery use paid usage. | Platform account, secure direct upload URLs, signed playback after academy/family authorization, usage metering and allowances. |

The application can exercise authenticated APIs and durable local workflows with synthetic data before paid provider activation. A dry-run record must never be labeled sent, paid, verified or processed by the provider. There is no claim that every provider offers an unlimited free tier. Local mocks do not replace sandbox verification.

## Cost references and scope

Cloudflare Stream currently prices stored minutes in blocks of $5/month per 1,000 minutes, and delivered minutes at $1 per 1,000. Upload/encoding and delivery bandwidth are included in those dimensions. Set per-academy allowances and usage alerts rather than selling unlimited video. PDFs use existing private object storage separately.

SendGrid Email API currently starts at $19.95/month; Pro starts at $89.95/month and includes subusers. Confirm customer isolation and required subuser capacity with the provider. EquestrianOS owns audiences, templates and automation rules; provider delivery accounts do not become a second tool each barn must independently configure.

Official references:

- Stripe testing: https://docs.stripe.com/testing
- Stripe embedded onboarding: https://docs.stripe.com/connect/embedded-onboarding
- Gusto demo and production review: https://docs.gusto.com/embedded-payroll/docs/introduction
- Twilio ISV registration: https://www.twilio.com/docs/messaging/compliance/a2p-10dlc/onboarding-isv
- SendGrid plans and trial: https://www.twilio.com/en-us/products/email-api/pricing
- SendGrid subusers: https://www.twilio.com/docs/sendgrid/ui/account-and-settings/subusers
- Cloudflare Stream pricing: https://developers.cloudflare.com/stream/pricing/
- Cloudflare direct uploads: https://developers.cloudflare.com/stream/uploading-videos/direct-creator-uploads/
- Cloudflare private playback: https://developers.cloudflare.com/stream/viewing-videos/securing-your-stream/

## Required verification before launch

Use isolated staging, synthetic families and designated recipients. Verify cross-academy access rejection, service-grant filtering, management checks, strict payload validation, sandbox callback/webhook signatures and retries, duplicate-event suppression, provider errors, expired credentials and real-vs-test account display. Keys belong in server runtime configuration only. Do not paste credentials into chat or commit them to source.
