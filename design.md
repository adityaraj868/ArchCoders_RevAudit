# RevAudit Arcade UI/UX Design Specification

## 1. Design Concept

### Pac-Man Meets Statistical Code-Review Research

RevAudit should combine:

-   1980s arcade / Pac-Man visual language
-   Open-source software culture
-   Code-review concepts
-   Statistical analysis
-   Research-dashboard clarity

The result should feel like a serious engineering/research project with
a distinctive retro identity.

**Important:** This is not a Pac-Man game website. Arcade mechanics are
visual metaphors only.

## 2. Design Philosophy

The interface should be:

-   Pixelated
-   Technical
-   Retro
-   High contrast
-   Analytical
-   Precise
-   Playful but professional
-   Easy to scan

Avoid making it look childish or like a generic student portfolio.

## 3. Color Palette

Use these exact design tokens:

  -----------------------------------------------------------------------
  Token                   Hex                     Usage
  ----------------------- ----------------------- -----------------------
  `arcade-black`          `#05050d`               Main background

  `maze-blue`             `#2121de`               Borders, maze/grid
                                                  lines, dividers

  `pacman-yellow`         `#ffeb3b`               Primary highlights,
                                                  titles, CTAs

  `blinky-red`            `#ff0000`               Team Member 1 / alerts
                                                  / H1

  `pinky-pink`            `#ffb8de`               Team Member 2 /
                                                  frontend / H2

  `inky-cyan`             `#00ffff`               Team Member 3 / backend
                                                  / H3

  `clyde-orange`          `#ffb847`               Team Member 4 / QA &
                                                  documentation /
                                                  warnings

  `pellet-white`          `#fdfdcb`               Main body text

  `terminal-dim`          `#6b7280`               Muted text / metadata
  -----------------------------------------------------------------------

Use the colors consistently. Do not turn every component into a rainbow.

## 4. Typography

### Display

Use:

`Press Start 2P`

For: - RevAudit wordmark - Main headings - Section labels - Arcade
badges - Buttons where text remains short

### Body

Prefer:

`VT323`

or

`Silkscreen`

For longer prose, use a readable standard sans-serif if the pixel font
reduces legibility.

**Rule:** Pixel typography is for identity and short UI labels, not
dense academic paragraphs.

## 5. Background

Base:

`#05050d`

Add a subtle Pac-Man maze/dot treatment.

Possible effects: - Faint maze grid - Small pellets - Pixel dots - Very
subtle CRT scanlines - Minimal pixel particles

The background must remain subordinate to content.

Do not use a constantly moving background.

## 6. Pixel-Art Assets

Use custom pixel/SVG assets for:

-   Pac-Man
-   Blinky
-   Pinky
-   Inky
-   Clyde
-   Power pellets
-   Cherries
-   Small arrows
-   Data/chart symbols

Team member avatars should use ghost-inspired pixel artwork.

Avoid copyrighted game screenshots or unnecessary reproduction of
official game assets. Prefer original pixel-art interpretations.

## 7. Arcade Cards

Component:

`.arcade-card`

Properties:

``` css
background: #0c0c1e;
border: 3px double #2121de;
border-radius: 0;
```

Optional: - Subtle CRT overlay - Pixel corner decorations - Small status
indicator

Avoid modern glassmorphism.

## 8. Pixel Buttons

Component:

`.arcade-btn`

Base visual:

``` css
box-shadow:
  4px 4px 0 #000,
  6px 6px 0 #2121de;
```

Hover: - Translate approximately `-2px` - Yellow/cyan arcade glow

Active: - Return toward original position - Reduced shadow

Buttons should remain readable and clearly interactive.

## 9. Navigation

Desktop structure:

``` text
[ REVAUDIT ]   HOME   PROJECT   TEAM   PRESENTATIONS   ARCHITECTURE   [ ADMIN ]
```

Requirements: - Dark arcade header - Pixel wordmark - Sharp separators -
Active-page pixel indicator - Minimal animation

Mobile: - Collapsed menu - Preserve the pixel wordmark - Keep navigation
easy to operate with touch

## 10. Homepage Hero

The hero should be the strongest visual section.

Concept:

``` text
                • • • • • • •

              REVAUDIT
              ────────

       STATISTICAL AUDIT OF
       CODE-REVIEW CONSISTENCY
       & WORKLOAD

   Evidence-backed analysis of
   review effort in open-source repositories.

       [ EXPLORE PROJECT ]
       [ PLANNING V1 ]

                • • • • •
```

Add a small abstract pixel animation showing data moving through a
pipeline:

``` text
GitHub → PRs → Statistics → Evidence
```

Do not implement an actual Pac-Man game.

## 11. Hero Animation

Acceptable: - Moving pellets - A small original Pac-Man-like pixel
shape - Pixel particles - Data points moving through a pipeline - Small
blinking status indicators

Avoid: - Large constant animations - Parallax-heavy effects -
Auto-playing sounds - Game mechanics - Animations that interfere with
reading

## 12. Problem Section

Section label:

`01 / THE PROBLEM`

Use three arcade cards.

### Invisible Variation

Similar PRs can receive very different review effort.

### No Baseline

Teams lack a statistical baseline for normal review effort.

### Activity Isn't Enough

Existing analytics mainly expose activity counts rather than
statistically unusual variation after relevant factors are controlled.

End with a highlighted statement:

**RevAudit turns review-effort variation into a measurable,
evidence-backed signal.**

## 13. System Pipeline

Create a pixel-terminal style architecture flow:

``` text
┌────────────┐
│   GITHUB   │
└─────┬──────┘
      ↓
┌────────────┐
│ INGESTION  │
└─────┬──────┘
      ↓
┌────────────┐
│ POSTGRESQL │
└─────┬──────┘
      ↓
┌─────────────┐
│ STATS ENGINE│
└──────┬──────┘
       ↓
┌─────────┐
│ FASTAPI │
└────┬────┘
     ↓
┌───────────┐
│ DASHBOARD │
└───────────┘
```

Each node should resemble a pixel-art terminal module.

Connections can animate subtly.

## 14. Objectives Grid

Create six arcade panels:

1.  Statistical Analysis
2.  Pattern Detection
3.  Uncertainty
4.  Validation
5.  Generalisation
6.  Explainability

Each contains: - Pixel icon - Short heading - One-sentence explanation

## 15. Team Section

Heading:

`TEAM ARCHCODERS`

Four pixel-art ghost cards.

### Dheeraj Kumar

`1024170136`

Role: `TEAM LEAD`

### Vaibhav Goyal

`1024170002`

Role: `DATA PIPELINE & STATS MODELING`

### Adityaraj Singh

`1024170148`

Role: `BACKEND & ARCHITECTURE`

### Sparsh Khandelwal

`1024170139`

Role: `FRONTEND & DOCUMENTATION`

Use the corresponding visual accent: - Dheeraj → Blinky red - Vaibhav →
Pinky pink - Adityaraj → Inky cyan - Sparsh → Clyde orange

Instructor panel:

`INSTRUCTOR`

**Dr. Sukhpal Singh**

Do not invent additional information.

## 16. Presentation Archive

Design it like an arcade high-score/archive board.

Example:

``` text
PRESENTATION ARCHIVE
────────────────────────────────

[01] PLANNING PRESENTATION
     VERSION 1.0
     [ OPEN ]

[02] PLANNING PRESENTATION
     VERSION 2.0
     [ NOT PUBLISHED ]

[03] MID-TERM
     [ NOT PUBLISHED ]
```

Only show published versions as available.

Each published entry should display: - Title - Version - Date -
Authors - Change summary - Open action

## 17. Presentation Viewer

The presentation viewer should look like an arcade cabinet/terminal
viewport while keeping academic content highly readable.

### Header

Show: - Presentation title - Version - Date - Authors

### HUD

Use visual arcade metadata such as:

``` text
SCORE: 07 / 12
LEVEL: PLANNING V1.0
TEAM: ARCHCODERS
```

Do **not** use `LIVES: 4` as application state. Team size can be
represented by `TEAM: ARCHCODERS` or a decorative ghost row.

### Navigation

Support: - Previous - Next - Keyboard `←` - Keyboard `→` - Optional
`Home` - Optional `End`

Use subtle click/transition effects. Do not require sound.

## 18. Presentation Slide Design

The presentation content itself must remain readable.

Use: - Large content area - High contrast - Limited decoration - Pixel
borders - Small arcade HUD - Clear slide number

Do not place CRT effects over dense text.

## 19. Admin Upload Terminal

The admin interface should resemble a retro command terminal.

Example:

``` text
┌─────────────────────────────────────────────┐
│ user@archcoders-admin:~$ upload              │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │                                         │ │
│ │      DROP FILE / FOLDER HERE            │ │
│ │                                         │ │
│ │            [ BROWSE ]                   │ │
│ │                                         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ TITLE                                       │
│ [_________________________________________]  │
│                                             │
│ VERSION                                     │
│ [_________________________________________]  │
│                                             │
│ RELEASE DATE                                │
│ [_________________________________________]  │
│                                             │
│ CHANGE SUMMARY                              │
│ [_________________________________________]  │
│                                             │
│ [ UPLOAD ]                  [ PUBLISH ]     │
└─────────────────────────────────────────────┘
```

Use cyan/green terminal accents.

## 20. Admin Upload States

Show clear states:

``` text
READY
↓
UPLOADING
↓
PROCESSING
↓
UPLOADED
↓
PUBLISHED
```

Failure state:

``` text
UPLOAD FAILED
[ RETRY ]
```

Success can use a restrained arcade high-score notification.

## 21. Architecture Page

Show the project's complete high-level architecture.

Include:

``` text
GitHub REST / GraphQL
        ↓
Ingestion Pipeline + CLI
        ↓
PostgreSQL
        ↓
pandas + statsmodels
        ↓
FastAPI
        ↓
React
        ↓
Hosted Dashboard
```

Separately show the website artifact flow:

``` text
Admin
  ↓
FastAPI
  ↓
S3/Object Storage
  +
Database Version Metadata
  ↓
Permanent Presentation Route
```

Use distinct colors to distinguish: - Data flow - Application/backend -
Storage - Presentation publishing

## 22. Responsive Design

### Desktop

-   Full navigation
-   Horizontal system pipeline
-   Four-column team grid where space permits
-   Large presentation viewport

### Tablet

-   Wrapped pipeline
-   Two-column cards
-   Compact navigation

### Mobile

-   Hamburger navigation
-   Single-column cards
-   Vertical system pipeline
-   Stacked team cards
-   Full-width buttons
-   Presentation viewer optimized for touch

Never shrink text until it becomes unreadable.

## 23. Motion

Use motion sparingly.

Good: - Pixel button press - Small hover shifts - Border flicker - Data
flow animation - Pellet movement - Section reveal

Avoid: - Long loading animations - Constant screen movement - Excessive
parallax - Auto-playing audio - Flashing effects that reduce
accessibility

## 24. Component System

Create reusable components.

Suggested components:

-   `PixelLogo`
-   `PixelButton`
-   `PixelCard`
-   `PixelBadge`
-   `PixelSectionHeader`
-   `PixelDivider`
-   `Navbar`
-   `Hero`
-   `ProjectOverview`
-   `ProblemCard`
-   `SystemPipeline`
-   `ObjectiveCard`
-   `TeamCard`
-   `PresentationCard`
-   `PresentationArchive`
-   `PresentationViewer`
-   `PresentationHUD`
-   `AdminUploadPanel`
-   `UploadStatus`
-   `Footer`

Avoid duplicating the same pixel-card/button styles across pages.

## 25. Visual Hierarchy

Priority order:

1.  RevAudit identity
2.  Project purpose
3.  Main navigation
4.  Project content
5.  Presentation access
6.  Team
7.  Technical details
8.  Decorative arcade elements

The theme must never overpower the project.

## 26. Accessibility

Maintain: - Strong contrast - Visible keyboard focus - Keyboard
navigation - Readable body text - Reduced-motion consideration - Text
labels in addition to color indicators - No essential information
conveyed solely through animation

## 27. Content Integrity

Do not invent: - Statistical results - Dataset results - Completed
experiments - Performance metrics - Additional team credentials -
Additional team roles - Features that have not been implemented

Use future-oriented language for planned work.

For example:

**Correct:**\
"RevAudit will evaluate detected patterns using controlled injected
shifts."

**Incorrect before implementation:**\
"RevAudit successfully detects process shifts with 95% precision."

## 28. Core Design Rule

**The pixel theme is the identity, not the content.**

A visitor should immediately recognize the Pac-Man-inspired aesthetic,
but within a few seconds should also understand:

**RevAudit is a statistical research/engineering project for auditing
variation in code-review effort.**
