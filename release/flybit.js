// subtrans/common.js
var DEFAULT_PROXY_NAME_BLACKLIST = [
  "\u9080\u8BF7",
  "\u8FD4\u73B0",
  "\u8FD4\u4F63",
  "\u7F51\u5740",
  "\u516C\u544A",
  "\u5173\u6CE8",
  "\u8BA2\u9605"
];
var OWN_RULES_BASE_URL = "https://raw.githubusercontent.com/233mawile/proxy-rules/main/rules";
var LOYALSOLDIER_BASE_URL = "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release";
function isNamedProxy(proxy) {
  return typeof proxy === "object" && proxy !== null && typeof proxy.name === "string" && proxy.name.length > 0;
}
function isNonEmptyString(keyword) {
  return typeof keyword === "string" && keyword.length > 0;
}
function isBlacklistedProxyName(proxyName, blacklist) {
  return blacklist.some((keyword) => proxyName.includes(keyword));
}
function extractProxyNames(config, options = {}) {
  const proxies = Array.isArray(config?.proxies) ? config.proxies : [];
  const blacklist = [
    ...DEFAULT_PROXY_NAME_BLACKLIST,
    ...Array.isArray(options.blacklist) ? options.blacklist : []
  ].filter(isNonEmptyString);
  return proxies.filter(isNamedProxy).map((proxy) => proxy.name).filter((proxyName) => !isBlacklistedProxyName(proxyName, blacklist));
}
function buildProxyGroups(proxyNames) {
  return [
    {
      name: "Proxy",
      type: "select",
      proxies: [...proxyNames]
    },
    {
      name: "AI",
      type: "select",
      proxies: ["Proxy", ...proxyNames]
    },
    {
      name: "RC",
      type: "select",
      proxies: ["Proxy", ...proxyNames]
    },
    {
      name: "Others",
      type: "select",
      proxies: ["DIRECT", "Proxy", ...proxyNames]
    }
  ];
}
function buildRuleProviders() {
  return {
    AiDomain: {
      type: "http",
      behavior: "classical",
      format: "text",
      url: `${OWN_RULES_BASE_URL}/ai.list`,
      path: "./ruleset/AiDomain.list",
      interval: 86400
    },
    RcDomain: {
      type: "http",
      behavior: "classical",
      format: "text",
      url: `${OWN_RULES_BASE_URL}/rc.list`,
      path: "./ruleset/RcDomain.list",
      interval: 86400
    },
    applications: {
      type: "http",
      behavior: "classical",
      format: "text",
      url: `${LOYALSOLDIER_BASE_URL}/applications.txt`,
      path: "./ruleset/applications.yaml",
      interval: 86400
    },
    private: {
      type: "http",
      behavior: "domain",
      format: "text",
      url: `${LOYALSOLDIER_BASE_URL}/private.txt`,
      path: "./ruleset/private.yaml",
      interval: 86400
    },
    reject: {
      type: "http",
      behavior: "domain",
      format: "text",
      url: `${LOYALSOLDIER_BASE_URL}/reject.txt`,
      path: "./ruleset/reject.yaml",
      interval: 86400
    },
    "tld-not-cn": {
      type: "http",
      behavior: "domain",
      format: "text",
      url: `${LOYALSOLDIER_BASE_URL}/tld-not-cn.txt`,
      path: "./ruleset/tld-not-cn.yaml",
      interval: 86400
    },
    gfw: {
      type: "http",
      behavior: "domain",
      format: "text",
      url: `${LOYALSOLDIER_BASE_URL}/gfw.txt`,
      path: "./ruleset/gfw.yaml",
      interval: 86400
    },
    telegramcidr: {
      type: "http",
      behavior: "ipcidr",
      format: "text",
      url: `${LOYALSOLDIER_BASE_URL}/telegramcidr.txt`,
      path: "./ruleset/telegramcidr.yaml",
      interval: 86400
    }
  };
}
function buildBlacklistRules() {
  return [
    "RULE-SET,AiDomain,AI",
    "RULE-SET,RcDomain,RC",
    "RULE-SET,applications,DIRECT",
    "DOMAIN,clash.razord.top,DIRECT",
    "DOMAIN,yacd.haishan.me,DIRECT",
    "RULE-SET,private,DIRECT",
    "RULE-SET,reject,REJECT",
    "RULE-SET,tld-not-cn,Proxy",
    "RULE-SET,gfw,Proxy",
    "RULE-SET,telegramcidr,Proxy",
    "MATCH,Others"
  ];
}

// subtrans/flybit.js
function process(config) {
  const proxyNames = extractProxyNames(config);
  if (proxyNames.length === 0) {
    return config;
  }
  return {
    ...config,
    "proxy-groups": buildProxyGroups(proxyNames),
    "rule-providers": {
      ...config["rule-providers"] ?? {},
      ...buildRuleProviders()
    },
    rules: buildBlacklistRules()
  };
}
export {
  process as default
};
