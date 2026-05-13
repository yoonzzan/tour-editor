---
name: HanaHub Design System
version: 1.0.0
description: Single source of truth for HanaHub intranet ERP UI — tokens, patterns, and agent-facing rules.
repository:
  design_md: tracked_with_repo
  note: Commit DESIGN.md with the app; do not add to .gitignore. Large auxiliary trees (e.g. presentation/) may land in a separate PR for reviewability.
token_authority:
  must_use_semantic_keys: true
  hex_in_yaml_only: true
  sources:
    portal_legacy: Extracted portal CSS tokens (text/surface/border + legacy spacing). Prefer for matching legacy screens.
    erp_contract: Intranet ERP extension tokens (action, grid, chrome, status, ERP spacing). Prefer for new components and AI-generated UI.
    nexacro_common_css: Nexacro application 공통 CSS (e.g. `.Button.btn_WF_Save`, `.Button.btn_WF_Search`, `.Grid`, `.Grid.grd_WF_PK_*`, `.Button.button_Type_Main_Tabbutton*`). Canonical for primary action ladder, grid chrome, toolbar focus colors, **WF_PK** wizard/detail accents, and scroll-container gutters in YAML.
    nexacro_hub_portal_css: Nexacro **HUB_*** / **RF_HUB_UTILITY** 등 포털·가입·메시지·예약체크·항공 서브 스킨 CSS. Canonical for **`color.hub.*`**, **`color.segmented.*`**, **`color.calendar.*`**, **`color.verticalAir.*`**, **`color.border.widget`**, **`color.surface.exchangeHighlight`**, and **`shadow.popover`** / **`shadow.widgetSoft`** where they differ from ERP-only tokens.
tokens:
  color:
    text:
      primary: "#435059"
      secondary: "#3c4b61"
      inverse: "#999999"
    surface:
      muted: "#ffffff"
      raised: "#f4f7fb"
      strong: "#708a96"
      base_legacy: "#000000"
      exchangeHighlight: "#fffff9"
    border:
      muted: "#949daa"
      strong: "#8e9a9f"
      widget: "#becacf"
    action:
      primary: "#00C6D0"
      primaryBorder: "#00A6B0"
      primaryHover: "#009199"
      primaryHoverBorder: "#08868F"
      primaryActive: "#00545E"
      primaryActiveBorder: "#08868F"
      onPrimary: "#FFFFFF"
    primary_scale:
      "50": "#E6FAFC"
      "100": "#CCF5F8"
      "500": "#00C6D0"
      "600": "#009199"
      "700": "#00545E"
    neutral:
      "0": "#FFFFFF"
      "50": "#FAFAFA"
      "100": "#F5F5F5"
      "200": "#EEEEEE"
      "300": "#D9D9D9"
      "500": "#888888"
      "700": "#444444"
      "900": "#222222"
    grid:
      header: "#EDF1F5"
      selectedRow: "#D8F6F8"
      border: "#C8D0D6"
      frameBorder: "#949DA0"
      columnDivider: "#C4CDD0"
      headerBottomRule: "#333333"
      detailBorder: "#D4DDE0"
      treeGuideDotted: "#999999"
      rowHoverPk: "#D1F5F7"
      detailSectionBand: "#F3FCFD"
    focus:
      ring: "#CCF5F8"
      inputUnderline: "#242C36"
      comboBorder: "#232631"
    chrome:
      topBarBackground: "#FFFFFF"
      sidebarBackground: "#222222"
      sidebarText: "#FFFFFF"
      sidebarItemHover: "#333333"
    status:
      success: "#4CAF50"
      warning: "#FF9800"
      danger: "#F44336"
    section:
      yellow: "#FFF7D6"
      pink: "#FCE8EF"
    semantic:
      link: "#2196F3"
      linkOnLight: "#1976D2"
    hub:
      joinAccent: "#EE6B78"
      joinAccentHover: "#FE7B88"
      joinAccentActive: "#DE5B68"
      joinAccentDisabled: "#F1AFB6"
    segmented:
      idleBackground: "#ECEEF1"
      idleText: "#777777"
      selectedBackground: "#00A6B0"
      selectedText: "#FFFFFF"
    calendar:
      laneCoolBackground: "#ECF8FC"
      laneCoolText: "#37A8D6"
      laneWarmBackground: "#FEF3F2"
      laneWarmText: "#F6695E"
    verticalAir:
      gridHeader: "#9B7C3A"
      gridHeaderCellBorder: "#AF944F"
      tabActive: "#823A52"
      tabInactive: "#AF944F"
      bodyBackground: "#FEFCF9"
      bodyText: "#2F2F2F"
      bodyRowBorder: "#EBE9E4"
    pk:
      mainTabOn: "#10B7C0"
      stepIndicatorOn: "#FF4337"
      confirmFace: "#D75E9B"
      confirmBorder: "#C74E8B"
      waitFace: "#4E8ABD"
      waitBorder: "#3E7AAD"
      progressText: "#0D86DA"
    overlay:
      scrim: "rgba(0,0,0,0.45)"
    shadow:
      raised: "0 1px 3px rgba(0,0,0,0.12)"
      popover: "5px 5px 15px rgba(0,0,0,0.2)"
      widgetSoft: "0 0 5px rgba(234,234,234,1)"
  spacing:
    erp:
      xs: 4px
      sm: 8px
      md: 12px
      lg: 16px
      xl: 24px
      xxl: 32px
    portal_legacy:
      "1": 3px
      "2": 5px
      "3": 7px
      "4": 8px
      "5": 23px
      "6": 25px
      "7": 33px
  radius:
    xs: 3px
    sm: 4px
    md: 5px
    erp_sm: 2px
    erp_md: 4px
    erp_lg: 8px
  typography:
    fontFamily:
      primary: "NanumGothic"
      stack: 'NanumGothic, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
    fontSize:
      xs: 10px
      sm: 11px
      md: 12px
      lg: 13px
      xl: 14px
      "2xl": 15px
      "3xl": 16px
      "4xl": 35px
    fontWeight:
      base: 400
      emphasis: 500
      label: 700
    lineHeight:
      base: normal
      compact: 18px
      form: 21px
  layout:
    policy: full_width_erp
    mainMaxWidth: none
    shell:
      globalNavHeight: 60px
      sidebarWidth: 240px
    section:
      collapsedHeight: 45px
      baseExpandedHeight: 50px
      lineIncrement: 24px
      oneLine: 74px
      twoLine: 98px
      threeLine: 122px
      fourLine: 146px
      fiveLine: 170px
      sixLine: 194px
    customer360:
      legacyFrameWidth: 282px
      legacyFrameHeight: 876px
      formWidth20190411: 320px
      formHeight20190411: 876px
      padding20190411: 15px
    nexacro:
      scrollbarGutter: 14px
    popup:
      titleBarHeight: 32px
  motion:
    durationFast: 120ms
    durationNormal: 200ms
    easingStandard: "cubic-bezier(0.4, 0, 0.2, 1)"
  zIndex:
    base: 0
    stickyHeader: 100
    dropdown: 1000
    modalBackdrop: 4000
    modal: 5000
    toast: 8000
  typeRoles:
    PageTitle: { fontSize: 16px, fontWeight: 700, lineHeight: 24px }
    SectionTitle: { fontSize: 14px, fontWeight: 700, lineHeight: 21px }
    FormLabel: { fontSize: 12px, fontWeight: 700, lineHeight: 18px }
    FormValue: { fontSize: 13px, fontWeight: 400, lineHeight: 21px }
    GridHeader: { fontSize: 12px, fontWeight: 700, lineHeight: 18px }
    GridCell: { fontSize: 12px, fontWeight: 400, lineHeight: 18px }
    ButtonText: { fontSize: 12px, fontWeight: 700, lineHeight: 18px }
    BadgeText: { fontSize: 12px, fontWeight: 700, lineHeight: 18px }
    HelperText: { fontSize: 11px, fontWeight: 400, lineHeight: 18px }
  components:
    button:
      height: 28px
      minWidth: 64px
      paddingX: 12px
      gap: 4px
      borderWidth: 1px
      display: inline-flex
      alignItems: center
      justifyContent: center
      whiteSpace: nowrap
    input:
      height: 28px
      paddingX: 8px
      borderWidth: 1px
    searchPanel:
      background: "neutral.100"
      border: "1px solid color.grid.border"
      padding: 12px
      rowGap: 8px
      columnGap: 8px
    actionToolbar:
      display: flex
      justifyContent: flex-end
      gap: 6px
      marginNearGridMin: 8px
      marginNearGridMax: 12px
    statusBadge:
      minHeight: 22px
      padding: 2px 7px
      borderRadius: 2px
    grid:
      cellPadding: 8px 10px
      headerFixed: true
      horizontalScroll: allowed
    popup:
      footerPrimaryRight: true
      escapeClosesUnlessDirty: true
components_catalog:
  layout: [AppShell, GlobalNavigationBar, LeftNavigationBar, WorkspaceTabs, PageHeader, MainContent, UtilitySidebar, GlobalPopupLayer]
  form: [SearchPanel, SearchField, DateRangePicker, CodeSelect, RequiredLabel, TextAreaField, RadioStatusGroup]
  action: [ActionToolbar, SearchButton, SaveButton, DeleteButton, PrintButton, ExportExcelButton, GridSettingsButton, PersonalizationButton, DataMaskingToggle, AddButton, DetailViewButton]
  grid: [ResultGrid, EditableGrid, GridToolbar, GridContextMenu, GridPersonalizationMenu, GridEmptyState, GridSummaryRow]
  state: [StatusBadge, AlertBanner, LoadingState, EmptyState, ErrorState, PermissionStatus]
  popup: [PopupShell, SearchPopup, SelectionPopup, EditPopup, ConfirmPopup, HelpPopup, AIPopup, BulkActionPopup]
  ai: [AIWidget, AISummaryPanel, AIRecommendationPanel, AIRiskDetector, AIItinerarySuggestionPanel]
---

# HanaHub Design System

**Visual preview:** Open [`DESIGN.preview.html`](DESIGN.preview.html) in a browser. It must stay in sync with the `tokens` block in this file’s YAML frontmatter (hex colors, section tints, semantic link, scrim/shadow strings, motion/z-index, **`color.pk.*`**, **`color.hub.*`**, **`color.segmented.*`**, **`color.calendar.*`**, **`color.verticalAir.*`**, **`color.border.widget`**, **`color.surface.exchangeHighlight`**, extended grid detail/hover/tree tokens, and **`layout.nexacro.scrollbarGutter`** mirrored as CSS).

**Reference screenshot (ground truth):** [`assets/reference/hanahub-ui-reference.png`](assets/reference/hanahub-ui-reference.png)

## Table of contents

1. [Overview](#1-overview)
2. [Token authority](#2-token-authority)
3. [Color](#3-color)
4. [Typography](#4-typography)
5. [Layout and app shell](#5-layout-and-app-shell)
6. [Elevation and shape](#6-elevation-and-shape)
7. [Patterns](#7-patterns)
   - [Task popups (working modals)](#task-popups-working-modals)
8. [Components summary](#8-components-summary)
9. [Accessibility](#9-accessibility)
10. [Responsive behavior](#10-responsive-behavior)
11. [Do’s and don’ts](#11-dos-and-donts)
12. [Agent cheat sheet](#12-agent-cheat-sheet)
13. [References and QA checklist](#13-references-and-qa-checklist)
14. [Standard copy, validation, and data formatting](#14-standard-copy-validation-and-data-formatting)
15. [Motion, layering, and YAML component keys](#15-motion-layering-and-yaml-component-keys)
16. [Nexacro engine vs web (공통 + WF_PK extract)](#16-nexacro-engine-vs-web-공통--wf_pk-extract)

---

## 1. Overview

**Mission:** Provide implementation-ready, token-driven UI guidance for HanaHub that stays consistent, accessible, and fast to ship across the **enterprise intranet dashboard** ([https://portal.hanatour.com/](https://portal.hanatour.com/)).

**Product context:** HanaHub is a **high-density desktop ERP** covering hotel, flight, package, settlement, customer, admin, sales-support, and BI domains. Screens emphasize search, grids, popups, permissions, and auditability — not marketing storytelling.

**Design intent (must drive all UI decisions):**

- Fast search and filter workflows.
- Tabular scanning with clear headers, zebra rows, and selection affordances.
- Explicit status recognition (badge + text; never color-only).
- Safe business actions; destructive actions visually separated.
- Permission and data-masking rules respected.
- Repeatable **AppShell** and page patterns (list, detail, dashboard).

**Avoid (must not ship as default HanaHub UI):**

- Consumer travel landing pages, hero marketing layouts, decorative card grids replacing data grids.
- Generic SaaS “insight cards” as the primary work surface for operational lists.
- Mobile-first app navigation patterns for core ERP desks.
- Icon-only critical actions.
- AI output mixed into persisted business data without separation and explicit apply/cancel.

---

## 2. Token authority

| Rule | Severity |
|------|----------|
| Component specs **must** reference **semantic token keys** from this file’s YAML (e.g. `color.action.primary`), not raw hex in prose. | must |
| **New** layouts and components **must** use `tokens.spacing.erp` and ERP radii (`radius.erp_*`) unless explicitly matching a legacy screen. | must |
| Legacy portal screens **may** use `tokens.spacing.portal_legacy` and legacy `radius.xs|sm|md` until migrated. | should |
| `color.surface.base_legacy` is a **portal-extracted label**; for dark regions **must** prefer `color.chrome.*` in new specifications. | must |
| When portal and ERP tokens disagree, use the **Resolved** column in section 3 tables and update YAML in both this file and `DESIGN.preview.html`. | must |
| Where `nexacro_common_css` lists a hex for the same role (primary buttons, `.Grid` frame), that value **must** win over older approximations (e.g. Material `#00BCD4`). | must |

**Conflict resolution (defaults):**

- **Primary CTA / search / save:** `color.action.primary` + `color.action.primaryBorder` — ladder from Nexacro `btn_WF_Save` / `btn_WF_Search` (default → hover → pushed); matches live intranet controls.
- **Grid chrome:** `color.grid.header`, `color.grid.selectedRow`, `color.grid.border` plus **frame/column tokens** (`frameBorder`, `columnDivider`, `headerBottomRule`) for Nexacro-accurate grid lines.
- **Chrome:** `color.chrome.*` for top bar and left sidebar regions.
- **Keyboard focus (new implementations):** `color.focus.ring` for `focus-visible` rings; toolbar patterns may use `color.focus.inputUnderline` / `color.focus.comboBorder` where applicable.
- **PK / package wizard:** Top main tab “on” state uses `color.pk.mainTabOn` (**#10B7C0**), **not** the same hex as global Search/Save primary (`color.action.primary` **#00C6D0**). Do not merge the two when matching legacy PK screens.
- **HUB / portal skins (`nexacro_hub_portal_css`):** Join and message CTAs use **`color.hub.joinAccent*`** (coral), **not** `color.action.primary`. Segmented toggles (예약 체크 등) use **`color.segmented.*`**. Optional verticals: calendar lane tints **`color.calendar.*`**, 항공 번들 **`color.verticalAir.*`**, popovers **`shadow.popover`** / soft widgets **`shadow.widgetSoft`**.

### Nexacro engine baseline (application 공통 CSS)

The runtime stylesheet sets **layout and interaction defaults** that **must not** be copied verbatim to accessible web apps:

| Engine behavior | Typical CSS | Web / React guidance |
|-----------------|-------------|----------------------|
| Full-viewport absolute layout | `html, body` + `div` `position:absolute; width/height:100%` | Use normal flow + flex/grid; absolute only for overlays/tooltips. |
| Global `outline: none` on `div` | `div { outline:none; }` | **Must** restore `:focus-visible` on real focus targets (buttons, links, inputs, grid cells with `tabIndex`). |
| Text selection off | `user-select: none` on `html, body` and many `div`s | **Must not** disable selection on readable paragraphs, grid text, or inputs; Nexacro does this for drag-selection UX. |
| Scroll container insets | `.nexacontainer.withvscroll` `right:14px`, `.withhscroll` `bottom:14px`, `.withbothscroll` both | Reserve **`layout.nexacro.scrollbarGutter`** (14px) when reproducing split layouts next to native scrollbars. |
| Textarea scrollbars hidden | `textarea::-webkit-scrollbar { display:none; }` | **Do not** hide scrollbars without an alternative; use visible scroll or design within height. |
| Tree guide line | `.celltreeline` `1px dotted #999999` | Map to `color.grid.treeGuideDotted` for tree/grid guides in mocks. |

**Font note:** Some builds set `html, body` to **12pt Verdana** while component rules use **NanumGothic**. New web UI **must** use `typography.fontFamily.stack` consistently; do not mix Verdana as the default body font for ERP parity unless explicitly matching a legacy capture.

---

## 3. Color

### Text

| Token | Hex | Role |
|-------|-----|------|
| `color.text.primary` | `#435059` | Default body and grid cell text (portal legacy). |
| `color.text.secondary` | `#3c4b61` | Secondary labels, metadata. |
| `color.text.inverse` | `#999999` | Muted / placeholder-adjacent on light surfaces. |

### Surfaces

| Token | Hex | Role |
|-------|-----|------|
| `color.surface.muted` | `#ffffff` | Cards, inputs, modal surfaces. |
| `color.surface.raised` | `#f4f7fb` | Search panels, subtle section bands. |
| `color.surface.strong` | `#708a96` | Strong fills / accents (use sparingly). |
| `color.surface.base_legacy` | `#000000` | Legacy key only; **do not** treat as default text. Prefer `color.chrome.sidebarBackground` for dark chrome. |
| `color.surface.exchangeHighlight` | `#FFFFF9` | Very soft warm tint for utility readouts (e.g. RF hub exchange-rate panel in Nexacro `RF_HUB_UTILITY`). |

### Chrome (global frame)

| Token | Hex | Role |
|-------|-----|------|
| `color.chrome.topBarBackground` | `#FFFFFF` | Top global navigation bar background. |
| `color.chrome.sidebarBackground` | `#222222` | Left navigation column (`neutral.900`). |
| `color.chrome.sidebarText` | `#FFFFFF` | Sidebar labels and icons (with accessible contrast). |
| `color.chrome.sidebarItemHover` | `#333333` | Sidebar row hover background. |

**Popup title bar (Nexacro parity — must):** Modal **window chrome** (the bar above the white content in captures such as [`assets/reference/hanahub-ui-reference.png`](assets/reference/hanahub-ui-reference.png)) is **not** a light `PageHeader`. It **must** use **`color.chrome.sidebarBackground`** as fill, **`color.chrome.sidebarText`** for title and default close affordance, and **`color.chrome.sidebarItemHover`** for the close control hover hit area. Target height **`layout.popup.titleBarHeight`** (32px); title typography **`SectionTitle`** (or **`PageTitle`** for rare full-width chrome). Close **must** remain keyboard-focusable with **`color.focus.ring`** on `:focus-visible` (ring may sit on dark — ensure visible contrast).

### Borders (portal legacy)

| Token | Hex | Role |
|-------|-----|------|
| `color.border.muted` | `#949daa` | Default dividers, light chrome borders. |
| `color.border.strong` | `#8e9a9f` | Emphasized borders. |
| `color.border.widget` | `#becacf` | Light widget chrome (join/message panels, Nexacro `HUB_*` borders) — **lighter** than `color.border.muted`; use for 1px frames around dense widgets, not main app dividers. |

### Action (ERP) — Nexacro primary ladder

| Token | Hex | Role |
|-------|-----|------|
| `color.action.primary` | `#00C6D0` | Primary face: Search, Save, Apply (default / keyboard focused in Nexacro). |
| `color.action.primaryBorder` | `#00A6B0` | 1px border for default and focused primary buttons. |
| `color.action.primaryHover` | `#009199` | Hover / mouseover background (`status=mouseover`). |
| `color.action.primaryHoverBorder` | `#08868F` | Hover border; also pressed-state border. |
| `color.action.primaryActive` | `#00545E` | Pressed / `userstatus=pushed` background. |
| `color.action.primaryActiveBorder` | `#08868F` | Pressed border. |
| `color.action.onPrimary` | `#FFFFFF` | Text/icons on primary buttons. |

### Grid — frame and header rules (Nexacro `.Grid`)

| Token | Hex | Role |
|-------|-----|------|
| `color.grid.header` | `#EDF1F5` | Header cell background (`.Grid .head .row .cell`). |
| `color.grid.selectedRow` | `#D8F6F8` | Selected row highlight (unchanged from ERP contract). |
| `color.grid.border` | `#C8D0D6` | General light grid / panel dividers; SearchPanel borders in new UI. |
| `color.grid.frameBorder` | `#949DA0` | Outer **DataGrid** frame (`1px solid` on `.Grid`). |
| `color.grid.columnDivider` | `#C4CDD0` | Vertical rule between header cells. |
| `color.grid.headerBottomRule` | `#333333` | Strong **bottom** border under header row. |
| `color.grid.detailBorder` | `#D4DDE0` | Detail / form table rules (`.Grid.grd_WF_PK_Detail` body + label borders in Nexacro PK theme). |
| `color.grid.treeGuideDotted` | `#999999` | Tree line guide (`.celltreeline` dotted). |
| `color.grid.rowHoverPk` | `#D1F5F7` | PK detail grid row hover / selected tint (Nexacro `#nexacontainer .Grid.grd_WF_PK_Detail .body .row .cell[status=focused]` family). |
| `color.grid.detailSectionBand` | `#F3FCFD` | Soft section band on PK static rows (e.g. `.Static.sta_WF_PK_Detail_B`). |

### PK / WF_PK (package builder) accents

Use **`color.pk.*`** for **wizard / PK** components. These are **intentionally separate** from the global ERP primary ladder (`color.action.*`).

| Token | Hex | Role |
|-------|-----|------|
| `color.pk.mainTabOn` | `#10B7C0` | Main workspace tab **selected** (`.Button.button_Type_Main_Tabbutton_On`) — slightly greener than `color.action.primary`. |
| `color.pk.stepIndicatorOn` | `#FF4337` | Step indicator “active” pill (`.Static.sta_WF_PK_Step_On`). |
| `color.pk.confirmFace` | `#D75E9B` | Pink confirm-style button face (`.Button.btn_WF_PK_Confirm`). |
| `color.pk.confirmBorder` | `#C74E8B` | Matching border. |
| `color.pk.waitFace` | `#4E8ABD` | Blue “wait” action face (`.Button.btn_WF_PK_Wait`). |
| `color.pk.waitBorder` | `#3E7AAD` | Matching border. |
| `color.pk.progressText` | `#0D86DA` | Progress / emphasis text in calendar subcells (`.subcell.grd_WF_PK_Progress`); distinct from `color.semantic.link` **#2196F3**. |

**Related legacy class names (for grep / porting):** `button_Type_Main_Tabbutton`, `sta_WF_PK_Step`, `grd_WF_PK_Detail`, `btn_WF_PK_Confirm`, `btn_WF_PK_Wait`, `btn_WF_PK_Masking` (masking uses `color.surface.strong` **#708A96** + border **#617B88** — already in YAML as strong + custom border in CSS).

### HUB portal, segmented control, calendar lanes, vertical air (`nexacro_hub_portal_css`)

Use these when matching **Nexacro `HUB_*`**, **`RF_HUB_UTILITY`**, 예약 체크, 항공 서브, or similar portal-only skins. They **do not** replace the global ERP primary ladder for Search/Save.

#### Join / message accent (coral)

| Token | Hex | Role |
|-------|-----|------|
| `color.hub.joinAccent` | `#EE6B78` | Default face + border for join/submit-style buttons (e.g. `.Button.btn_WF_HUB_JOIN_Submit`). |
| `color.hub.joinAccentHover` | `#FE7B88` | Hover / mouseover. |
| `color.hub.joinAccentActive` | `#DE5B68` | Pressed / focused-push. |
| `color.hub.joinAccentDisabled` | `#F1AFB6` | Disabled submit tint. |

**Must:** Do not substitute `color.action.primary` for these controls when the legacy skin is coral — parity and contrast paths differ.

#### Segmented control (idle / selected)

| Token | Hex | Role |
|-------|-----|------|
| `color.segmented.idleBackground` | `#ECEEF1` | Unselected segment background. |
| `color.segmented.idleText` | `#777777` | Unselected segment label. |
| `color.segmented.selectedBackground` | `#00A6B0` | Selected segment (aligns with `color.action.primaryBorder`). |
| `color.segmented.selectedText` | `#FFFFFF` | Selected segment label. |

#### Calendar lane tints (optional)

| Token | Hex | Role |
|-------|-----|------|
| `color.calendar.laneCoolBackground` | `#ECF8FC` | Cool lane band background. |
| `color.calendar.laneCoolText` | `#37A8D6` | Cool lane emphasis text. |
| `color.calendar.laneWarmBackground` | `#FEF3F2` | Warm lane band background. |
| `color.calendar.laneWarmText` | `#F6695E` | Warm lane emphasis text. |

#### Vertical air module (optional — gold / sand)

| Token | Hex | Role |
|-------|-----|------|
| `color.verticalAir.gridHeader` | `#9B7C3A` | Air sub-grid header fill. |
| `color.verticalAir.gridHeaderCellBorder` | `#AF944F` | Header cell borders. |
| `color.verticalAir.tabActive` | `#823A52` | Active tab / wine accent. |
| `color.verticalAir.tabInactive` | `#AF944F` | Inactive tab stroke. |
| `color.verticalAir.bodyBackground` | `#FEFCF9` | Sand body background. |
| `color.verticalAir.bodyText` | `#2F2F2F` | Body text on sand. |
| `color.verticalAir.bodyRowBorder` | `#EBE9E4` | Row / panel rules on sand. |

**Related legacy patterns (for grep):** `btn_WF_HUB_JOIN_*`, `HUB_JOIN`, `HUB_SALES`, `HUB_MESSAGE`, `HUB_RESERVATION_CHECK`, `HUB_AIR_SUB`, `RF_HUB_UTILITY`.

### Focus (replace legacy `outline: none`)

| Token | Hex | Role |
|-------|-----|------|
| `color.focus.ring` | `#CCF5F8` | Default **focus-visible** ring fill (`primary_scale.100`); use **2px** `outline` (or box-shadow) + **2px** offset on new web stacks — never remove focus without a replacement. |
| `color.focus.inputUnderline` | `#242C36` | Toolbar-style search field focus (Nexacro `edi_TF_Search[status=focused]` bottom border). |
| `color.focus.comboBorder` | `#232631` | Combo focus border (Nexacro `cmb_LF_Link[status=focused]`). |

### Status (semantic)

| Token | Hex | Role |
|-------|-----|------|
| `color.status.success` | `#4CAF50` | Success / complete. |
| `color.status.warning` | `#FF9800` | Warning / waiting. |
| `color.status.danger` | `#F44336` | Error / destructive / restricted. |

### Section tints

| Token | Hex | Role |
|-------|-----|------|
| `color.section.yellow` | `#FFF7D6` | Highlight band, notice blocks. |
| `color.section.pink` | `#FCE8EF` | Soft alert / info band. |

### Semantic link (body / inline)

| Token | Hex | Role |
|-------|-----|------|
| `color.semantic.link` | `#2196F3` | Inline links, “more” actions in prose (Nexacro `sta_WF_TxtBlue` lineage). |
| `color.semantic.linkOnLight` | `#1976D2` | Darker link on very light tints when contrast needs a step. |

**Must:** Do not use `color.action.primary` for inline hyperlinks in long-form help or grid footers — reserve the cyan ladder for **primary buttons** and strong CTAs; use `color.semantic.link*`.

### Overlay and shadow (string tokens — not hex swatches)

| Token | Value | Role |
|-------|-------|------|
| `color.overlay.scrim` | `rgba(0,0,0,0.45)` | Modal / drawer backdrop. |
| `shadow.raised` | `0 1px 3px rgba(0,0,0,0.12)` | Cards, floating panels, default elevation. |
| `shadow.popover` | `5px 5px 15px rgba(0,0,0,0.2)` | Deeper floating panels / message popovers (Nexacro hub message center pattern). |
| `shadow.widgetSoft` | `0 0 5px rgba(234,234,234,1)` | Subtle halo around compact widgets / cards where `shadow.raised` is too strong. |

---

## 4. Typography

**Font stack (must):** `typography.fontFamily.stack` — primary **NanumGothic** for parity with portal extraction; fallbacks as listed in YAML.

**Density (must):** Default UI is **compact**. Body defaults to `fontSize.md` (12px) in dense panels; form values commonly `fontSize.lg` (13px) per ERP form spec in the extended catalog.

### Role mapping (portal scale)

| Role | Token size | Weight | Typical use |
|------|------------|--------|-------------|
| Caption | `fontSize.xs`–`sm` | 400 | Timestamps, table meta. |
| Body | `fontSize.md` | 400 | Dense table body, help text. |
| Body emphasis | `fontSize.lg` | 400–500 | Form values, subheadings. |
| Toolbar / button | `fontSize.sm`–`md` | 700 | Button text (see extended Button spec). |
| Section title | `fontSize.xl`–`3xl` | 500–700 | PageHeader, modal titles. |
| Hero / rare marketing | `fontSize.4xl` | 400 | Avoid in core ERP; dashboards only if approved. |

**Principles (must):**

- Maintain WCAG **2.2 AA** contrast for text and interactive states.
- Heading order must be logical (`h1` → `h2` → `h3`); do not skip levels for styling alone.
- Do not use color alone to convey status; pair with label or icon.

### Enterprise type roles (YAML `typeRoles` — must match Figma/CSS)

These are **fixed** size/weight/line-height tuples for ERP density. Prefer referencing the role name in specs (e.g. “FormLabel”) rather than retyping px.

| Role | `fontSize` | `fontWeight` | `lineHeight` | Typical control |
|------|------------|--------------|----------------|-----------------|
| `PageTitle` | 16px | 700 | 24px | PageHeader title |
| `SectionTitle` | 14px | 700 | 21px | SectionGroup header |
| `FormLabel` | 12px | 700 | 18px | SearchPanel / form labels |
| `FormValue` | 13px | 400 | 21px | Input value, read-only detail |
| `GridHeader` | 12px | 700 | 18px | ResultGrid column titles |
| `GridCell` | 12px | 400 | 18px | Dense table body |
| `ButtonText` | 12px | 700 | 18px | All button variants |
| `BadgeText` | 12px | 700 | 18px | StatusBadge |
| `HelperText` | 11px | 400 | 18px | Hints, inline validation |

**Font family (must):** All roles use `typography.fontFamily.stack` unless a monospace column explicitly uses `typography.fontFamily.mono`.

---

## 5. Layout and app shell

**Layout policy (must):** `layout.policy: full_width_erp` — primary workspaces are **full width** inside the shell. Do **not** default to a 1200px marketing container for operational screens.

### App shell (must)

All full intranet pages **must** assume this structure:

```txt
AppShell
 ├── GlobalNavigationBar
 ├── LeftNavigationBar
 ├── WorkspaceTabs
 ├── PageHeader
 ├── MainContent
 ├── UtilitySidebar
 └── GlobalPopupLayer
```

- **GlobalNavigationBar:** Domain modules (Hotel, Flight, Package, …). Use `color.chrome.topBarBackground` and `color.text.primary`.
- **LeftNavigationBar:** Module tree; use `color.chrome.sidebarBackground` and `color.chrome.sidebarText`.
- **WorkspaceTabs:** Multiple concurrent business screens.
- **PageHeader:** Breadcrumb, title, refresh, help.
- **MainContent:** List/detail/dashboard pattern area.
- **UtilitySidebar:** Context tools (customer 360, clipboard, etc.) when domain requires it.
- **GlobalPopupLayer:** Modals, confirmations, AI panels — must not be drawn only inside a nested card without overlay semantics.

**Shell dimensions (should):** Use `layout.shell.globalNavHeight` (~60px) and `layout.shell.sidebarWidth` (~240px) as starting points; tune per implementation.

**Nexacro scroll gutter (should):** When aligning split panes with legacy scroll areas, reserve **`layout.nexacro.scrollbarGutter`** (14px) — matches `.nexacontainer.withvscroll` / `.withhscroll` / `.withbothscroll` in application 공통 CSS.

### SectionGroup vertical rhythm (Customer 360 / detail stacks)

Heights below are **content band** targets for a single SectionGroup row (header + body). Use `layout.section.collapsedHeight` for header-only; add `layout.section.lineIncrement` per extra summary line.

| Key | Token path | Value | Use |
|-----|------------|-------|-----|
| Collapsed | `layout.section.collapsedHeight` | 45px | Icon + one-line title only. |
| Base expanded | `layout.section.baseExpandedHeight` | 50px | Title + one KPI line. |
| Line step | `layout.section.lineIncrement` | 24px | Each additional wrapped summary line. |
| Presets | `layout.section.oneLine` … `sixLine` | 74px–194px | Named presets = base + N×line increment (see YAML). |

### Customer 360 legacy frame (reference only)

| Key | Value | Note |
|-----|-------|------|
| `layout.customer360.legacyFrameWidth` | 282px | Legacy portal embed width — new web **may** differ but keep density comparable. |
| `layout.customer360.legacyFrameHeight` | 876px | Typical viewport-relative height in reference screens. |
| `layout.customer360.formWidth20190411` | 320px | Fixed-width form column in older specs. |
| `layout.customer360.padding20190411` | 15px | Inner padding for that column. |

---

## 6. Elevation and shape

### Radius

| Token | Value | Use |
|-------|-------|-----|
| `radius.erp_sm` | 2px | ERP buttons, dense inputs (default ERP spec). |
| `radius.erp_md` | 4px | Cards, modals, larger inputs. |
| `radius.erp_lg` | 8px | Drawers, large containers. |
| `radius.xs`–`radius.md` | 3–5px | **Legacy portal** components until migrated. |

### Elevation (must: minimal, functional)

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat | border only (`color.grid.border` / `color.border.muted`) | Inputs, inline rows. |
| Raised | `shadow.raised` | Cards, default floating panels. |
| Popover | `shadow.popover` | Deeper float (hub message / tooltip-style panels). |
| Widget soft | `shadow.widgetSoft` | Subtle halo around compact bordered widgets. |
| Overlay | `color.overlay.scrim` + raised modal surface | `PopupShell`, drawers |

Shadows **must** stay subtle; separation in ERP comes from borders, grid lines, and section tints — not heavy material elevation.

---

## 7. Patterns

### ListPage (search + grid)

```txt
ListPage
 ├── SearchPanel
 ├── ActionToolbar
 └── ResultGrid
```

**Rules (must):**

- SearchPanel is top; **SearchButton** is **right-aligned** in the panel.
- ResultGrid is the primary work area.
- Include **GridSettingsButton**, **PersonalizationButton**, **ExportExcelButton** when showing tabular business data.
- Include **DataMaskingToggle** when personal or sensitive data exists.

### DetailPage

```txt
DetailPage
 ├── SummaryHeader
 ├── SectionTabs
 ├── SectionGroup[]
 └── ActionToolbar
```

**Rules (must):** Group by business meaning; collapsible **SectionGroup**; **Save** / **Delete** / **Print** / **History** in ActionToolbar; **Delete** must use danger styling.

### DashboardPage

```txt
DashboardPage
 ├── KPIWidget[]
 ├── ChartWidget[]
 ├── ResultGrid?
 └── AIWidget?
```

**Rules (must):** Cards only for KPI/status summaries; drill-down lists stay in **ResultGrid**; no decorative-only card walls for operational data.

### Task popups working modals

**Definition (must):** A **task popup** is any **PopupShell** in **GlobalPopupLayer** where the user **finishes work** (search, multi-row select, edit, batch, AI apply) — not a passive toast. **ConfirmPopup** and short **HelpPopup** use the same shell; their body may be minimal but **dark title bar**, **Close**, and **footer** rules still apply unless the extended catalog explicitly exempts **HelpPopup** footer.

**Shell and layering (must):**

- Render in **GlobalPopupLayer**; backdrop **`color.overlay.scrim`** at **`zIndex.modalBackdrop`**; dialog surface at **`zIndex.modal`** (above backdrop).
- **Title bar (must):** Full-width **dark** bar per §3 **Popup title bar** — **`color.chrome.sidebarBackground`** + **`color.chrome.sidebarText`**; height **`layout.popup.titleBarHeight`**; **Close** at trailing edge (icon or text) with hover **`color.chrome.sidebarItemHover`**.
- **Body + footer shell:** White/light work surface uses **`color.surface.muted`** for the main content column; outer frame **`1px solid`** typically **`color.chrome.sidebarBackground`** or **`color.grid.border`** (match reference: dark frame is acceptable when aligning to Nexacro window chrome).
- Corner **`radius.erp_md`** on the **outer** `PopupShell` with **`overflow: hidden`** so the dark title bar shares the top radius; elevation **`shadow.raised`** by default; **`shadow.popover`** only when product-wide parity requires — pick **one** elevation style per popup.

**Internal layout (must):**

```txt
PopupShell
 ├── TitleBar (dark chrome — title + Close; Nexacro / reference parity)
 ├── Body (light — scroll region — SearchPanel, FormSection, ResultGrid, AI panel)
 └── Footer (light — actions; primary trailing when components.popup.footerPrimaryRight)
```

**Scroll (must):** Only the **body** scrolls vertically when content exceeds available height; **title bar** and **footer** stay visible (sticky within the shell). **ResultGrid** inside a popup **must** keep **horizontal scroll** (`components.grid.horizontalScroll: allowed`) before dropping columns.

**Sizes (must — pick and document in spec / Figma):** Names align with the extended catalog; numeric ranges are defaults until the project pins tokens.

| Size | Typical max width | Typical use |
|------|-------------------|-------------|
| Small | ~360–440px | Confirm, impact text + actions |
| Medium | ~560–720px | Code select, simple form, Help |
| Large | ~900–1120px | SearchPanel + ResultGrid, Edit with sections |
| FullBusiness | up to **~96vw** (cap e.g. 1440px) | Tabs + grid + detail, bulk preview, itinerary-style |

**Pattern — body composition (must):**

| Type | Body | Footer (typical) |
|------|------|------------------|
| **SearchPopup** | **SearchPanel** + **ResultGrid** | Select / 확인 + **Close** |
| **SelectionPopup** | **ResultGrid** (with selection affordance) | 선택 완료 + **Cancel** |
| **EditPopup** | Optional summary + **FormSection**(s) | **Save** + **Cancel** |
| **BulkActionPopup** | Target summary + options + **progress** + result | Run / Apply + **Cancel** when safe |
| **AIPopup** | AI output + **source** metadata | **Apply** + **Regenerate** + **Cancel** — **no** silent write-through |
| **ConfirmPopup** | Impact summary | **Confirm** (danger if destructive) + **Cancel** |
| **HelpPopup** | Rule / field guidance | **Close** (footer may be Close-only) |

**Keyboard and focus (must):**

- On open, focus **moves into** the popup; **focus trap** while open; on close, focus **returns** to the opener control.
- **Escape** closes when **`components.popup.escapeClosesUnlessDirty`** and there are **no unsaved** edits; if dirty, use dirty-close confirm copy (§14).
- Tab order: **Close** in title bar → body (top-to-bottom) → footer (**Cancel** / secondary **before** primary when read left-to-right).

**Actions (must):**

- When **`components.popup.footerPrimaryRight`:** place **Save / Apply / SelectComplete** on the **trailing** edge; **Cancel** / **Close** to the **left** of primary.
- **One** primary commit action per footer unless the spec documents an explicit composite commit.
- **Danger** actions in a task popup **must** use **danger** button styling and impact copy (see **ConfirmPopup** / destructive **Edit**).

**Data and parent (must define in feature spec):** opener context, working copy, **return payload**, parent refresh — see [hanahub-design-system-complete/DESIGN.md](hanahub-design-system-complete/DESIGN.md) **§ Popup Rules** and **§ Parent-Popup Data Contract**.

**Nested popups (should):** Prefer a **single** active modal; if a second layer is unavoidable, increment stacking (`modalBackdrop` / `modal` or product-specific step) so the top dialog always receives input — document the rule in the product shell spec.

**Responsive (should):** Use **`min(96vw, maxWidth)`** and a sane **`max-height`** (e.g. **90vh**) so task popups remain usable on compact desktops; when stacking footer buttons for touch policy, keep **Cancel** above **Save** in vertical stacks.

---

## 8. Components summary

Specifications below align with the extended catalog in [hanahub-design-system-complete/DESIGN.md](hanahub-design-system-complete/DESIGN.md) § Component Visual Specs. On conflict, **this file’s YAML tokens win** for colors; **complete file’s numeric specs** (heights, padding) win for ERP density until unified.

### Buttons

| Variant | Use | Background | Border | Text |
|---------|-----|------------|--------|------|
| Primary | Search, Save, Apply | `color.action.primary` | `color.action.primaryBorder` (default/focus); `color.action.primaryHoverBorder` on hover; `color.action.primaryActive` + `primaryActiveBorder` when pressed | `color.action.onPrimary` |
| Secondary | Export, Print, Close, Cancel | `neutral.0` | `neutral.300` | `neutral.700` |
| Danger | Delete, irreversible | `status.danger` | `status.danger` | `neutral.0` |
| Ghost | Low-priority utility | transparent | transparent | `primary_scale.700` |

**Base dimensions (must match YAML `components.button`):** height **28px**, min-width **64px**, horizontal padding **12px** (`paddingX`), internal gap **4px**, `border-width` **1px**, `border-radius: radius.erp_sm`, `ButtonText` typography.

**States (must):** default, hover (`primaryHover` / `primaryHoverBorder`), **focus-visible** (2px outline using `color.focus.ring`), active / pressed (`primaryActive` / `primaryActiveBorder`), **disabled** (below), loading (preserve width), error (async failure).

**Disabled (must):** background `neutral.100`, border `neutral.300`, text `neutral.500`, `cursor: not-allowed`, no shadow; **must not** reduce opacity below **0.6** without also disabling the control — prefer explicit disabled colors.

### Inputs

**Base (must match YAML `components.input`):** height **28px**, `border-width` **1px** `neutral.300`, `radius.erp_sm`, background `neutral.0`, horizontal padding **8px**, value uses `FormValue` role.

**States (must):** default, focus (`focus-visible` with `color.focus.ring` and/or `color.action.primaryBorder` on border), toolbar-underline variant **may** use `color.focus.inputUnderline` only (no ring), disabled, readonly, required (visible marker), error (danger border + text).

### SearchPanel

**Must match YAML `components.searchPanel`:** background resolves to `neutral.100`, border `1px solid color.grid.border`, padding **12px**, row gap **8px**, column gap **8px**; **SearchButton** on the right; Enter-to-search when safe.

### ActionToolbar

**Must:** `justify-content: flex-end`; gap `components.actionToolbar.gap` (6px); margin above grid `marginNearGridMin`–`marginNearGridMax` (8–12px).

**Order (should, left → right visual):** contextual secondary actions → **Save** (primary) at the **trailing** edge when it commits the page; **Delete** (danger) separated or left-most per destructive-action policy; **Print** / **Export** secondary.

### ResultGrid

**Must:** header bg `color.grid.header`; selected row `color.grid.selectedRow`; outer frame `color.grid.frameBorder`; header column dividers `color.grid.columnDivider`; header bottom rule `color.grid.headerBottomRule`; body cell padding **`components.grid.cellPadding`** (`8px 10px`); interior row lines **may** use `color.grid.border`; zebra **should** alternate `neutral.0` / `neutral.50`; `headerFixed: true` when row count is large; **horizontal scroll allowed** before hiding columns.

**Empty state (should):** title + one line of guidance + secondary “Clear filters” / “Create” — Korean examples in §14.

### StatusBadge

| Domain state | Background | Text | Border (1px) | Notes |
|--------------|-------------|------|----------------|-------|
| COMPLETE / confirmed | `color.status.success` | `neutral.0` | same as bg | Pair with label “완료” or icon. |
| WAITING / in progress | `color.status.warning` | `neutral.900` | `neutral.700` | Use dark text for contrast on orange. |
| ERROR / rejected | `color.status.danger` | `neutral.0` | same as bg | Never color-only. |
| DEFAULT / draft | `neutral.200` | `neutral.700` | `neutral.300` | Draft / 미확정 |

**Dimensions (should):** `components.statusBadge.minHeight` 22px; padding `2px 7px`; `border-radius: radius.erp_sm`; type `BadgeText`.

### AlertBanner (inline page / section)

**Must:** icon + title + body + optional actions; use `color.section.yellow` or `color.section.pink` for soft bands; **danger** workflows use `status.danger` text on `neutral.0` strip only for hard errors — do not flood entire workspace red.

### SectionGroup (collapsible blocks)

**Must:** header uses `SectionTitle` role; chevron/disclosure control keyboard-operable; body respects `layout.section.*` height keys when showing summary KPIs.

### Common State Model (canonical labels — map domain enums here)

| State | Korean UI label (example) | Badge treatment |
|-------|---------------------------|-----------------|
| DRAFT | 작성중 | DEFAULT badge |
| PENDING_APPROVAL | 결재대기 | WAITING |
| APPROVED | 승인완료 | COMPLETE |
| REJECTED | 반려 | ERROR |
| CANCELLED | 취소 | DEFAULT or WARNING by domain |
| IN_PROGRESS | 처리중 | WAITING |
| COMPLETED | 완료 | COMPLETE |
| FAILED | 실패 | ERROR |

### Popups

**Must:** use **PopupShell**; choose pattern: SearchPopup, SelectionPopup, EditPopup, ConfirmPopup, HelpPopup, AIPopup, BulkActionPopup per extended catalog. Modals render in **GlobalPopupLayer** with **`color.overlay.scrim`**.

**Task popups (layout, size, focus, scroll, actions):** follow **[§7 Task popups working modals](#task-popups-working-modals)** — that section is the **authoritative** guide for “작업 가능한” (working) popups; this subsection stays a short catalog pointer.

**Footer (must):** primary action **right** when `components.popup.footerPrimaryRight` is true; **Escape** closes unless dirty (`escapeClosesUnlessDirty`).

---

## 9. Accessibility

| Requirement | Severity |
|-------------|----------|
| WCAG **2.2 AA** for text and UI contrast. | must |
| Keyboard-first: all interactive controls reachable in logical tab order. | must |
| **Focus-visible** ring on every focusable control; never `outline: none` without replacement. | must |
| Legacy Nexacro sets `outline: none` on container `div`s — **new** web or hybrid UI **must** restore visible `focus-visible` (e.g. `color.focus.ring`). | must |
| Touch targets **minimum 44×44px** where pointer targets are shared with touch. | should |
| Status **must not** rely on color alone; include text or icon. | must |
| Acceptance criteria **must** be testable (contrast ratio, focus ring presence, screen reader label for icon buttons). | must |

---

## 10. Responsive behavior

**Default (must):** Desktop-first ERP. Primary layout **must** assume wide screens; narrow breakpoints **should** collapse sidebars and stack toolbars without hiding critical grid actions behind unexplained icons.

| Breakpoint (example) | Width | Behavior |
|----------------------|-------|----------|
| Wide | ≥1440px | Full shell, optional UtilitySidebar visible. |
| Standard | 1280–1439px | Sidebar may collapse to icons per product decision. |
| Compact | 1024–1279px | Stack SearchPanel rows; keep grid horizontally scrollable before hiding columns. |
| Minimum | <1024px | Requires explicit product support; **should** show horizontal scroll for grids rather than removing columns silently. |

Replace breakpoint numbers with project-standard tokens when available.

---

## 11. Do’s and don’ts

### Do

- Use semantic tokens from YAML for all new specs.
- Use **AppShell** and page patterns (List / Detail / Dashboard) consistently.
- Put **one** (or very few) **primary** buttons per toolbar; Search and Save are primary.
- Use **danger** for Delete and irreversible actions.
- Include **DataMaskingToggle** when showing sensitive personal data.
- Map domain statuses to the **Common State Model** (§8) before inventing labels.

### Don’t

- Do not ship low-contrast text or invisible focus.
- Do not replace **ResultGrid** with decorative card lists for operational datasets.
- Do not use **icon-only** controls for critical ERP actions.
- Do not mix unpersisted AI output into saved business fields without explicit Apply and audit metadata.
- Do not apply **consumer marketing** gradients or hero layouts to core ERP surfaces.

---

## 12. Agent cheat sheet

1. **Shell first:** Always wrap full pages in `AppShell` subtree; popups in `GlobalPopupLayer` (`zIndex.modal` above `modalBackdrop`).
2. **List pages:** `SearchPanel` (top, search right) → `ActionToolbar` → `ResultGrid`.
3. **Primary CTA:** `color.action.primary` + full ladder (`primaryBorder`, `primaryHover*`, `primaryActive*`) — **never** use this ladder for inline hyperlinks; use `color.semantic.link`.
4. **Typography:** Use YAML `typeRoles` names in specs (`GridCell`, `FormLabel`, …) + `typography.fontFamily.stack`.
5. **Spacing new work:** `spacing.erp.*` (4/8/12/16/24/32).
6. **Grids:** All grid tokens including `detailBorder`, `treeGuideDotted`, `rowHoverPk`, `detailSectionBand` when matching PK/detail tables + `components.grid.cellPadding`.
7. **Chrome:** `color.chrome.*` for top bar and sidebar.
8. **PK wizard:** Main tab selected = `color.pk.mainTabOn` (not `color.action.primary`); step active = `color.pk.stepIndicatorOn`; confirm/wait = `color.pk.confirm*` / `color.pk.wait*`.
9. **Elevation:** `shadow.raised` for cards; **`shadow.popover`** / **`shadow.widgetSoft`** for hub-style floats when spec calls for them; `color.overlay.scrim` for modals.
10. **Motion:** `motion.durationFast` / `durationNormal` + `easingStandard` for hovers and panel open (no gratuitous >300ms).
11. **States:** Every interactive control: default, hover, focus-visible, active, disabled, loading, error as applicable; badges follow **Common State Model** table.
12. **Output structure:** Context → YAML tokens → pattern → components → standard KO copy (§14) → a11y acceptance → anti-patterns → QA checklist.
13. **HUB / portal:** Join and message CTAs use `color.hub.joinAccent*` (not `color.action.primary`); segmented bars use `color.segmented.*`; optional calendar/air tokens per §3 hub subsection.
14. **Task popups:** §7 task popup guide — shell in **GlobalPopupLayer**, **dark title bar** (§3) + scroll body + footer, **focus trap**, **Escape + dirty**, pattern-specific body (Search / Selection / Edit / Bulk / AI).

---

## 13. References and QA checklist

### Deep reference

- Full component catalog, selection rules, common state model, and compact visual specs: [hanahub-design-system-complete/DESIGN.md](hanahub-design-system-complete/DESIGN.md)
- Additional QA: [hanahub-design-system-complete/qa/design-system-checklist.md](hanahub-design-system-complete/qa/design-system-checklist.md)

### QA checklist (must pass before merge)

- [ ] All colors referenced as semantic tokens in new UI specs.
- [ ] Focus-visible visible on keyboard tab through forms, grid toolbars, and modals.
- [ ] Primary/danger/secondary button variants correct for actions (Search/Save primary; Delete danger).
- [ ] Grid: header + border tokens; selected row visible; horizontal scroll strategy documented for narrow viewports.
- [ ] Sensitive data: masking toggle present and default-safe per permissions story.
- [ ] No hero-only layouts for operational list/detail flows.
- [ ] `DESIGN.preview.html` updated if any YAML token hex, semantic link, section tint, scrim, shadow string, **`color.pk.*`**, **`color.hub.*`**, **`color.segmented.*`**, **`color.calendar.*`**, **`color.verticalAir.*`**, **`color.border.widget`**, **`color.surface.exchangeHighlight`**, grid detail/tree/hover PK tokens, or **`layout.nexacro.scrollbarGutter`** changed.
- [ ] Inline links use `color.semantic.link` (not `color.action.primary`).
- [ ] Modals use `color.overlay.scrim` and `zIndex.modal` / `modalBackdrop` layering.
- [ ] Task popups (Search / Selection / Edit / Bulk / AI) follow **§7 Task popups working modals**: **dark title bar** (§3 popup chrome) + **scrollable light body** + footer; **focus trap**; **Escape + dirty**; grid horizontal scroll before hiding columns.

### Known diagnostics

- Portal extraction originally flagged low confidence on audience/surface naming — `color.surface.base_legacy` must not be misread as default body text; use `color.text.primary` on light surfaces.

### Component inventory (context)

- Approximate density: **buttons ~1709**, **inputs ~372** across the hub — prefer system patterns over one-off controls.

---

## 14. Standard copy, validation, and data formatting

Use **Korean** for user-visible ERP strings unless a locale framework is specified. Below are **default** patterns — product copy may override but **must** keep severity and structure.

### Form validation (inline)

| Situation | Example message | Severity styling |
|-----------|-----------------|------------------|
| Required empty | “필수 입력 항목입니다.” | `status.danger` text + border |
| Format error | “올바른 형식이 아닙니다.” | `status.danger` |
| Length | “최대 N자까지 입력 가능합니다.” | `status.warning` or `danger` by UX |
| Async save fail | “저장에 실패했습니다. 잠시 후 다시 시도해 주세요.” | `AlertBanner` + retry |

### System feedback (toast / banner)

| Event | Example |
|-------|---------|
| Save success | “저장되었습니다.” |
| Delete success | “삭제되었습니다.” |
| Permission denied | “접근 권한이 없습니다.” |
| Network error | “네트워크 오류가 발생했습니다.” |
| Session expired | “세션이 만료되었습니다. 다시 로그인해 주세요.” |

### Grid empty / no results

| Context | Title | Body | Secondary action |
|---------|-------|------|------------------|
| Filter too narrow | “검색 결과가 없습니다.” | “조건을 변경하거나 초기화해 보세요.” | “조건 초기화” |
| No data yet | “등록된 데이터가 없습니다.” | “신규 등록으로 시작할 수 있습니다.” | “등록” |

### Numeric and date display (should)

| Data | Display | Notes |
|------|---------|-------|
| Integer money (KRW) | `1,234,567` | Thousands separator; currency symbol only if column header says “(원)”. |
| Decimal quantity | Up to **4** fractional digits if domain requires; otherwise **2** | Right-align in grid. |
| Date | `YYYY-MM-DD` | ISO-style; time `HH:mm` in separate column if needed. |
| Phone | Mask middle digits when **DataMaskingToggle** on. | |

---

## 15. Motion, layering, and YAML component keys

### Motion (must: restrained)

| Token | Role |
|-------|------|
| `motion.durationFast` | Hover color/border cross-fades, small opacity tweaks. |
| `motion.durationNormal` | Panel expand/collapse, popup enter (match OS feel; avoid bouncy easing). |
| `motion.easingStandard` | Default easing curve for ERP — no aggressive overshoot. |

### z-index (must: avoid stacking bugs)

| Token | Typical layer |
|-------|----------------|
| `zIndex.stickyHeader` | Frozen grid header / page subheader. |
| `zIndex.dropdown` | Combo/listbox overlays. |
| `zIndex.modalBackdrop` | Scrim below dialog. |
| `zIndex.modal` | `PopupShell` content. |
| `zIndex.toast` | Global notifications above modals when policy requires. |

### Machine-readable component inventory (YAML `components_catalog`)

Agents **should** pick component names from these lists before inventing new ones:

- **layout:** `AppShell`, `GlobalNavigationBar`, `LeftNavigationBar`, `WorkspaceTabs`, `PageHeader`, `MainContent`, `UtilitySidebar`, `GlobalPopupLayer`
- **form:** `SearchPanel`, `SearchField`, `DateRangePicker`, `CodeSelect`, `RequiredLabel`, `TextAreaField`, `RadioStatusGroup`
- **action:** `ActionToolbar`, `SearchButton`, `SaveButton`, `DeleteButton`, `PrintButton`, `ExportExcelButton`, `GridSettingsButton`, `PersonalizationButton`, `DataMaskingToggle`, `AddButton`, `DetailViewButton`
- **grid:** `ResultGrid`, `EditableGrid`, `GridToolbar`, `GridContextMenu`, `GridPersonalizationMenu`, `GridEmptyState`, `GridSummaryRow`
- **state:** `StatusBadge`, `AlertBanner`, `LoadingState`, `EmptyState`, `ErrorState`, `PermissionStatus`
- **popup:** `PopupShell`, `SearchPopup`, `SelectionPopup`, `EditPopup`, `ConfirmPopup`, `HelpPopup`, `AIPopup`, `BulkActionPopup`
- **ai:** `AIWidget`, `AISummaryPanel`, `AIRecommendationPanel`, `AIRiskDetector`, `AIItinerarySuggestionPanel`

---

## 16. Nexacro engine vs web (공통 + WF_PK extract)

This section **summarizes** the supplied Nexacro **application 공통** + **WF_PK** theme CSS for agents who port or compare pixel-perfect behavior.

**What to carry forward as tokens (already in YAML):**

- Grid detail rules and PK hover bands: `color.grid.detailBorder`, `color.grid.detailSectionBand`, `color.grid.rowHoverPk`, `color.grid.treeGuideDotted`.
- PK-only accents: `color.pk.*` (main tab on, step pill, confirm/wait, progress blue).
- HUB / portal skins: `color.hub.joinAccent*`, `color.segmented.*`, optional `color.calendar.*` / `color.verticalAir.*`, `color.border.widget`, `color.surface.exchangeHighlight`, `shadow.popover` / `shadow.widgetSoft`.
- Task popups: §7 shell (GlobalPopupLayer, scrim, z-index), sizes, pattern bodies, focus + dirty + parent data contract.
- Scroll pairing: `layout.nexacro.scrollbarGutter`.

**What to treat as engine quirks (do not blindly port):**

- Global `outline:none` + `user-select:none` on structural `div`s — replace with **visible `focus-visible`** and **selectable** body text on web.
- `position:absolute` on every `div` — use normal document flow in React.
- Hidden textarea scrollbars — avoid unless a deliberate minimal-height pattern includes overflow affordance.

**Dummy / dev-only selectors** in the paste (e.g. `.Button.Dummy`, `.main_cell_level*`) are **not** product tokens; ignore for design system.

---

## Guideline authoring workflow

1. Restate design intent in one sentence.
2. Define foundations and semantic tokens (YAML).
3. Define component anatomy, variants, interactions, and states.
4. Add accessibility acceptance criteria with pass/fail checks.
5. Add anti-patterns and edge cases (empty, loading, permission denied).
6. End with the QA checklist above.

## Writing tone

Concise, confident, implementation-focused.

## Quality gates

- Every non-negotiable rule in prose **must** use the word **must**.
- Recommendations **should** use **should**.
- Every accessibility rule **must** be testable in implementation.
