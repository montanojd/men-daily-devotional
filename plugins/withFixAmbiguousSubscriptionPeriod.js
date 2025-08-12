// Config plugin to patch Pods Swift files to disambiguate SubscriptionPeriod references
// It replaces bare `SubscriptionPeriod(` with `RevenueCat.SubscriptionPeriod(` to avoid ambiguity with StoreKit types.

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function addSubscriptionPeriodPatch(podfileContent) {
  const tag = '# fix_ambiguous_subscription_period';
  if (podfileContent.includes(tag)) {
    return podfileContent; // Already patched
  }

  const patchCode = `
  ${tag}
  # Disambiguate SubscriptionPeriod references in Pods
  Dir.glob('Pods/**/*.swift').each do |file|
    begin
      content = File.read(file)
      # Replace unqualified SubscriptionPeriod( with RevenueCat.SubscriptionPeriod(
      new_content = content.gsub(/([^\\w\\.])SubscriptionPeriod(\\s*\\()/, "\\1RevenueCat.SubscriptionPeriod\\2")
      if new_content != content
        File.open(file, 'w') { |f| f.write(new_content) }
        puts "[Patch] Disambiguated SubscriptionPeriod in #{file}"
      end
    rescue => e
      puts "[Patch] Error processing #{file}: #{e}"
    end
  end`;

  // Check if there's already a post_install hook
  const postInstallRegex = /post_install\s+do\s+\|installer\|/;
  
  if (postInstallRegex.test(podfileContent)) {
    // Insert our code at the end of the existing post_install block
    const endRegex = /(\s+end\s*$)/m;
    return podfileContent.replace(endRegex, `${patchCode}\n$1`);
  } else {
    // Add a new post_install hook at the end
    const newPostInstall = `
post_install do |installer|${patchCode}
end
`;
    return podfileContent.trimEnd() + "\n" + newPostInstall;
  }
}

module.exports = function withFixAmbiguousSubscriptionPeriod(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      
      if (fs.existsSync(podfilePath)) {
        let podfileContent = fs.readFileSync(podfilePath, 'utf8');
        podfileContent = addSubscriptionPeriodPatch(podfileContent);
        fs.writeFileSync(podfilePath, podfileContent);
        console.log('[Plugin] Added SubscriptionPeriod disambiguation to Podfile');
      } else {
        console.warn('[Plugin] Podfile not found, skipping patch');
      }
      
      return config;
    },
  ]);
};
