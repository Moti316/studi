# Create Course - Step 1: Source Picker — `/create-c` (1/5)

> **Phase**: 3 · States: empty / file-selected / uploading

## Purpose
שלב ראשון ביצירת קורס. משתמש בוחר מקור: העלאת קבצים או כתיבת טקסט.

## States
- **empty**: drag-drop empty + "לחץ לבחירת קבצים"
- **file-selected**: שם הקובץ + size + X לביטול + pencil לעריכת-שם
- **uploading**: progress bar + "מעלה קבצים לשרתים..."

## Layout
```
[progress: ●●○○○ 1/5] [StudiesGo logo]
[Bob mascot curious]
"העלה את החומרים שלך 📚"
"PDF, Word, PowerPoint, Excel, תמונות"
[Toggle: העלאת קבצים | כתיבת טקסט]
[Drop zone: גרור קבצים לכאן או לחץ לבחירה]
"עד 50MB · PDF, Word, PowerPoint, Excel, תמונות"
[uploaded files list]
[המשך →]
```

## Components
- `<WizardProgress current=1 total=5>`, `<BobMascot pose="curious">`
- `<SourceTypeToggle>` (files | text)
- `<FileDropzone max=50MB>` (FilePond או custom)
- `<UploadedFileChip>` (X + edit name)

## Data
- POST `/api/courses/draft` (creates draft course)
- POST `/api/uploads` (multipart to Supabase Storage)
- `course_drafts`, `course_files` tables

## Acceptance
- [ ] drag-drop עובד
- [ ] multiple files אפשרי
- [ ] validation: format + size
- [ ] mobile: file picker + camera
- [ ] draft נשמר (חזרה לאחר סגירה ממשיכה מאותו מצב)

## Source
`docs/screens/create_upload.jpg`
