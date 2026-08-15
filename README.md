# Shree Ram Vidhya Mandir School (SRVM)

This repository contains the SRVM school website and its Node.js/Express backend.

## Run locally

1. Install Node.js LTS.
2. Open a terminal in this repository.
3. Run:

```bash
npm install
npm start
```

4. Open:

- Public website: http://localhost:5000/
- Admin panel: http://localhost:5000/admin/

If the project includes `START_WEBSITE.bat`, it can also be used on Windows.

## Important

- Never commit `.env`, real passwords, admission records, contact records, or private uploads.
- Initial admin login: username `admin`, password `ChangeMe123!`. Change the password from the Admin Password section after first login.
- `uploads/` is intentionally kept empty in the repository; runtime uploads are local/generated data.
- `data/admissions.json` and `data/contacts.json` are runtime data and should be backed up separately.

## Main features

- SRVM public website
- Admin login and management panel
- School information
- Events and facilities
- Admissions and contact forms
- Gallery/photo management
- About-section photo
- Class IX-XII management
- Social links
- Bell interaction
