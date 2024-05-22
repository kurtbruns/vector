#!/bin/bash

# Array of files with correct capitalization
files=(
    "src/elements/Frame.ts"
    "src/elements/Grid.ts"
    "src/elements/input/Button.ts"
    "src/elements/input/Control.ts"
    "src/elements/input/Input.ts"
    "src/elements/input/Scrubber.ts"
    "src/elements/input/Slider.ts"
    "src/elements/Tex.ts"
    "src/elements/visual/Arrow.ts"
    "src/elements/visual/Icon.ts"
    "src/elements/visual/Label.ts"
    "src/layouts/Layout.ts"
    "src/layouts/Pancake.ts"
    "src/layouts/Player.ts"
    "src/model/Controller.ts"
    "src/model/Point.ts"
    "src/model/Value.ts"
    "src/modules/plot/Plot.ts"
    "src/Scene.ts"
)

# Function to convert a filename to lowercase
to_lowercase() {
    echo "$1" | tr '[:upper:]' '[:lower:]'
}

# Function to create a temporary filename
create_temp_filename() {
    echo "$1.tmp"
}

# Ensure Git is case-sensitive
git config core.ignorecase false

# Remove files from the index
for file in "${files[@]}"; do
    lowercase_file=$(to_lowercase "$file")  # Convert filename to lowercase
    if [ -f "$lowercase_file" ]; then
        git rm --cached "$lowercase_file"
    fi
done

# Move files to a temporary filename, then to the correct capital-case form
for file in "${files[@]}"; do
    lowercase_file=$(to_lowercase "$file")  # Convert filename to lowercase
    if [ -f "$lowercase_file" ]; then
        temp_file=$(create_temp_filename "$lowercase_file")
        mv "$lowercase_file" "$temp_file"  # Move to temporary file
        mv "$temp_file" "$file"  # Move to correct capital-case form
        git add "$file"
    fi
done

# Commit the changes
git commit -m "Correct case of filenames"

# Change git back to being case insensitive 
git config core.ignorecase false