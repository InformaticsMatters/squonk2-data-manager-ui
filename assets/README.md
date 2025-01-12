# Squonk Assets Repository

This repository serves as the central storage location for all Squonk-related visual assets, including logos, images, and brand materials.

## Purpose

This repository functions as a Git Subtree that is included in multiple Squonk projects. It provides a single source of truth for all brand-related assets, ensuring consistency across our product ecosystem.

## ⚠️ Important Notice

The file structure of this repository is **critical** and must be maintained exactly as is. Multiple repositories depend on these specific file paths through Git Subtree references. Any structural changes could break dependent projects.

## Usage

To include this repository as a subtree in your project:

```bash
# Add the subtree
git subtree add --prefix assets git@github.com:InformaticsMatters/squonk-assets.git main --squash

# Update the subtree when needed
git subtree pull --prefix assets git@github.com:InformaticsMatters/squonk-assets.git main --squash
```

# Asset Guidelines
- All images should be optimized for web use
- Vector formats (SVG) are preferred for logos
- Maintain both light and dark versions of logos where applicable
