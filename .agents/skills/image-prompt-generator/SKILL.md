---
name: generate-image-prompts
description: Skill for generating and updating placeholder image prompts in a professional, enterprise-grade style without AI sloppy dark mode aesthetics.
---

# Image Prompt Generation Protocol

When instructed to create or update image prompts for placeholders in this project, you **MUST** adhere to the following guidelines to ensure a consistent, professional, enterprise-grade aesthetic. 

## 1. Core Aesthetic Rules
- **Prohibited Styles**: DO NOT use "dark mode", "cyberpunk", "glassmorphism", "neon accents", or glowing nodes. Avoid anything that looks like "cheap AI-generated crypto UI".
- **Required Style**: Use clean, bright, professional, and minimalist aesthetics. The background should typically be crisp white or very light gray.
- **Colors**: Rely on official/professional colors such as Navy Blue, Slate/Charcoal for text, and subtle Trustworthy Green for accents.
- **Typography (for UI Mockups)**: Specify clean, highly legible sans-serif fonts (e.g., Inter, Roboto).
- **Photography**: When asking for real-world photos (like evidence of potholes), specify natural daylight, high resolution, and realistic professional civic documentation style.

## 2. File and Placeholder Protocol
- **Target File**: Always update or append to the `image-prompts.md` file in the root directory.
- **Format**: For every image, you must include:
  - **Filename**: The exact name of the file to be placed in the `public` directory (e.g., `hero-dashboard.png`).
  - **Prompt**: A highly detailed, descriptive prompt strictly following the core aesthetic rules above.

## 3. Example Prompt Output
When generating a prompt, format it exactly like this in `image-prompts.md`:

```markdown
## 1. [Image Title]
**Filename**: `[filename].png`
**Prompt**: A clean, professional, high-fidelity UI mockup of an enterprise government dashboard for [Feature]. The design should feature a bright, crisp white background with official navy blue and subtle green accents. It shows a clear data table of [Data], and a structured workflow. Clean sans-serif typography, highly legible, extremely professional government tech aesthetic. Absolutely no dark mode, no glowing elements, and no glassmorphism.
```
