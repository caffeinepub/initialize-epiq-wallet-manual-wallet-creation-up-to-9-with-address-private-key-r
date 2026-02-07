# EPIQ Life UI Style Guide

## Overview
This comprehensive style guide defines the visual design system for EPIQ Life, a Web3 community application. The design philosophy is inspired by Apple's clean, minimal aesthetic with a distinctive purple and gold color scheme that conveys trust, innovation, and premium quality.

---

## Color System

### Primary Colors
- **Primary Purple**: `#6A5ACD` (RGB 106, 90, 205) / `oklch(0.55 0.18 285)`
  - Used for: Primary buttons, highlights, icons, gradients, decorative accents, links
  - Hover state: `oklch(0.50 0.18 285)` (darker)
  - Active state: `oklch(0.45 0.18 285)` (darkest)

- **Secondary Gold**: `#EFBF04` (RGB 239, 191, 4) / `oklch(0.80 0.18 85)`
  - Used for: Complementary elements, text accents, secondary highlights, rewards, badges
  - Hover state: `oklch(0.75 0.18 85)` (darker)
  - Active state: `oklch(0.70 0.18 85)` (darkest)

### Neutral Colors
- **Pure White**: `#FFFFFF` / `oklch(0.99 0 0)` - Card backgrounds, input fields
- **Light Gray**: `#F8F9FA` / `oklch(0.98 0 0)` - Page backgrounds, disabled states
- **Medium Gray**: `#6C757D` / `oklch(0.50 0.02 285)` - Secondary text, placeholders
- **Dark Gray**: `#343A40` / `oklch(0.15 0 0)` - Primary text, headings

### Semantic Colors
- **Success**: `#28A745` / `oklch(0.60 0.18 145)` - Success messages, completed states
- **Warning**: `#FFC107` / `oklch(0.82 0.16 85)` - Warning messages, caution states
- **Error/Destructive**: `#DC3545` / `oklch(0.58 0.24 27)` - Error messages, destructive actions
- **Info**: `#17A2B8` / `oklch(0.60 0.12 210)` - Informational messages, tips

### Background Colors
- **Page Background (Light)**: `#F8F7FF` / `oklch(0.98 0.01 285)` - Subtle purple tint
- **Card Background**: `#FFFFFF` / `oklch(1 0 0)` - Pure white for contrast
- **Muted Background**: `#F5F3FF` / `oklch(0.96 0.02 285)` - Light purple for sections

### Dark Mode Variations
- **Background**: `oklch(0.12 0.01 285)` - Deep purple-tinted dark
- **Card**: `oklch(0.15 0.02 285)` - Slightly lighter than background
- **Primary**: `oklch(0.60 0.20 285)` - Brighter purple for visibility
- **Secondary**: `oklch(0.82 0.20 85)` - Brighter gold for visibility
- **Border**: `oklch(0.25 0.03 285)` - Subtle borders in dark mode

### Accessibility Requirements
- **Minimum Contrast Ratio**: AA compliance (4.5:1) for all text
- **Primary Purple on White**: 4.8:1 (AA compliant)
- **Gold on White**: 3.2:1 (Use for large text only or with dark backgrounds)
- **Dark Gray on White**: 12.6:1 (AAA compliant)
- **White on Primary Purple**: 8.2:1 (AAA compliant)

---

## Typography Hierarchy

### Font Family
- **Primary Font**: System font stack for optimal performance
  - `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- **Monospace Font**: For code or technical content
  - `"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace`

### Heading Styles

#### H1 - Page Titles
- **Size**: 2.5rem (40px)
- **Weight**: 700 (Bold)
- **Line Height**: 1.2 (48px)
- **Letter Spacing**: -0.02em (tight)
- **Margin Bottom**: 1.5rem (24px)
- **Color**: Primary text (`oklch(0.15 0 0)`)
- **Usage**: Main page titles, hero headings

#### H2 - Section Titles
- **Size**: 2rem (32px)
- **Weight**: 600 (Semi-bold)
- **Line Height**: 1.3 (41.6px)
- **Letter Spacing**: -0.01em
- **Margin Bottom**: 1.25rem (20px)
- **Color**: Primary text
- **Usage**: Major section headings, card titles

#### H3 - Subsection Titles
- **Size**: 1.75rem (28px)
- **Weight**: 600 (Semi-bold)
- **Line Height**: 1.3 (36.4px)
- **Letter Spacing**: -0.01em
- **Margin Bottom**: 1rem (16px)
- **Color**: Primary text
- **Usage**: Subsection headings, dialog titles

#### H4 - Component Titles
- **Size**: 1.5rem (24px)
- **Weight**: 500 (Medium)
- **Line Height**: 1.4 (33.6px)
- **Letter Spacing**: 0
- **Margin Bottom**: 0.75rem (12px)
- **Color**: Primary text
- **Usage**: Card headers, component titles

#### H5 - Small Headings
- **Size**: 1.25rem (20px)
- **Weight**: 500 (Medium)
- **Line Height**: 1.4 (28px)
- **Letter Spacing**: 0
- **Margin Bottom**: 0.5rem (8px)
- **Color**: Primary text
- **Usage**: List headers, small section titles

#### H6 - Micro Headings
- **Size**: 1rem (16px)
- **Weight**: 500 (Medium)
- **Line Height**: 1.5 (24px)
- **Letter Spacing**: 0.01em
- **Margin Bottom**: 0.5rem (8px)
- **Color**: Primary text
- **Usage**: Form labels, inline headings

### Body Text Styles

#### Body Text (Default)
- **Size**: 1rem (16px)
- **Weight**: 400 (Regular)
- **Line Height**: 1.6 (25.6px)
- **Letter Spacing**: 0
- **Margin Bottom**: 1rem (16px)
- **Color**: Primary text
- **Usage**: Paragraphs, general content

#### Small Text
- **Size**: 0.875rem (14px)
- **Weight**: 400 (Regular)
- **Line Height**: 1.5 (21px)
- **Letter Spacing**: 0
- **Color**: Primary text
- **Usage**: Secondary information, helper text

#### Caption Text
- **Size**: 0.75rem (12px)
- **Weight**: 400 (Regular)
- **Line Height**: 1.4 (16.8px)
- **Letter Spacing**: 0.01em
- **Color**: Medium Gray (`oklch(0.50 0.02 285)`)
- **Usage**: Timestamps, metadata, footnotes

#### Lead Text (Emphasized)
- **Size**: 1.125rem (18px)
- **Weight**: 400 (Regular)
- **Line Height**: 1.7 (30.6px)
- **Letter Spacing**: 0
- **Color**: Primary text
- **Usage**: Introduction paragraphs, emphasized content

---

## Spacing Scale

### Base Unit: 4px
All spacing follows a consistent 4px base unit for visual rhythm.

| Token | Value | Pixels | Usage |
|-------|-------|--------|-------|
| `xs` | 0.25rem | 4px | Minimal spacing, tight layouts, icon padding |
| `sm` | 0.5rem | 8px | Small spacing between related elements |
| `md` | 1rem | 16px | Standard spacing for most components |
| `lg` | 1.5rem | 24px | Large spacing for section separation |
| `xl` | 2rem | 32px | Extra large spacing for major divisions |
| `2xl` | 3rem | 48px | Maximum spacing for page-level separation |
| `3xl` | 4rem | 64px | Hero sections, major page divisions |

### Spacing Application Guidelines

#### Component Internal Spacing
- **Button Padding**: `md` (16px) horizontal, `sm` (8px) vertical
- **Card Padding**: `lg` (24px) all sides
- **Input Padding**: `md` (16px) horizontal, `sm` (8px) vertical
- **Modal Padding**: `xl` (32px) all sides

#### Component External Spacing
- **Between Related Elements**: `sm` (8px)
- **Between Unrelated Elements**: `md` (16px)
- **Between Sections**: `lg` (24px) to `xl` (32px)
- **Between Major Sections**: `2xl` (48px)

#### Responsive Spacing
- **Mobile (< 768px)**: Reduce spacing by 25%
  - `lg` becomes `md` (16px)
  - `xl` becomes `lg` (24px)
- **Tablet (768px - 1023px)**: Maintain standard spacing
- **Desktop (≥ 1024px)**: Standard or increased spacing

---

## Button Design Standards

### Primary Buttons

#### Size Variants
**Default Size**
- **Height**: 44px
- **Padding**: 12px 24px (vertical horizontal)
- **Min Width**: 100px
- **Typography**: 1rem (16px), font-weight: 500
- **Icon Size**: 20px (if present)
- **Icon Spacing**: 8px from text

**Small Size**
- **Height**: 36px
- **Padding**: 8px 16px
- **Min Width**: 80px
- **Typography**: 0.875rem (14px), font-weight: 500
- **Icon Size**: 16px

**Large Size**
- **Height**: 52px
- **Padding**: 16px 32px
- **Min Width**: 120px
- **Typography**: 1.125rem (18px), font-weight: 500
- **Icon Size**: 24px

#### Visual Properties
- **Background**: Primary Purple (`oklch(0.55 0.18 285)`)
- **Text Color**: White (`oklch(0.99 0 0)`)
- **Border**: None
- **Border Radius**: 0.5rem (8px)
- **Shadow**: `0 2px 4px rgba(106, 90, 205, 0.2)`
- **Transition**: `all 200ms ease-in-out`

#### Interactive States
**Hover**
- **Background**: `oklch(0.50 0.18 285)` (darker purple)
- **Shadow**: `0 4px 8px rgba(106, 90, 205, 0.3)` (elevated)
- **Transform**: `translateY(-1px)` (subtle lift)
- **Cursor**: pointer

**Focus**
- **Outline**: 2px solid Gold (`oklch(0.80 0.18 85)`)
- **Outline Offset**: 2px
- **Shadow**: Maintain hover shadow

**Active (Pressed)**
- **Background**: `oklch(0.45 0.18 285)` (darkest purple)
- **Shadow**: `0 1px 2px rgba(106, 90, 205, 0.2)` (reduced)
- **Transform**: `translateY(0)` (no lift)

**Disabled**
- **Background**: `oklch(0.96 0 0)` (light gray)
- **Text Color**: `oklch(0.50 0.02 285)` (medium gray)
- **Shadow**: None
- **Cursor**: not-allowed
- **Opacity**: 0.6

**Loading**
- **Background**: Primary Purple (maintain)
- **Text**: Hidden or with spinner
- **Cursor**: wait
- **Spinner Color**: White
- **Spinner Size**: 20px (default), 16px (small), 24px (large)

### Secondary Buttons

#### Visual Properties
- **Background**: Transparent
- **Text Color**: Primary Purple (`oklch(0.55 0.18 285)`)
- **Border**: 2px solid Primary Purple
- **Border Radius**: 0.5rem (8px)
- **Shadow**: None
- **Transition**: `all 200ms ease-in-out`

#### Interactive States
**Hover**
- **Background**: Primary Purple (`oklch(0.55 0.18 285)`)
- **Text Color**: White
- **Border**: 2px solid Primary Purple

**Focus**
- **Outline**: 2px solid Gold (`oklch(0.80 0.18 85)`)
- **Outline Offset**: 2px

**Active**
- **Background**: `oklch(0.45 0.18 285)` (darker purple)
- **Text Color**: White

**Disabled**
- **Border Color**: `oklch(0.92 0.02 285)` (light gray)
- **Text Color**: `oklch(0.50 0.02 285)` (medium gray)
- **Cursor**: not-allowed
- **Opacity**: 0.6

### Icon Buttons

#### Size Variants
**Compact**: 32x32px
- **Icon Size**: 16px
- **Padding**: 8px

**Standard**: 40x40px
- **Icon Size**: 20px
- **Padding**: 10px

**Large**: 48x48px
- **Icon Size**: 24px
- **Padding**: 12px

#### Visual Properties
- **Background**: Transparent or Light Purple (`oklch(0.98 0.01 285)`)
- **Icon Color**: Primary Purple (`oklch(0.55 0.18 285)`)
- **Border**: None
- **Border Radius**: 0.5rem (8px)
- **Transition**: `all 200ms ease-in-out`

#### Interactive States
**Hover**
- **Background**: Light Purple (`oklch(0.96 0.02 285)`)
- **Icon Color**: `oklch(0.50 0.18 285)` (darker purple)

**Focus**
- **Outline**: 2px solid Gold
- **Outline Offset**: 2px

**Active**
- **Background**: `oklch(0.92 0.02 285)` (medium purple)
- **Icon Color**: `oklch(0.45 0.18 285)` (darkest purple)

### Ghost Buttons
- **Background**: Transparent
- **Text Color**: Primary Purple
- **Border**: None
- **Hover**: Light purple background (`oklch(0.98 0.01 285)`)

### Destructive Buttons
- **Background**: Error color (`oklch(0.58 0.24 27)`)
- **Text Color**: White
- **Hover**: Darker error (`oklch(0.53 0.24 27)`)

---

## Input Field Design Standards

### Text Inputs

#### Size Variants
**Default**
- **Height**: 44px
- **Padding**: 12px 16px
- **Typography**: 1rem (16px), font-weight: 400

**Small**
- **Height**: 36px
- **Padding**: 8px 12px
- **Typography**: 0.875rem (14px), font-weight: 400

**Large**
- **Height**: 52px
- **Padding**: 16px 20px
- **Typography**: 1.125rem (18px), font-weight: 400

#### Visual Properties
- **Background**: White (`oklch(1 0 0)`)
- **Border**: 2px solid `oklch(0.92 0.02 285)` (light gray)
- **Border Radius**: 0.5rem (8px)
- **Text Color**: `oklch(0.15 0 0)` (dark gray)
- **Placeholder Color**: `oklch(0.50 0.02 285)` (medium gray)
- **Transition**: `all 200ms ease-in-out`

#### Interactive States
**Focus**
- **Border Color**: Primary Purple (`oklch(0.55 0.18 285)`)
- **Box Shadow**: `0 0 0 3px rgba(106, 90, 205, 0.1)`
- **Outline**: None

**Hover**
- **Border Color**: `oklch(0.85 0.02 285)` (slightly darker gray)

**Error**
- **Border Color**: Error (`oklch(0.58 0.24 27)`)
- **Box Shadow**: `0 0 0 3px rgba(220, 53, 69, 0.1)`
- **Text Color**: Error (for error message below)

**Success**
- **Border Color**: Success (`oklch(0.60 0.18 145)`)
- **Box Shadow**: `0 0 0 3px rgba(40, 167, 69, 0.1)`

**Disabled**
- **Background**: `oklch(0.98 0 0)` (light gray)
- **Border Color**: `oklch(0.92 0.02 285)`
- **Text Color**: `oklch(0.50 0.02 285)` (medium gray)
- **Cursor**: not-allowed

### Input Labels
- **Typography**: 0.875rem (14px), font-weight: 500
- **Color**: `oklch(0.15 0 0)` (dark gray)
- **Margin Bottom**: 0.5rem (8px)
- **Required Indicator**: Red asterisk (`*`)

### Helper Text
- **Typography**: 0.75rem (12px), font-weight: 400
- **Color**: `oklch(0.50 0.02 285)` (medium gray)
- **Margin Top**: 0.25rem (4px)

### Error Messages
- **Typography**: 0.75rem (12px), font-weight: 500
- **Color**: Error (`oklch(0.58 0.24 27)`)
- **Margin Top**: 0.25rem (4px)
- **Icon**: Error icon (16px) before text

### Textarea
- **Min Height**: 120px
- **Padding**: 12px 16px
- **Resize**: vertical (allow user control)
- **All other properties**: Same as text input

### Select Dropdowns
- **Height**: 44px (default)
- **Padding**: 12px 40px 12px 16px (space for dropdown arrow)
- **Arrow Icon**: 20px, positioned right 12px
- **All other properties**: Same as text input

---

## Card Layout Standards

### Card Structure

#### Default Card
- **Background**: White (`oklch(1 0 0)`)
- **Border**: None
- **Border Radius**: 0.75rem (12px)
- **Shadow**: `0 2px 8px rgba(0, 0, 0, 0.1)`
- **Padding**: 24px (lg spacing)
- **Margin Bottom**: 24px (lg spacing)
- **Transition**: `all 200ms ease-in-out`

#### Interactive Card (Hover)
- **Shadow**: `0 4px 16px rgba(0, 0, 0, 0.15)` (elevated)
- **Transform**: `translateY(-2px)` (subtle lift)
- **Cursor**: pointer (if clickable)

#### Card Variants

**Compact Card**
- **Padding**: 16px (md spacing)
- **Border Radius**: 0.5rem (8px)

**Large Card**
- **Padding**: 32px (xl spacing)
- **Border Radius**: 1rem (16px)

**Outlined Card**
- **Border**: 2px solid `oklch(0.92 0.02 285)`
- **Shadow**: None
- **Hover Shadow**: `0 2px 8px rgba(0, 0, 0, 0.1)`

### Card Content Hierarchy

#### Card Header
- **Margin Bottom**: 16px (md spacing)
- **Padding Bottom**: 12px
- **Border Bottom**: 1px solid `oklch(0.92 0.02 285)` (optional)

**Card Title**
- **Typography**: H4 (1.5rem, font-weight: 500)
- **Color**: Primary text
- **Margin Bottom**: 8px

**Card Subtitle**
- **Typography**: Small text (0.875rem)
- **Color**: Medium Gray (`oklch(0.50 0.02 285)`)
- **Margin Bottom**: 0

#### Card Body
- **Typography**: Body text (1rem, line-height: 1.6)
- **Color**: Primary text
- **Spacing**: 16px between paragraphs

#### Card Footer
- **Margin Top**: 24px (lg spacing)
- **Padding Top**: 16px
- **Border Top**: 1px solid `oklch(0.92 0.02 285)` (optional)
- **Alignment**: Right (for actions) or Left (for metadata)

**Card Actions**
- **Button Spacing**: 8px (sm) between buttons
- **Alignment**: Right-aligned by default

---

## Elevation & Shadow System

### Shadow Levels

**Level 0 - Flat**
- **Shadow**: None
- **Usage**: Inline elements, flat surfaces

**Level 1 - Subtle**
- **Shadow**: `0 1px 3px rgba(0, 0, 0, 0.1)`
- **Usage**: Subtle elevation, input fields

**Level 2 - Standard**
- **Shadow**: `0 2px 8px rgba(0, 0, 0, 0.1)`
- **Usage**: Cards, buttons, standard components

**Level 3 - Elevated**
- **Shadow**: `0 4px 16px rgba(0, 0, 0, 0.15)`
- **Usage**: Hover states, dropdowns, popovers

**Level 4 - Floating**
- **Shadow**: `0 8px 32px rgba(0, 0, 0, 0.2)`
- **Usage**: Modals, dialogs, overlays

### Purple-Tinted Shadows (Brand Accent)
For primary interactive elements, use purple-tinted shadows:
- **Primary Button**: `0 2px 4px rgba(106, 90, 205, 0.2)`
- **Primary Button Hover**: `0 4px 8px rgba(106, 90, 205, 0.3)`

---

## Border Radius Standards

### Radius Scale
- **None**: 0
- **Small**: 0.25rem (4px) - Badges, tags
- **Default**: 0.5rem (8px) - Buttons, inputs, most components
- **Medium**: 0.75rem (12px) - Cards, containers
- **Large**: 1rem (16px) - Large cards, modals
- **Extra Large**: 1.5rem (24px) - Hero sections, special containers
- **Full**: 9999px - Pills, circular avatars

### Component-Specific Radius
- **Buttons**: 0.5rem (8px)
- **Inputs**: 0.5rem (8px)
- **Cards**: 0.75rem (12px)
- **Modals**: 1rem (16px)
- **Badges**: 0.25rem (4px) or full (pill shape)
- **Avatars**: Full (circular)

---

## Animation & Transition Standards

### Timing Functions
- **Ease In Out**: `cubic-bezier(0.4, 0, 0.2, 1)` - Default for most transitions
- **Ease Out**: `cubic-bezier(0, 0, 0.2, 1)` - Entering elements
- **Ease In**: `cubic-bezier(0.4, 0, 1, 1)` - Exiting elements
- **Sharp**: `cubic-bezier(0.4, 0, 0.6, 1)` - Quick interactions

### Duration Standards
- **Fast**: 100ms - Micro-interactions (hover, focus)
- **Default**: 200ms - Standard transitions (buttons, inputs)
- **Medium**: 300ms - Component state changes
- **Slow**: 500ms - Page transitions, complex animations

### Common Transitions
