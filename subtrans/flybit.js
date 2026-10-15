import {
  DEFAULT_DNS_CONFIG,
  buildRules,
  buildProxyGroups,
  buildRuleProviders,
  extractProxyNames,
} from "./common.js";

/** Regional node-name matchers and within-region switching tolerances (ms). */
const AUTO_REGIONS = [
  { name: "HK-Auto", pattern: /香港|🇭🇰|hong[ -]?kong|\bHK(?=\b|\d)/i, tolerance: 40 },
  { name: "SG-Auto", pattern: /新加坡|狮城|獅城|🇸🇬|singapore|\bSG(?=\b|\d)/i, tolerance: 80 },
  { name: "TW-Auto", pattern: /台湾|台灣|🇹🇼|taiwan|\bTW(?=\b|\d)/i, tolerance: 80 },
  { name: "PH-Auto", pattern: /菲律宾|菲律賓|🇵🇭|philippines|\bPH(?=\b|\d)/i, tolerance: 80 },
  { name: "JP-Auto", pattern: /日本|🇯🇵|japan|\bJP(?=\b|\d)/i, tolerance: 80 },
];

/** Health checks shared by regional groups and their parent groups. */
const AUTO_HEALTH_CHECK = {
  url: "https://www.gstatic.com/generate_204",
  interval: 300,
  lazy: true,
};

/**
 * Builds Flybit's regional automation and manual selectors. Empty regions are
 * omitted; parents without eligible regions reject rather than use another country.
 *
 * @param {string[]} proxyNames
 * @returns {import("subtrans/types").ProxyGroup[]}
 */
function buildFlybitProxyGroups(proxyNames) {
  const regionalGroups = AUTO_REGIONS.map(({ name, pattern, tolerance }) => ({
    name,
    type: /** @type {const} */ ("url-test"),
    proxies: proxyNames.filter((proxyName) => pattern.test(proxyName)),
    tolerance,
    ...AUTO_HEALTH_CHECK,
  })).filter((group) => group.proxies.length > 0);
  const availableRegions = new Set(regionalGroups.map((group) => group.name));

  /**
   * @param {string[]} names
   * @returns {string[]}
   */
  function available(names) {
    const matches = names.filter((name) => availableRegions.has(name));
    return matches.length > 0 ? matches : ["REJECT"];
  }

  const selectors = buildProxyGroups(proxyNames).map((group) => {
    const isAi = group.name === "AI";
    const auto = isAi ? "AI-Auto" : "Auto";
    const regions = isAi
      ? ["PH-Auto", "SG-Auto", "JP-Auto", "HK-Auto", "TW-Auto"]
      : AUTO_REGIONS.map(({ name }) => name);
    const manual = isAi ? proxyNames : (group.proxies ?? []);
    return {
      ...group,
      proxies: [auto, ...regions.filter((name) => availableRegions.has(name)), ...manual],
      "default-selected": group.name === "Proxy" || isAi ? auto : manual[0],
    };
  });

  return [
    ...selectors,
    {
      name: "Auto",
      type: "url-test",
      proxies: available(["HK-Auto", "SG-Auto", "TW-Auto"]),
      tolerance: 120,
      ...AUTO_HEALTH_CHECK,
    },
    {
      name: "AI-Auto",
      type: "fallback",
      proxies: available(["PH-Auto", "SG-Auto", "JP-Auto"]),
      ...AUTO_HEALTH_CHECK,
    },
    ...regionalGroups,
  ];
}

/**
 * Rebuilds Flybit routing with regional automation, DNS, and unified delay testing.
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
    "unified-delay": true,
    dns: DEFAULT_DNS_CONFIG,
    "proxy-groups": buildFlybitProxyGroups(proxyNames),
    "rule-providers": {
      ...(config["rule-providers"] ?? {}),
      ...buildRuleProviders(),
    },
    rules: buildRules(),
  };
}
