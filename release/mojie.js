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

// subtrans/mojie.js
var NO_HK_AUTO = "NoHK-Auto";
var GPT_AUTO = "GPT-Auto";
var GOOGLE_GROUP = "\u8C37\u6B4C\u670D\u52A1";
var CHATGPT_GROUP = "ChatGPT";
var GEMINI_GROUP = "Gemini";
var HK_PATTERN = /香港|🇭🇰|hong[ -]?kong|\bHK(?=\b|\d)/i;
var GPT_PATTERN = /gpt/i;
var INFO_NODE_BLACKLIST = ["\u5269\u4F59\u6D41\u91CF", "\u5957\u9910\u5230\u671F", "\u8FC7\u6EE4\u6389"];
function buildAutoGroup(name, candidates) {
  return {
    name,
    type: "url-test",
    proxies: candidates.length > 0 ? candidates : ["REJECT"],
    url: "https://www.gstatic.com/generate_204",
    interval: 300,
    tolerance: 80,
    lazy: true
  };
}
function process(config) {
  const groups = Array.isArray(config["proxy-groups"]) ? config["proxy-groups"] : [];
  const chatgpt = groups.find((group) => group.name === CHATGPT_GROUP);
  const proxyNames = extractProxyNames(config, { blacklist: INFO_NODE_BLACKLIST });
  if (!chatgpt || proxyNames.length === 0) {
    return config;
  }
  const baseChoices = (chatgpt.proxies ?? []).filter(
    (name) => name !== NO_HK_AUTO && name !== GPT_AUTO
  );
  const chatgptChoices = [GPT_AUTO, NO_HK_AUTO, ...baseChoices];
  const googleChoices = [NO_HK_AUTO, GPT_AUTO, ...baseChoices];
  const noHkProxies = proxyNames.filter((name) => !HK_PATTERN.test(name));
  const gptProxies = noHkProxies.filter((name) => GPT_PATTERN.test(name));
  const nextGroups = groups.map((group) => {
    if (group.name === CHATGPT_GROUP || group.name === GEMINI_GROUP) {
      return { ...group, type: "select", proxies: [...chatgptChoices] };
    }
    if (group.name === GOOGLE_GROUP) {
      return { ...group, type: "select", proxies: [...googleChoices] };
    }
    return group;
  });
  return {
    ...config,
    "proxy-groups": [
      ...nextGroups,
      buildAutoGroup(NO_HK_AUTO, noHkProxies),
      buildAutoGroup(GPT_AUTO, gptProxies)
    ]
  };
}
export {
  GPT_AUTO,
  NO_HK_AUTO,
  process as default
};
