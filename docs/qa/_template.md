# QA Checklist - Phase N: [שם השלב]

> בדיקות ידניות לפני merge ל-main. גם אחרי שכל ה-gates האוטומטיים עברו.

## תנאי-קדם

- [ ] CI ירוק (Gates A-E)
- [ ] ADR קיים ומאושר
- [ ] תיעוד screens-spec מעודכן
- [ ] PR מתאר את השינוי בצורה ברורה

---

## בדיקות מסך-ידני

### Mobile (Chrome DevTools - iPhone 12 / Galaxy S20)
- [ ] dimensions: 390×844 (mobile portrait)
- [ ] dimensions: 768×1024 (tablet)

### Desktop
- [ ] dimensions: 1440×900
- [ ] dimensions: 1920×1080

### Network
- [ ] Slow 3G - הכל נטען < 5s
- [ ] Offline - PWA service worker עובד
- [ ] Online - normal behavior

---

## בדיקות שפה ו-RTL

- [ ] כל הטקסטים בעברית (אין English placeholders שנשארו)
- [ ] חיצים: `>` במקום `<` ב-RTL
- [ ] padding/margin: `ps-*`/`pe-*` במקום `pl-*`/`pr-*`
- [ ] נומריים מוצגים נכון (כסף, אחוזים, תאריכים)
- [ ] tooltip RTL במקום הנכון
- [ ] טקסט מעורב (עברית + אנגלית) - direction מתחלף נכון

---

## בדיקות גישות (a11y)

- [ ] keyboard navigation עובד בכל מסך
- [ ] Tab order הגיוני
- [ ] focus indicator ברור
- [ ] axe-core scan: 0 violations (critical + serious)
- [ ] screen reader: Hebrew TTS עובד
- [ ] contrast ratio >= 4.5:1 לטקסט רגיל
- [ ] contrast ratio >= 3:1 ל-UI elements

---

## בדיקות תפקודיות

### Happy Path
- [ ] [תאר את ה-flow המרכזי]
- [ ] [תוצאה צפויה]

### Edge Cases
- [ ] empty state
- [ ] error state
- [ ] very long input
- [ ] very short input
- [ ] invalid input
- [ ] permissions blocked (geo, camera, etc.)

### Regression
- [ ] פיצ'רים קיימים שלא נגעתי בהם - עדיין עובדים

---

## בדיקות אבטחה ופרטיות

- [ ] secrets לא ב-frontend bundle
- [ ] CORS מותאם
- [ ] auth required במקומות הנכונים
- [ ] PII לא ב-logs
- [ ] rate-limiting פעיל ב-endpoints חשובים
- [ ] CSP headers מוגדרים

---

## בדיקות ביצועים

- [ ] LCP < 2.5s (mobile, 4G)
- [ ] CLS < 0.1
- [ ] FID < 100ms
- [ ] bundle size לא קפץ משמעותית
- [ ] images optimized (next/image)

---

## בדיקות-עין (השוואה ל-StudiesGo)

לכל מסך חדש:
- [ ] שיש לי `docs/screens/<screen>.jpg` להשוות אליו
- [ ] גודל-טקסטים דומה
- [ ] צבעים דומים (לפחות בגוון)
- [ ] spacing נראה דומה
- [ ] מיקום-elements דומה

---

## אישור Phase

- [ ] כל ה-checks למעלה ✓
- [ ] retrospective נכתב ב-`docs/phase-N-retrospective.md`
- [ ] MEMORY.md עודכן עם learnings
- [ ] PR מאושר ע"י לפחות 2 agents (lead + reviewer)
