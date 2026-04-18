/**
 * @typedef {import("subtrans/types").ClashConfig} ClashConfig
 * @typedef {import("subtrans/types").Proxy} Proxy
 * @typedef {import("subtrans/types").ProxyGroup} ProxyGroup
 * @typedef {import("subtrans/types").RuleProvider} RuleProvider
 */

const OWN_RULES_BASE_URL =
  "https://cdn.jsdelivr.net/gh/233mawile/proxy-rules@main/rules";
const LOYALSOLDIER_BASE_URL =
  "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release";

/**
 * @param {unknown} proxy
 * @returns {proxy is Proxy}
 */
function isNamedProxy(proxy) {
  return (
    typeof proxy === "object" &&
    proxy !== null &&
    typeof proxy.name === "string" &&
    proxy.name.length > 0
  );
}

/**
 * @param {ClashConfig} config
 * @returns {string[]}
 */
export function extractProxyNames(config) {
  const proxies = Array.isArray(config?.proxies) ? config.proxies : [];

  return proxies.filter(isNamedProxy).map((proxy) => proxy.name);
}

/**
 * @param {string[]} proxyNames
 * @returns {ProxyGroup[]}
 */
export function buildProxyGroups(proxyNames) {
  return [
    {
      name: "Proxy",
      type: "select",
      proxies: [...proxyNames],
    },
    {
      name: "AI",
      type: "select",
      proxies: ["Proxy", ...proxyNames],
    },
    {
      name: "RC",
      type: "select",
      proxies: ["Proxy", ...proxyNames],
    },
    {
      name: "Others",
      type: "select",
      proxies: ["DIRECT", "Proxy", ...proxyNames],
    },
  ];
}

/**
 * @returns {Record<string, RuleProvider>}
 */
export function buildRuleProviders() {
  return {
    AiDomain: {
      type: "http",
      behavior: "classical",
      format: "text",
      url: `${OWN_RULES_BASE_URL}/ai.list`,
      path: "./ruleset/AiDomain.list",
      interval: 86400,
    },
    RcDomain: {
      type: "http",
      behavior: "classical",
      format: "text",
      url: `${OWN_RULES_BASE_URL}/rc.list`,
      path: "./ruleset/RcDomain.list",
      interval: 86400,
    },
    "tld-not-cn": {
      type: "http",
      behavior: "domain",
      format: "text",
      url: `${LOYALSOLDIER_BASE_URL}/tld-not-cn.txt`,
      path: "./ruleset/tld-not-cn.yaml",
      interval: 86400,
    },
    gfw: {
      type: "http",
      behavior: "domain",
      format: "text",
      url: `${LOYALSOLDIER_BASE_URL}/gfw.txt`,
      path: "./ruleset/gfw.yaml",
      interval: 86400,
    },
    telegramcidr: {
      type: "http",
      behavior: "ipcidr",
      format: "text",
      url: `${LOYALSOLDIER_BASE_URL}/telegramcidr.txt`,
      path: "./ruleset/telegramcidr.yaml",
      interval: 86400,
    },
  };
}

/**
 * @returns {string[]}
 */
export function buildBlacklistRules() {
  return [
    "RULE-SET,AiDomain,AI",
    "RULE-SET,RcDomain,RC",
    "RULE-SET,tld-not-cn,Proxy",
    "RULE-SET,gfw,Proxy",
    "RULE-SET,telegramcidr,Proxy",
    "MATCH,Others",
  ];
}
