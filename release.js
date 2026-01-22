const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const packagePath = path.join(__dirname, 'package.json');

function readPackageVersion() {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  return pkg.version;
}

function updatePackageVersion(newVersion) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  pkg.version = newVersion;
  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
}

function runCommand(command, description) {
  console.log(`\n> ${description}`);
  console.log(`  $ ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return false;
  }
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

  const currentVersion = readPackageVersion();
  console.log(`\nCurrent version: ${currentVersion}`);

  const newVersion = await question('Enter new version (without "v" prefix): ');

  if (!newVersion || !/^\d+\.\d+\.\d+$/.test(newVersion)) {
    console.error('Invalid version format. Please use format: X.Y.Z (e.g., 1.0.12)');
    rl.close();
    process.exit(1);
  }

  if (newVersion === currentVersion) {
    console.error('New version is the same as current version.');
    rl.close();
    process.exit(1);
  }

  console.log(`\nThis will:`);
  console.log(`  1. Update package.json version to ${newVersion}`);
  console.log(`  2. Stage all changes`);
  console.log(`  3. Commit with message "Bump version to ${newVersion}"`);
  console.log(`  4. Create tag v${newVersion}`);
  console.log(`  5. Push to origin main with tags`);

  const confirm = await question('\nProceed? (y/n): ');

  if (confirm.toLowerCase() !== 'y') {
    console.log('Cancelled.');
    rl.close();
    process.exit(0);
  }

  rl.close();

  // Update package.json
  console.log(`\n> Updating package.json to version ${newVersion}`);
  updatePackageVersion(newVersion);

  // Run git commands
  const commands = [
    { cmd: 'git add .', desc: 'Staging all changes' },
    { cmd: `git commit -m "Bump version to ${newVersion}"`, desc: 'Creating commit' },
    { cmd: `git tag v${newVersion}`, desc: `Creating tag v${newVersion}` },
    { cmd: 'git push origin main --tags', desc: 'Pushing to origin with tags' }
  ];

  for (const { cmd, desc } of commands) {
    if (!runCommand(cmd, desc)) {
      console.error('\nRelease process failed. Please check the error above.');
      process.exit(1);
    }
  }

  console.log(`\n✓ Successfully released version ${newVersion}`);
  console.log(`  GitHub Actions should now build the release.`);
}

main();
