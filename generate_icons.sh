#!/bin/bash

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick is not installed. Please install it first:"
    echo "brew install imagemagick"
    exit 1
fi

# Source icon path
SOURCE_ICON="App/Asset/app_icon.png"

# iOS icon sizes
IOS_SIZES=(
    "20x20" "29x29" "40x40" "60x60" "76x76" "83.5x83.5"
    "40x40" "58x58" "80x80" "120x120" "152x152" "167x167"
    "60x60" "87x87" "120x120" "180x180" "1024x1024"
)

# Android icon sizes
ANDROID_SIZES=(
    "48x48:mipmap-mdpi"
    "72x72:mipmap-hdpi"
    "96x96:mipmap-xhdpi"
    "144x144:mipmap-xxhdpi"
    "192x192:mipmap-xxxhdpi"
)

echo "Generating iOS icons..."
for size in "${IOS_SIZES[@]}"; do
    convert "$SOURCE_ICON" -resize "$size" "ios/foodtruckapp/Images.xcassets/AppIcon.appiconset/Icon-${size}.png"
done

echo "Generating Android icons..."
for entry in "${ANDROID_SIZES[@]}"; do
    size="${entry%%:*}"
    folder="${entry#*:}"
    convert "$SOURCE_ICON" -resize "$size" "android/app/src/main/res/$folder/ic_launcher.png"
done

echo "Icon generation complete!" 