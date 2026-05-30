# scripts/parsers

Parser scripts להמרת קבצי DOCX ו-PDF של מאגרי שאלות למבנה JSON אחיד.

## הרצה

### parse-docx-qa — קובץ Word (Q&A חופשי)

```bash
pnpm tsx scripts/parsers/parse-docx-qa.ts path/to/questions.docx > output.json
```

### parse-pdf-mcq — קובץ PDF (מאגר MCQ)

```bash
pnpm tsx scripts/parsers/parse-pdf-mcq.ts path/to/questions.pdf > output.json
```

stdout = JSON, stderr = progress + שגיאות. exit code != 0 בשגיאה.

## מבנה המוצא

```json
{
  "source": "/path/to/file.pdf",
  "totalQuestions": 42,
  "questions": [
    {
      "sourceId": "file.pdf#q1",
      "type": "mcq_short",
      "question": "מהי הטמפרטורה הנורמלית?",
      "options": ["35 מעלות", "37 מעלות", "39 מעלות", "41 מעלות"],
      "correctIndex": 1,
      "rawText": "...",
      "scopeRefs": []
    }
  ]
}
```

### שדות ParsedQuestion

| שדה                 | תיאור                                          |
| ------------------- | ---------------------------------------------- |
| `sourceId`          | `<basename>#q<N>`                              |
| `type`              | `mcq_short` / `mcq_long` (>120 תווים) / `open` |
| `question`          | טקסט השאלה                                     |
| `options`           | מערך 4 אפשרויות (MCQ בלבד)                     |
| `correctIndex`      | אינדקס 0-based של תשובה נכונה (MCQ)            |
| `correctAnswerText` | טקסט תשובה (שאלות פתוחות)                      |
| `rawText`           | הטקסט הגולמי המקורי                            |
| `scopeRefs`         | ריק — יוטמע ידנית ב-scope-tag UI               |

## פורמטים נתמכים

### DOCX (parse-docx-qa)

- `שאלה: ...` / `תשובה: ...`
- `1. שאלה...` / `תשובה: ...`
- MCQ עם `א. ב. ג. ד.` ו-`תשובה: ג`
- שאלות המסתיימות ב-`?`

### PDF (parse-pdf-mcq)

- `1. שאלה...` / `א. ב. ג. ד.` / `תשובה: ב`
- `1) שאלה...` / `(א) (ב) (ג) (ד)` / `תשובה נכונה: ג`

## מגבלות ידועות

- **PDF סריק** (ללא text-layer) — מחזיר `questions: []` עם אזהרה ב-stderr. פתרון: OCR מקדים עם Tesseract.
- **פורמט חופשי לגמרי** — אם DOCX לא עוקב אחרי אף אחד מהפורמטים הנ"ל, חלק מהשאלות לא יזוהו. יש לבדוק את ה-`rawText` לוידוא ידני.
- **תשובות MCQ ב-DOCX** — `correctIndex` מסתמך על `תשובה: ג` בשורה נפרדת. תשובות שמוטמעות ב-bold/formatting ייתכן שלא יזוהו.
- **שאלות מרובות עמודים ב-PDF** — הפרסר מחבר שורת-המשך לשאלה אם אין אפשרות/תשובה ביניהם, אך עימוד מורכב עלול לגרום לחיתוך שגוי.
- **אין תמיכה ב-RTF / ODT / PPT** — נדרשת המרה מקדימה ל-DOCX/PDF.
