# Formula for georgiosnikitas/homebrew-brain-break
# Copy this file to the tap repo: https://github.com/georgiosnikitas/homebrew-brain-break

class BrainBreak < Formula
  desc "An AI-powered terminal quiz app"
  homepage "https://github.com/georgiosnikitas/brain-break"
  url "https://github.com/georgiosnikitas/brain-break/archive/refs/tags/v1.6.0.tar.gz"
  # Run this to get the sha256:
  #   curl -sL https://github.com/georgiosnikitas/brain-break/archive/refs/tags/v1.6.0.tar.gz | sha256sum
  sha256 "PLACEHOLDER_SHA256"
  license "MIT"
  head "https://github.com/georgiosnikitas/brain-break.git", branch: "main"

  depends_on "node"

  def install
    # Verify node version meets the minimum requirement (>= 25.8.0)
    node_version = Utils.safe_popen_read(Formula["node"].opt_bin/"node", "--version").strip
    odie "brain-break requires Node.js >= 25.8.0 (found #{node_version})" if Version.new(node_version.delete_prefix("v")) < Version.new("25.8.0")

    # Install all dependencies (devDependencies needed for tsc and patch-package)
    system "npm", "install"
    # Compile TypeScript to dist/
    system "npm", "run", "build"

    # Install dist/ and runtime node_modules into libexec
    libexec.install "dist", "node_modules", "package.json"

    # Create a wrapper that ensures the Homebrew-managed node is used
    (bin/"brain-break").write_env_script "#{libexec}/dist/index.js",
      PATH: "#{Formula["node"].opt_bin}:$PATH"
  end

  test do
    # brain-break is interactive; verify it launches and exits non-zero without a TTY
    assert_match "brain-break", shell_output("#{bin}/brain-break 2>&1", 1)
  end
end
