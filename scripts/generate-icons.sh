#!/bin/bash

# PWA Icon Generator Script
# Generates all required PWA icon sizes from the base SVG

echo "🎨 Generating PWA icons..."

# Check if ImageMagick is installed
if ! command -v magick &> /dev/null && ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick not found!"
    echo ""
    echo "Please install ImageMagick:"
    echo "  - Windows: choco install imagemagick"
    echo "  - Mac: brew install imagemagick"
    echo "  - Linux: sudo apt-get install imagemagick"
    echo ""
    echo "Or use an online tool like https://realfavicongenerator.net/"
    exit 1
fi

# Use 'magick' on newer versions, 'convert' on older
CMD="magick"
if ! command -v magick &> /dev/null; then
    CMD="convert"
fi

# Icon sizes needed for PWA
SIZES=(72 96 128 144 152 192 384 512)

# Source SVG
SOURCE="public/icons/icon.svg"

# Check if source exists
if [ ! -f "$SOURCE" ]; then
    echo "❌ Source icon not found: $SOURCE"
    exit 1
fi

# Generate each size
for size in "${SIZES[@]}"; do
    OUTPUT="public/icons/icon-${size}x${size}.png"
    echo "  Creating ${size}x${size}..."

    $CMD "$SOURCE" -resize ${size}x${size} -background none "$OUTPUT"

    if [ $? -eq 0 ]; then
        echo "  ✅ Created: $OUTPUT"
    else
        echo "  ❌ Failed: $OUTPUT"
    fi
done

echo ""
echo "✨ Icon generation complete!"
echo ""
echo "Generated icons:"
ls -lh public/icons/*.png 2>/dev/null || echo "No PNG icons found. Check errors above."
