#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "=========================================="
echo "    Pushing HomeGuard to GitHub Repo      "
echo "    https://github.com/sinax321/microcontroller.git"
echo "=========================================="
echo ""
echo "Commits ready to push:"
git log -n 3 --oneline
echo ""

echo "Note: GitHub requires a Personal Access Token (Classic or Fine-grained) with 'repo' scope."
echo "If you have one, paste it below. (Or press Enter to use standard browser/keychain auth):"
read -s -p "GitHub Token (hidden): " TOKEN
echo ""

if [ -n "$TOKEN" ]; then
    echo "Pushing with token..."
    git push "https://sinax321:${TOKEN}@github.com/sinax321/microcontroller.git" main
else
    echo "Pushing with git credentials..."
    git push -u origin main
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 SUCCESS! All commits are pushed to https://github.com/sinax321/microcontroller.git"
else
    echo ""
    echo "❌ Push failed. Please ensure your Personal Access Token has 'repo' permission enabled."
    echo "Generate a token at: https://github.com/settings/tokens"
fi

echo ""
read -p "Press [Enter] to exit..."
