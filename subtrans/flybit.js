import {
  DEFAULT_DNS_CONFIG,
  buildRules,
  buildProxyGroups,
  buildRuleProviders,
  extractProxyNames,
} from "./common.js";

/**
 * Rebuilds the local routing groups, rules, and DNS defaults for Flybit.
 *
 * @type {import("subtrans/types").Processor}
 */
export default function process(config) {
  const proxyNames = extractProxyNames(config);

  if (proxyNames.length === 0) {
    return config;
  }

  return {
    ...config,
    dns: DEFAULT_DNS_CONFIG,
    "proxy-groups": buildProxyGroups(proxyNames),
    "rule-providers": {
      ...(config["rule-providers"] ?? {}),
      ...buildRuleProviders(),
    },
    rules: buildRules(),
  };
}
