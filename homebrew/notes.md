# Homebrew Tap — Setup & Release Notes

## One-time setup

1. Create the tap repo on GitHub named exactly `homebrew-brain-break`:
   `https://github.com/georgiosnikitas/homebrew-brain-break`

2. Copy the contents of this folder into the tap repo root:
   ```sh
   cp homebrew/Formula/brain-break.rb <tap-repo>/Formula/brain-break.rb
   cp homebrew/README.md <tap-repo>/README.md
   ```

3. Push a git tag for the current version (if not already):
   ```sh
   git tag v1.6.0 && git push origin v1.6.0
   ```

4. Run the release script to populate the SHA256 and update the formula:
   ```sh
   ./scripts/release-homebrew.sh 1.6.0
   ```

5. Commit and push the formula to the tap repo, then test:
   ```sh
   brew tap georgiosnikitas/brain-break
   brew install brain-break
   ```

## Releasing a new version

```sh
# 1. Tag the new version
git tag v<new-version> && git push origin v<new-version>

# 2. Update the formula with the new URL + SHA256
./scripts/release-homebrew.sh <new-version>

# 3. Copy to the tap repo and push
cp homebrew/Formula/brain-break.rb <tap-repo>/Formula/brain-break.rb
cd <tap-repo>
git add Formula/brain-break.rb
git commit -m "brain-break <new-version>"
git push
```

## Note on Node.js version

The formula depends on Homebrew's `node` formula and verifies `>= 25.8.0` at install time.
If Homebrew's node is behind, consider:
- Using a custom node tap that tracks v25+
- Bundling a standalone binary with `bun build --compile` to remove the Node.js dependency entirely
