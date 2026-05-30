# Content Inventory — Google Drive Scan

> **תאריך-סריקה**: 2026-05-30 (לילה)
> **בעלים**: motilev8@gmail.com
> **מקור**: 2 תיקיות-שורש + 1 sub-folder + 8 sub-folders של מרצים + 4 sub-sub-folders
> **סה"כ פריטים**: ~130 קבצים, ~6 GB

---

## Tier System (לעיבוד ב-StudiBuilder)

| Tier                             | תוכן                                 | יעד ב-pipeline                     | סטטוס MVP                          |
| -------------------------------- | ------------------------------------ | ---------------------------------- | ---------------------------------- |
| **T1 — Quiz Source**             | שאלות-ותשובות (PDF/docx)             | ייבוא ישיר → `questions` table     | **חובה Phase 5**                   |
| **T2 — RAG Context**             | מצגות, סיכומים, חומרי-לימוד טקסטואלי | chunking → pgvector → "הסבר לעומק" | **חובה Phase 4-5**                 |
| **T3 — Legal Sources**           | PDF/docx של חוקים/תקנות              | chunking + scope-filter (21 IDs)   | **חובה Phase 4**                   |
| **T4 — Audio/Images (deferred)** | m4a, jpg, png                        | transcription post-deadline        | **דחוי post-2026-07-15**           |
| **❌ EXCLUDED — Video (mp4)**    | 5 קבצים, ~4.05 GB                    | לא לעיבוד                          | **הוחרגו ע"י motilev8 2026-05-30** |

---

## 📁 תיקייה-שורש 1: "ממונה בטיחות 2025"

**Folder ID**: `1pQQcc-PCzG5QXtPOspIGbThVDcDgfXSI`

### Root-level (16 פריטים)

| Tier | סוג    | שם                                             | גודל   | File ID                                        |
| ---- | ------ | ---------------------------------------------- | ------ | ---------------------------------------------- |
| T1   | PDF    | מאגר שאלות הכנה לוועדה - כללי - ספטמבר 2025 ⭐ | 1.8 MB | `1BA9XpSDVNx-MVbiyQZCndeyMVROTZ0aG`            |
| T2   | GDoc   | דשבורד חקיקה - ממונה בטיחות                    | 5.5 KB | `1rMFMljQ086AQk9PhmcYUJ1AiswU3SOgpAfNmV4-CPyI` |
| ❌   | mp4    | פקודת הבטיחות פירוק החוק (EXCLUDED — וידיאו)   | 18 MB  | `1KGTewoIU9GNM-ygvd_opOwF82GHCRZZh`            |
| T4   | m4a    | חוק רישוי עסקים + צו + תקנות                   | 38 MB  | `1X0IF_kuDzsz1x-vgEClzf9Kkvtq3s1Wm`            |
| T4   | m4a    | תקנות התאונות ומשלח-יד (הודעה) 1951            | 27 MB  | `1go2iba1J-tkAwXXDFyAFrqRcPp9_UKiz`            |
| T4   | m4a    | תקנות מחלות מקצוע (חובת הודעה) 1980            | 34 MB  | `1czjhL92940hj_IaCdY_puUHlzvqh25ZX`            |
| T4   | m4a    | פקודת תאונות ומחלות משלח-יד 1945               | 34 MB  | `1np_v_TVeRoaVs1E8FHrgIU47DqY4dWHi`            |
| T4   | m4a    | תקנות מסירת מידע והדרכה 1999                   | 36 MB  | `1EuaX8XLe9ui3_suj_Wkv3ZCF-gwwucWL`            |
| T4   | m4a    | תקנות ציוד מגן אישי 1997                       | 30 MB  | `1CJbLQiR-wbdRZ7ISZEWJBX0spDdCQVD5`            |
| T4   | m4a    | חוק ארגון הפיקוח 1954                          | 55 MB  | `1kD6ZzlO9uCHK4XofVmbMqKUWWwGQqZag`            |
| T4   | m4a    | תקנות עבודות בניה 1988                         | 40 MB  | `1v_MGTiEzZSaFU-dFzeBTpJEiY_fGKw0L`            |
| T4   | m4a    | תקנות ארגון הפיקוח (ממונים) 1996               | 39 MB  | `1QFLbBVXY5jVWKhWSGCjl-MlGaqVM5hif`            |
| T4   | m4a    | חוק עבודת נשים 1954                            | 36 MB  | `1EgKXtImY4qvQUOEGEkRY0l2neJiY62uS`            |
| T4   | m4a    | פקודת הבטיחות 1970 (סעיפים 1-100)              | 56 MB  | `1S4Sl9cTAxSUb0UmBnN2VAoRkth1j3M3b`            |
| T4   | m4a    | פקודת הבטיחות 1970 (סעיפים 101-248)            | 56 MB  | `1pcWC5mRZ4NY_VMbc-GN6iOwOKHtfJRaD`            |
| 📁   | folder | חומרי לימוד                                    | —      | `1Xr170fcoD-MUD0_3WtqMuN7Eqz6oBVbT`            |

**אודיו סה"כ**: 12 קבצים, ~511 MB (T4 — דחוי)

---

### 📁 sub-folder: "חומרי לימוד" (2 קבצים + 8 sub-folders)

**Folder ID**: `1Xr170fcoD-MUD0_3WtqMuN7Eqz6oBVbT`

| Tier | סוג | שם                               | גודל   | File ID                             |
| ---- | --- | -------------------------------- | ------ | ----------------------------------- |
| T2   | PDF | מצגת חזרה כללית - שאדי (04.2021) | 26 MB  | `1pIBW0lAQp39HngQr_FGf_ppsqBA7fGYP` |
| T2   | PDF | עבודת גמר - ממונה בטיחות         | 2.8 MB | `1VjWos5m8a913YAR-BLsYa0_UnZNvfJ-2` |

#### 📁 sub: אבי גריפל - ניהול סיכונים (5 קבצים)

**Folder ID**: `1AT5559V8bNooYC_oStIj8-quM5_GNH6t`

| Tier | סוג  | שם                                            | גודל   | File ID                             |
| ---- | ---- | --------------------------------------------- | ------ | ----------------------------------- |
| T2   | ppt  | ליוסי שיטות חקירה מתקדמות (2022)              | 2.6 MB | `1hP_vXQpIozhSYwjbX0qBYaTbZMJ9fhxu` |
| T2   | doc  | טמפלייט תוכנית בטיחות (2014)                  | 318 KB | `1bRmcKswwBriyT8EXdWzClBTWp2KQurRX` |
| T3   | PDF  | תקנות ארגון הפיקוח (תכנית לניהול בטיחות) 2013 | 331 KB | `1WnpPdhHDMp-ziBGAa2mwHrQG0mqwb_Dp` |
| T2   | pptx | מצגת יום 3 - נובמבר 2013                      | 905 KB | `19YqDBWOuia0MqH-WHUNqdRZ3JFdESdQp` |
| T2   | ppt  | תקנות ניהול בטיחות 2012 (לאחר תיקון)          | 861 KB | `1nJ1UbQuWk5zTyGGK3gPR1hAYZdsPcQNO` |

#### 📁 sub: דן כהן - עבודות בגובה (2 PDFs)

**Folder ID**: `1P8uXO0kJJLiSCVM0eycWTmHLpnLDClsS`

| Tier | סוג | שם                             | גודל    | File ID                             |
| ---- | --- | ------------------------------ | ------- | ----------------------------------- |
| T2   | PDF | עבודה בגובה - מבוא             | 8.3 MB  | `1gmaG4YZlY8Pyue992klmYH7op7ONEruJ` |
| T2   | PDF | עבודה בגובה - פירוט לפי תחומים | 13.2 MB | `1ILGR5UHPD2SWtqsQ_jkhDyouEomjNcWU` |

#### 📁 sub: אולג גולובין (19 קבצים)

**Folder ID**: `1eiTJH46cq42Ms2BvZU_tygfBmzdPbb9E`

| Tier | סוג  | שם                                 | גודל    | File ID                                                                   |
| ---- | ---- | ---------------------------------- | ------- | ------------------------------------------------------------------------- |
| T2   | PDF  | רעש מזיק                           | 1.7 MB  | `1GhqHlutbtbAgR27LPNok0wrI9FSCMShk`                                       |
| T4   | m4a  | שיעור חזרה                         | 120 MB  | `1PTOEgOrA1izuSfw51MDqWft1duzHR4P-`                                       |
| T3   | PDF  | תקנות בטיחות וגיהות במעבדות 2001   | 209 KB  | `1qX6shjYnVgzWzAN0QT5k_1DGefRRkrix`                                       |
| T3   | docx | תקנות בטיחות וגיהות במעבדות 2001   | 126 KB  | `1GEIUU5v1_d9W0PaeOaFYyON1ht5xfry6`                                       |
| T2   | PDF  | ניטור סביבתי                       | 1.0 MB  | `17b7Ci6hWQjKy6wOHmkiNV8Kxu2cFHGTQ`                                       |
| T2   | PDF  | ממיסים אורגנים                     | 940 KB  | `160vtZkHaYJ3yeSbIHKY4YHy6TC8Y1eyM`                                       |
| T2   | PDF  | SDS                                | 1.7 MB  | `1QLdOhAMxd4El3R0zbgpBeuFmuPW0U29i`                                       |
| T2   | PDF  | Emailing 4958_001                  | 1.1 MB  | `1bTJiBhYoqvB115XRfAKkOZ7KPV9AutJN`                                       |
| T2   | PDF  | גהות                               | 3.3 MB  | `16kcID5d46ETrGDI68VjybOoqPfCPQCVa`                                       |
| T2   | PDF  | TLV                                | 1.1 MB  | `1anpJLwVsBwn-xFmYTBaU7wu0BbSRNEMD`                                       |
| T2   | PDF  | בטיחות תהליכית                     | 3.3 MB  | `1-0librx_C9ZXcWBW0DYQrLHfBNvWZN3D`                                       |
| T2   | PDF  | רעש מזיק (כפילות?)                 | 1.7 MB  | `1q2smNQeRBvvuLTEQKT247bUk-A_iQa31`                                       |
| T2   | PDF  | SDS_Compliance_Essentials          | 11.6 MB | `1Pg59f124IRcMCNiSNNzxhj26LHkTizt1`                                       |
| T4   | png  | גיליון בטיחות                      | 6.1 MB  | `1i6v2_RAcz3avcwvge9acAfg2TYilRq52`                                       |
| T3   | docx | תקנות גיליון בטיחות 1998           | 105 KB  | `1vBGzYWtgwHyVSmKe5_aNoTURXYoenA04`                                       |
| T4   | jpg  | IMG-20251123-WA0045..49 (5 תמונות) | ~480 KB | `1Rb_/19O2/1bX9/1tPK/14jU`                                                |
| T4   | m4a  | אולג שיעור 1 (23.11.25)            | 110 MB  | `1FGmIikVZiW5WlJhKArTzHVhdqY8KOZ3f`                                       |
| T4   | m4a  | אולג שיעור 2 (26.11.25)            | 141 MB  | `1FaNs8IIWvCsq_KoEL24FO-Xdt2YV58bs`                                       |
| T4   | m4a  | אולג שיעור 3 חלק א+ב (30.11.25)    | 181 MB  | `1gjUAPkJksszmhL0CAVm7HaUwF-HrWAD3` + `126UGn6apORT_N7lsKdNihEXlVg53q1sM` |

#### 📁 sub: אבי לוי (4 פריטים + 2 sub-folders)

**Folder ID**: `1uwComNk3ZhRC6El5qxXDdd7Q0Gm5Sn9L`

| Tier | סוג  | שם                        | גודל   | File ID                             |
| ---- | ---- | ------------------------- | ------ | ----------------------------------- |
| T4   | jpeg | WhatsApp Image 2025-10-19 | 153 KB | `1sJZBdHeaNld7b_mqbxogZCPx7Fr0vFKS` |
| T1   | PDF  | שאלות למבחן אבי לוי ⭐    | 890 KB | `1hUvTUJmckBTL5urKJN_Ypd4JZzGcQGTJ` |

##### 📁 sub-sub: ציוד מגן אישי (3 קבצים)

**Folder ID**: `1VvmdX1n3DZdnXioTM5bZj5ny_SyIvJVE`

| Tier | סוג  | שם                               | גודל    | File ID                             |
| ---- | ---- | -------------------------------- | ------- | ----------------------------------- |
| T2   | ppt  | ציוד מגן אישי                    | 18.3 MB | `16rPds3r72DupdspuCpm1dy2T2M-Ep2Vx` |
| T3   | doc  | תקנות הבטיחות - ציוד מגן אישי    | 109 KB  | `1O84ewk_2NSWqdUknsjvehL1ky_dpBYXu` |
| T1   | docx | שאלות ותשובות - ציוד מגן אישי ⭐ | 25 KB   | `1RP2F2x-GwqX5sybXBWUORgtbO7VPFNLP` |

##### 📁 sub-sub: חשמל (5 קבצים)

**Folder ID**: `1gXdGJ9km6xTB8kW9zGyMXNBXkhAUNncr`

| Tier | סוג  | שם                                           | גודל   | File ID                             |
| ---- | ---- | -------------------------------------------- | ------ | ----------------------------------- |
| T2   | PDF  | בטיחות בחשמל לממוני בטיחות - חלק א (cleaned) | 4.7 MB | `1ylsb3v8K4oPH4MsZ-JKP_72a7AVgo3cT` |
| T3   | doc  | תקנות החשמל - עבודה במיתקן חי 2014           | 2.5 MB | `1OlHEb1r_frMKq3_kkoLHlSaesatcKJWO` |
| T2   | PDF  | בטיחות בחשמל - חזרה והמשך (cleaned)          | 4.7 MB | `15QTxKRdITeMzqdb_ANeVSfSRjr-FLAlW` |
| T3   | doc  | תקנות החשמל - מיתקן ארעי באתר בניה 2002      | 74 KB  | `1a-IKoTp8dYJXyjo_DA-oIAXoulGStv1e` |
| T3   | docx | תקנות הבטיחות בעבודה (חשמל) 1990             | 26 KB  | `1ZIgqbOJQCkj5Au-SSaepDWH6c1qwzuQV` |

#### 📁 sub: מיכאל פייזל (2 PDFs)

**Folder ID**: `13vmnO8Lj42hr2sZfr42FKOWc-ETY-zik`

| Tier | סוג | שם                      | גודל   | File ID                             |
| ---- | --- | ----------------------- | ------ | ----------------------------------- |
| T2   | PDF | ריתוך וחיתוך (cleaned)  | 4.4 MB | `1og-MKfCVw3Rf8Sofn3KPYKno7B4mcnGS` |
| T2   | PDF | עיבוד שבבי 39 (cleaned) | 2.3 MB | `1vvZlNRlPmC8p-PC3IVAs_s8kn1vihwDi` |

#### 📁 sub: טל גרינהויז (6 docx + 2 sub-folders)

**Folder ID**: `1ek5oNfyCdqG2TMGLqEowC-szgQg6tHAI`

| Tier | סוג  | שם                                          | גודל    | File ID                             |
| ---- | ---- | ------------------------------------------- | ------- | ----------------------------------- |
| T2   | docx | סיכונים ובקרות פרק ג' - בטיחות פקודה        | 13.2 MB | `1seDqvaTyvEqHka-QxYsiS8nNbHrHQ9Zg` |
| T2   | docx | מבוא לחוזק חומרים + תהליכי ייצור            | 6.0 MB  | `1lmvZo7hs6iYPwx3ie1wlGDPovvfCmGJk` |
| T2   | docx | מערכות אוטומטיות + רובוטים                  | 25.9 MB | `1gAUdWjUWleBe7Fi750Xeg5Xv66nJAiVZ` |
| T2   | docx | סקר סיכונים                                 | 2.9 MB  | `1apdoTvn-SW940cEnIdg9yc61Yn_UjWDk` |
| T2   | docx | תאונות                                      | 841 KB  | `1NdQFu2Wt3gs_ZUy0W59xFXzHnaTSPRAX` |
| T2   | docx | סיכונים ובקרות פרק ג' - בטיחות פקודה חלק ב' | 21.3 MB | `1lumH8qy4RZqEj1sA6QDDE4lQalVKweLJ` |

##### 📁 sub-sub: 5.11.25 (3 docx)

**Folder ID**: `1Lkdl4ckw6PQZ6XXzsWxaYLZZehreoIiU`

| Tier | סוג  | שם                       | גודל    | File ID                             |
| ---- | ---- | ------------------------ | ------- | ----------------------------------- |
| T2   | docx | מכונות הרמה (5.11.25)    | 32.0 MB | `1Tnb94ARUBXBywKFG0n4tIfOj7bnQyqHG` |
| T2   | docx | תאונות במכונות (5.11.25) | 5.6 MB  | `1WDB5LFbY7Rt_AH4LbI3H7laoSQvkb8iT` |
| T2   | docx | אביזרי הרמה (5.11.25)    | 67.0 MB | `19b88SKrPsYLLEP-u99Jdrl12FP9Us2k4` |

##### 📁 sub-sub: 16.11.25 (3 docx)

**Folder ID**: `1Kn2pPcOo9Cm-PlS2jv3Q7vKlesAjolMl`

| Tier | סוג  | שם                                      | גודל    | File ID                             |
| ---- | ---- | --------------------------------------- | ------- | ----------------------------------- |
| T2   | docx | דרגנוע (16.11.25)                       | 2.5 MB  | `1uWwKGANIApFiPUzieJ2H0Y4PaqZuyO89` |
| T2   | docx | מעליות (16.11.25)                       | 40.5 MB | `1zlzG2xY-Wp0BXQBrAJyMP7uN_Eg-3hxC` |
| T2   | docx | נהלי מפער - כלים טעוני בדיקה (16.11.25) | 6.9 MB  | `1JXUZrsIPy5TWjT5X70v4UuFR0wcQHJov` |

#### 📁 sub: אייל פלטק (24 קבצים)

**Folder ID**: `1leCS-7ac485pofYx64VSILILZlRH2DUY`

| Tier | סוג | שם                                          | גודל    | File ID                             |
| ---- | --- | ------------------------------------------- | ------- | ----------------------------------- |
| T1   | PDF | מבחן שיעור 1 עם תשובות ⭐                   | 638 KB  | `1oH0Co3AfVLHVNMunUG0srQWzjIHLxdRq` |
| T1   | PDF | מבחן שיעור 1(1) עם תשובות ⭐                | 1.2 MB  | `1eL6QJNIrcXDLdcKkyECqG4A562T_-rIw` |
| T1   | PDF | מבחן שיעור 2 עם תשובות ⭐                   | 223 KB  | `1q2RykwKwUT4Zb4tlmzHE9LGqRXZqgljA` |
| T1   | PDF | מבחן שיעור 3 עם תשובות ⭐                   | 243 KB  | `1RJaobK9AcEoqYpo5x8W9PwakW4bEVv_Y` |
| T1   | PDF | מבחן שיעור 4 עם תשובות ⭐                   | 342 KB  | `1VfrbGuUtRfRy3fUJBs_MXInX3nAe-tDs` |
| T2   | PDF | מצגת שיעור 1                                | 25.3 MB | `1iwDr1sWcqaAMGxQWLsLYp2pVJiZvMDI5` |
| T2   | PDF | מצגת שיעור 2                                | 10.2 MB | `1Xqk9Ug95EM1a5oeAUQG65-zhZRWww4e3` |
| T2   | PDF | מצגת שיעור 3                                | 14.9 MB | `1aZ4H1ttEUkp0xz5lzSK_qHm01QKgaAfm` |
| T2   | PDF | מצגת שיעור 4                                | 3.3 MB  | `1RJ0qo-1HgPh1axzBvUEZmtlvScmuiKg6` |
| T2   | PDF | מצגת שיעור 5                                | 3.7 MB  | `1peLnr3c3TQfow0yiXob8LaI87SIk46q6` |
| T3   | PDF | תקנות ארגון הפיקוח (מסירת מידע והדרכה) 1999 | 1.1 MB  | `1PUcxfVlYYTP-7ntrRbIHC1HMWpcMUprz` |
| T2   | PDF | קטלוג תקני בניין (08-08-2016)               | 2.2 MB  | `1ve4w4S9cPpp6E8oq8CfUmCzciMtRtOdE` |
| T2   | PDF | פנקס כיס                                    | 19.8 MB | `1ZwiCGY6ZuTgOvnJckW-IWEWsuzbovFdY` |
| T3   | PDF | פקודת הבטיחות בעבודה (נוסח חדש) 1970        | 1.2 MB  | `1V_fVFY2zACVqd4J8X8LHy6hof7NKl5ff` |
| T3   | PDF | חוק ארגון פיקוח על העבודה 1954              | 849 KB  | `1kf1JPlsBKn1oovzBJsD9LHmkK76yLpKV` |
| T2   | PDF | עבודות בהן אין חובת מנהל-עבודה              | 193 KB  | `1JrhCa9BYaz1Q1C-Lmcbnskfchj2s-8iA` |
| T2   | PDF | פסק דין - חלוקת אחריות (כ"א/קבלן)           | 341 KB  | `1xncuDJvW074a3btizfIKdfUJoJ5WWPd8` |
| T4   | m4a | שיעור 1 אייל פלטק                           | 112 MB  | `1gArEArrc8BdQf7cGWQi5zzem7zduFyIv` |
| T4   | m4a | שיעור 3 אייל פלטק                           | 95 MB   | `1lHqZ_DrvsfY3idh_Q--_UuaZlnTTvKSZ` |
| T4   | m4a | שיעור 4 אייל פלטק                           | 168 MB  | `1ATET1uwshn-cR2QcTW7oRUysWi8uU-US` |
| T4   | m4a | שיעור 5 אייל פלטק                           | 173 MB  | `10Q7oDRG-ApzlUwWq6MnpNzRYSHUERXsg` |
| T4   | jpg | IMG-20250813/27 + IMG-20250825 (5 תמונות)   | ~1.1 MB | `1Wu8/1XoSi/1Wshc/1XZVOa/1X96D`     |

#### 📁 sub: אטל (15 קבצים)

**Folder ID**: `1Gg3ftl1AC49GSz1aniVhRVEL0Q2PA0wq`

| Tier | סוג      | שם                                    | גודל    | File ID                             |
| ---- | -------- | ------------------------------------- | ------- | ----------------------------------- |
| T2   | docx     | שיעור 2 - חוקים                       | 7.4 MB  | `1ECwl3B7kCpX8hSlfO2-NuTAnC5_MYqpv` |
| T2   | docx     | עסקים טעוני רישוי                     | 105 KB  | `1ieTVMFK0Aakx0n_iXkwvpj6DfzcNAXmw` |
| ❌   | mp4      | שיעור 1 מוקלט אטל (13.08.25) EXCLUDED | 803 MB  | `1WqkIK02EFejY21lYgKN2nj62rspb3OOK` |
| ❌   | mp4      | שיעור 2 מוקלט אטל (24.08.25) EXCLUDED | 1.5 GB  | `1Y2-sOV8s9xKgvMx6nSEB745Jg14KzVpd` |
| ❌   | mp4      | שיעור 3 מוקלט אטל (27.08.25) EXCLUDED | 898 MB  | `1XwdRcnWxdkndOeGbo-DS63T_5EZX39Zr` |
| ❌   | mp4      | שיעור 4 מוקלט אטל (03.09.25) EXCLUDED | 840 MB  | `1dX9zwv-D4nDZzZOASLgxiu7Ab8_ur8Xe` |
| T4   | jpeg/jpg | 9 תמונות WhatsApp (אוג'-ספט' 2025)    | ~1.4 MB | (9 IDs)                             |

---

## 📁 תיקייה-שורש 2: "ממונה בטיחות" (14 פריטים)

**Folder ID**: `1Cd4iydy7aqUqO6C745j9lGIsHsFXpWfH`

| Tier | סוג  | שם                                             | גודל   | File ID                                        |
| ---- | ---- | ---------------------------------------------- | ------ | ---------------------------------------------- |
| T2   | PDF  | תוכנית לימודים עם מכין תוכנית מעודכן-4         | 481 KB | `1ev2UwdnT-Cq8KD7p0RkMbATbGJtLLVQG`            |
| T1   | docx | סיכום אחרון ודי בהצלחה (2) ⭐                  | 241 KB | `1tnqszrNNAsmmRtwRsjIgs6QHyHgZ9YA3`            |
| T1   | PDF  | שאלות מוועדות הסמכה - חשמל ⭐                  | 177 KB | `1nv0HAbLzpjESjH7oLDXxLIQIbOn-261v`            |
| T2   | PDF  | Emailing חזרה להסמכה 2 (150 עמ')               | 6.3 MB | `1CgJflwPwWUHdjRx1JEtwulzB8Du8kA5v`            |
| T1   | PDF  | שאלות למבחן הסמכה - אייל ⭐                    | 730 KB | `1qbmxVzFHmhqffDyn_5_6EOy5bmfFT9GX`            |
| T1   | PDF  | שאלות למבחן הסמכה - אייל-1 ⭐                  | 784 KB | `1P7D3BWzysHyHSvitQK4ratmprVx8GUFE`            |
| T1   | PDF  | שאלות למבחן הסמכה - אייל-2 ⭐                  | 793 KB | `15ri4zo7BiMt8q9hq90NI2zNujThnOc4G`            |
| T1   | PDF  | שאלות למבחן הסמכה - אייל-3 ⭐                  | 530 KB | `1o1WV_bDpks_VW5flHlqhZnM5k8r2P4mJ`            |
| T1   | docx | לקט שאלות ותשובות למבחן הסמכה ⭐               | 312 KB | `19ZP5YxWIa2e-72VPeTgSHMP97JXQ6GOB`            |
| T2   | PDF  | דגשים                                          | 516 KB | `1CdWarGpXN1JvPCpEW06Q8CZe9sGeLRii`            |
| T1   | PDF  | שאלות לבחינת וועדה ⭐                          | 47 KB  | `1-9TTVJDSPoOWuPgYxmvPisBepjMBIlic`            |
| T1   | GDoc | שאלות לבחינת וועדה                             | 3 KB   | `1oBAi8449khJxXSMjXHkvYzyC_WOaRr1RxObC0CCljmo` |
| T1   | PDF  | Emailing שאלות למבחן ⭐                        | 885 KB | `1D-efRZrQoqq2x-8Ojn-W3o1pmIdz4qjq`            |
| T1   | PDF  | Emailing שאלות סימולציה ערוך ⭐⭐ (גדול ביותר) | 2.5 MB | `1CdpnnRPdsV02H474nbl0er480qr12SJr`            |

---

## סיכום-סטטיסטי

### לפי Tier

| Tier                          |     קבצים | גודל סה"כ |  אחוז |
| ----------------------------- | --------: | --------: | ----: |
| **T1 — Quiz Source**          | **18** ⭐ |    ~10 MB |   15% |
| **T2 — RAG Context**          |       ~52 |   ~360 MB |   42% |
| **T3 — Legal Sources**        |       ~10 |     ~6 MB |    8% |
| **T4 — Audio/Images**         |       ~45 |   ~1.9 GB |   37% |
| ❌ **EXCLUDED — Video (mp4)** |         5 |  ~4.05 GB | (out) |
| **Total (in-scope)**          |      ~125 |  ~2.45 GB |  100% |

### תיוג עם 21 פריטי-scope (content-scope.md)

תיוג ראשוני לפי שמות-קבצים (לאימות עומק אחרי-ייבוא):

| Scope ID | חוק/תקנה                                                                                                                                                 | קבצים-זוהו                                          |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 1.0      | חוק ארגון הפיקוח 1954                                                                                                                                    | 2 (m4a + PDF אייל פלטק)                             |
| 1.1      | ממונים על הבטיחות 1996                                                                                                                                   | 1 (m4a)                                             |
| 1.2      | תכנית לניהול הבטיחות 2013                                                                                                                                | 1 (PDF אבי גריפל)                                   |
| 1.3      | מסירת מידע והדרכה 1999                                                                                                                                   | 3 (m4a + PDF אייל + הזכרה ב-PDF חזרה)               |
| 2.0      | פקודת הבטיחות 1970                                                                                                                                       | 3 (2 m4a + PDF אייל)                                |
| 2.1      | עבודה בגובה 2007                                                                                                                                         | 2 (PDF דן כהן × 2)                                  |
| 2.2      | עבודות בניה 1988                                                                                                                                         | 2 (m4a + PDF "אין חובת מנהל-עבודה")                 |
| 2.3      | ציוד מגן אישי 1997                                                                                                                                       | 4 (m4a + ppt + doc + docx Q&A)                      |
| 2.4      | חשמל 1990                                                                                                                                                | 4 (docx + 2 PDFs בטיחות-חשמל + תקנות מתח-נמוך 2002) |
| 2.7      | SDS 1998                                                                                                                                                 | 3 (docx + 2 PDFs SDS)                               |
| 3.2      | רעש 1984                                                                                                                                                 | 2 (PDF רעש מזיק × 2 כפילויות)                       |
| 4.1      | חוק עבודת נשים 1954                                                                                                                                      | 1 (m4a)                                             |
| 4.3      | חוק רישוי עסקים 1968                                                                                                                                     | 2 (m4a + docx עסקים-טעוני-רישוי)                    |
| **חסר!** | 1.4 (ועדות בטיחות) · 2.5 (עזרה ראשונה) · 2.6 (עגורנאים) · 2.8 (חקלאות) · 3.1 (ניטור) · 3.3 (אבק) · 3.4 (קרינה) · 3.5 (חומרים) · 4.2 (נוער) · 4.4 (חומ"ס) | —                                                   |

⚠️ **8 מ-21 פריטי-scope חסרים תוכן-מפורש** ב-Drive — חלקם מכוסים במצגות-כלליות (PDF חזרה להסמכה 2, מצגות אייל פלטק, סיכום), אבל ייתכן צורך בהשלמה ידנית.

### תוכן שמחוץ ל-scope (יתויג `in_scope=false`)

- **חוזק חומרים** (טל גרינהויז) — לא ב-21
- **רובוטים ומערכות אוטומטיות** (טל גרינהויז) — לא ב-21
- **ריתוך, עיבוד שבבי** (מיכאל פייזל) — מקושר ל-2.7 אבל לא חוק נפרד
- **דרגנוע, מעליות** (טל גרינהויז) — מצוין ב-PDF "חזרה להסמכה 2" עמ' 46-47 אבל לא ב-21
- **מצגות כלליות גדולות** (שאדי 26MB, אייל-1 25MB) — חלקן in-scope, חלקן לא — דורש chunking + filter

---

## המלצות-ביצוע (לשבוע 1 לפי MVP-plan §10)

### עדיפות 1: Quiz Source — 18 קבצי-T1

**יעד**: כל ה-18 → `questions` table ב-Supabase תוך שבוע.

מומלץ להתחיל מ:

1. **`Emailing שאלות סימולציה ערוך.pdf`** (2.5 MB) — גדול-ביותר, סביר שכולל הכי הרבה שאלות
2. **`לקט שאלות ותשובות.docx`** (312 KB) — פורמט docx נוח לפרסור
3. **4 חלקי "אייל"** (~2.8 MB סה"כ) — מקור-יחיד עם פורמט עקבי
4. **5 מבחני שיעור (אייל פלטק)** — אם פורמט-זהה: אוטומציה מהירה

### עדיפות 2: RAG Context — 52 קבצי-T2

לכלל ה-T2: chunking לפי 21 ה-scope-IDs. כל chunk מקבל `in_scope: true|false`.

### עדיפות 3: Legal Sources — 10 קבצי-T3

10 ה-PDFs/docx של חוקים = source-of-truth ל-citation. צריך מיפוי-מדויק ל-scope ID + section number.

### עדיפות 4: Media — 50 קבצי-T4 (דחוי)

~5.5 GB אודיו+וידיאו+תמונות. לא ל-MVP. אחרי הוועדה: transcription דרך Whisper/Voice.

### גילויים-בעייתיים שצריכים החלטה

1. **כפילויות**: 2 קבצי "רעש מזיק" זהים (1.7 MB), 2 קבצי שאלות-אייל (730 KB + 783 KB) — לבדוק האם שונים-בתוכן.
2. **8 scope-IDs ללא תוכן-מפורש**: 1.4, 2.5, 2.6, 2.8, 3.1, 3.3, 3.4, 3.5, 4.2, 4.4 — צריך מקור-השלמה.
3. **תוכן out-of-scope** (חוזק חומרים, רובוטים, ריתוך): חלק מ-megen אבל לא ב-21. סימון `in_scope=false` — נשמר כ-reference, לא עולה ל-quiz.

---

## References

- ADR-005 (NotebookLM Hybrid) — scope filter
- ADR-009 (Magen Integration) — Drive Discovery
- `docs/content-scope.md` — 21 פריטי-החקיקה
- `docs/mvp-plan-2026-07-15.md` §10 — Timeline + scope-filter
- Drive root folder IDs:
  - `1pQQcc-PCzG5QXtPOspIGbThVDcDgfXSI` (ממונה בטיחות 2025)
  - `1Cd4iydy7aqUqO6C745j9lGIsHsFXpWfH` (ממונה בטיחות)
