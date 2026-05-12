# Changelog

## Unreleased - Reception ERP Operational Upgrade

Local review build only. Do not publish until approved.

### Added

- Admin-only student soft delete with confirmation and local audit log.
- Super Admin-only permanent delete path for exceptional cleanup.
- Sequential admission numbers in `ADM-YYYY-0001` format.
- Admission tab as the single source for new registrations.
- Admission workflow support for Inquiry, Pending, Approved, and Enrolled.
- Student-linked document uploads for birth certificate, marksheet, transfer certificate, Aadhaar, passport photo, and other documents.
- Profile photo management from uploaded passport photo.
- Dedicated Student Profile tab with personal, admission, parent, fee, house, credential, and document details.
- Advanced Management tab with class, section, dues, pending documents, document type, house, and admission status filters.
- Filtered CSV export for operational lists.
- Shareable PNG report generator for WhatsApp-ready school reports.
- Professional fee receipt layout with external print action and no visible buttons inside the receipt body.
- Secure Electron print bridge for receipt-only system printing.
- PostgreSQL migration for documents, student profiles, soft delete fields, houses, report logs, and pending document tracking.

### Changed

- Removed ID Card navigation from the receptionist UI.
- Reworked Students tab into a student database and deletion/audit workspace.
- Standardized student selectors around name, class, section, and admission number.
- Normalized legacy local records to preserve existing data while adding new document/profile/delete fields.

### Not Released

- No Git push performed.
- No version bump performed in this task.
- No GitHub Release published.
- No auto-update rollout triggered.
