/**
 * @typedef {import("subtrans/types").ClashConfig} ClashConfig
 * @typedef {import("subtrans/types").DnsConfig} DnsConfig
 * @typedef {import("subtrans/types").Proxy} Proxy
 * @typedef {import("subtrans/types").ProxyGroup} ProxyGroup
 * @typedef {import("subtrans/types").RuleProvider} RuleProvider
 */

const DEFAULT_PROXY_NAME_BLACKLIST = [
  "邀请",
  "返现",
  "返佣",
  "网址",
  "公告",
  "关注",
  "订阅",
];

const OWN_RULES_BASE_URL =
  "https://raw.githubusercontent.com/233mawile/proxy-rules/main/rules";
const LOYALSOLDIER_BASE_URL =
  "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release";

/**
 * Shared Clash DNS settings used by published processors.
 *
 * @type {DnsConfig}
 */
export const DEFAULT_DNS_CONFIG = {
  enable: true,
  listen: "0.0.0.0:53",
  "enhanced-mode": "fake-ip",
  "fake-ip-range": "198.18.0.1/16",
  "default-nameserver": ["119.29.29.29", "223.5.5.5", "223.6.6.6"],
  nameserver: ["https://doh.pub/dns-query", "https://dns.alidns.com/dns-query"],
  "fake-ip-filter": [
    "*.lan",
    "*.localdomain",
    "*.example",
    "*.invalid",
    "*.localhost",
    "*.test",
    "*.local",
    "*.home.arpa",
    "time.*.com",
    "time.*.gov",
    "time.*.edu.cn",
    "time.*.apple.com",
    "time1.*.com",
    "time2.*.com",
    "time3.*.com",
    "time4.*.com",
    "time5.*.com",
    "time6.*.com",
    "time7.*.com",
    "ntp.*.com",
    "ntp1.*.com",
    "ntp2.*.com",
    "ntp3.*.com",
    "ntp4.*.com",
    "ntp5.*.com",
    "ntp6.*.com",
    "ntp7.*.com",
    "*.time.edu.cn",
    "*.ntp.org.cn",
    "+.pool.ntp.org",
    "time1.cloud.tencent.com",
    "music.163.com",
    "*.music.163.com",
    "*.126.net",
    "musicapi.taihe.com",
    "music.taihe.com",
    "songsearch.kugou.com",
    "trackercdn.kugou.com",
    "*.kuwo.cn",
    "api-jooxtt.sanook.com",
    "api.joox.com",
    "joox.com",
    "y.qq.com",
    "*.y.qq.com",
    "streamoc.music.tc.qq.com",
    "mobileoc.music.tc.qq.com",
    "isure.stream.qqmusic.qq.com",
    "dl.stream.qqmusic.qq.com",
    "aqqmusic.tc.qq.com",
    "amobile.music.tc.qq.com",
    "*.xiami.com",
    "*.music.migu.cn",
    "music.migu.cn",
    "*.msftconnecttest.com",
    "*.msftncsi.com",
    "msftconnecttest.com",
    "msftncsi.com",
    "localhost.ptlogin2.qq.com",
    "localhost.sec.qq.com",
    "+.srv.nintendo.net",
    "+.stun.playstation.net",
    "xbox.*.microsoft.com",
    "xnotify.xboxlive.com",
    "+.battlenet.com.cn",
    "+.wotgame.cn",
    "+.wggames.cn",
    "+.wowsgame.cn",
    "+.wargaming.net",
    "proxy.golang.org",
    "stun.*.*",
    "stun.*.*.*",
    "+.stun.*.*",
    "+.stun.*.*.*",
    "+.stun.*.*.*.*",
    "heartbeat.belkin.com",
    "*.linksys.com",
    "*.linksyssmartwifi.com",
    "*.router.asus.com",
    "mesu.apple.com",
    "swscan.apple.com",
    "swquery.apple.com",
    "swdownload.apple.com",
    "swcdn.apple.com",
    "swdist.apple.com",
    "lens.l.google.com",
    "stun.l.google.com",
    "+.nflxvideo.net",
    "*.square-enix.com",
    "*.finalfantasyxiv.com",
    "*.ffxiv.com",
  ],
};

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
 * @param {unknown} keyword
 * @returns {keyword is string}
 */
function isNonEmptyString(keyword) {
  return typeof keyword === "string" && keyword.length > 0;
}

/**
 * @param {string} proxyName
 * @param {string[]} blacklist
 * @returns {boolean}
 */
function isBlacklistedProxyName(proxyName, blacklist) {
  return blacklist.some((keyword) => proxyName.includes(keyword));
}

/**
 * @param {ClashConfig} config
 * @param {{ blacklist?: string[] }} [options]
 * @returns {string[]}
 */
export function extractProxyNames(config, options = {}) {
  const proxies = Array.isArray(config?.proxies) ? config.proxies : [];
  const blacklist = [
    ...DEFAULT_PROXY_NAME_BLACKLIST,
    ...(Array.isArray(options.blacklist) ? options.blacklist : []),
  ].filter(isNonEmptyString);

  return proxies
    .filter(isNamedProxy)
    .map((proxy) => proxy.name)
    .filter((proxyName) => !isBlacklistedProxyName(proxyName, blacklist));
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
      name: "CN",
      type: "select",
      proxies: ["DIRECT", "Proxy", ...proxyNames],
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
    applications: {
      type: "http",
      behavior: "classical",
      url: `${LOYALSOLDIER_BASE_URL}/applications.txt`,
      path: "./ruleset/applications.yaml",
      interval: 86400,
    },
    private: {
      type: "http",
      behavior: "domain",
      url: `${LOYALSOLDIER_BASE_URL}/private.txt`,
      path: "./ruleset/private.yaml",
      interval: 86400,
    },
    reject: {
      type: "http",
      behavior: "domain",
      url: `${LOYALSOLDIER_BASE_URL}/reject.txt`,
      path: "./ruleset/reject.yaml",
      interval: 86400,
    },
    icloud: {
      type: "http",
      behavior: "domain",
      url: `${LOYALSOLDIER_BASE_URL}/icloud.txt`,
      path: "./ruleset/icloud.yaml",
      interval: 86400,
    },
    apple: {
      type: "http",
      behavior: "domain",
      url: `${LOYALSOLDIER_BASE_URL}/apple.txt`,
      path: "./ruleset/apple.yaml",
      interval: 86400,
    },
    google: {
      type: "http",
      behavior: "domain",
      url: `${LOYALSOLDIER_BASE_URL}/google.txt`,
      path: "./ruleset/google.yaml",
      interval: 86400,
    },
    proxy: {
      type: "http",
      behavior: "domain",
      url: `${LOYALSOLDIER_BASE_URL}/proxy.txt`,
      path: "./ruleset/proxy.yaml",
      interval: 86400,
    },
    direct: {
      type: "http",
      behavior: "domain",
      url: `${LOYALSOLDIER_BASE_URL}/direct.txt`,
      path: "./ruleset/direct.yaml",
      interval: 86400,
    },
    lancidr: {
      type: "http",
      behavior: "ipcidr",
      url: `${LOYALSOLDIER_BASE_URL}/lancidr.txt`,
      path: "./ruleset/lancidr.yaml",
      interval: 86400,
    },
    cncidr: {
      type: "http",
      behavior: "ipcidr",
      url: `${LOYALSOLDIER_BASE_URL}/cncidr.txt`,
      path: "./ruleset/cncidr.yaml",
      interval: 86400,
    },
    telegramcidr: {
      type: "http",
      behavior: "ipcidr",
      url: `${LOYALSOLDIER_BASE_URL}/telegramcidr.txt`,
      path: "./ruleset/telegramcidr.yaml",
      interval: 86400,
    },
  };
}

/**
 * @returns {string[]}
 */
export function buildRules() {
  return [
    "RULE-SET,AiDomain,AI",
    "RULE-SET,RcDomain,RC",
    "RULE-SET,applications,DIRECT",
    "DOMAIN,clash.razord.top,DIRECT",
    "DOMAIN,yacd.haishan.me,DIRECT",
    "RULE-SET,private,DIRECT",
    "RULE-SET,reject,REJECT",
    "RULE-SET,icloud,CN",
    "RULE-SET,apple,CN",
    "RULE-SET,google,Proxy",
    "RULE-SET,proxy,Proxy",
    "RULE-SET,direct,CN",
    "RULE-SET,lancidr,DIRECT",
    "RULE-SET,cncidr,CN",
    "RULE-SET,telegramcidr,Proxy",
    "GEOIP,LAN,DIRECT",
    "GEOIP,CN,CN",
    "MATCH,Others",
  ];
}
