import {
  buildBlacklistRules,
  buildProxyGroups,
  buildRuleProviders,
  extractProxyNames,
} from "./common.js";

/** @type {import("subtrans/types").Processor} */
export default function process(config) {
  const proxyNames = extractProxyNames(config);

  if (proxyNames.length === 0) {
    return config;
  }

  return {
    ...config,
    "proxy-groups": buildProxyGroups(proxyNames),
    "rule-providers": {
      ...(config["rule-providers"] ?? {}),
      ...buildRuleProviders(),
    },
    rules: buildBlacklistRules(),
  };
}
