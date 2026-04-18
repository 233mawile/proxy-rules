import { describe, expect, it } from "vitest";
import {
  buildRules,
  buildProxyGroups,
  buildRuleProviders,
  extractProxyNames,
} from "../common.js";

describe("extractProxyNames", () => {
  it("returns named proxies only", () => {
    const config = {
      proxies: [
        { name: "HK-01", type: "ss" },
        { type: "ss" },
        null,
        { name: "JP-01", type: "vmess" },
      ],
    };

    expect(extractProxyNames(config)).toEqual(["HK-01", "JP-01"]);
  });

  it("filters proxy names by the built-in blacklist keywords", () => {
    const config = {
      proxies: [
        { name: "HK-01", type: "ss" },
        { name: "机场订阅地址", type: "ss" },
        { name: "关注频道获取节点", type: "vmess" },
      ],
    };

    expect(extractProxyNames(config)).toEqual(["HK-01"]);
  });

  it("appends caller-provided blacklist keywords", () => {
    const config = {
      proxies: [
        { name: "HK-01", type: "ss" },
        { name: "US-实验性", type: "vmess" },
        { name: "JP-01", type: "trojan" },
      ],
    };

    expect(
      extractProxyNames(config, {
        blacklist: ["实验", "", /** @type {any} */ (null)],
      }),
    ).toEqual(["HK-01", "JP-01"]);
  });
});

describe("buildProxyGroups", () => {
  it("builds the five local select groups in order", () => {
    expect(buildProxyGroups(["HK-01", "JP-01"])).toEqual([
      { name: "Proxy", type: "select", proxies: ["HK-01", "JP-01"] },
      { name: "AI", type: "select", proxies: ["Proxy", "HK-01", "JP-01"] },
      { name: "RC", type: "select", proxies: ["Proxy", "HK-01", "JP-01"] },
      {
        name: "CN",
        type: "select",
        proxies: ["DIRECT", "Proxy", "HK-01", "JP-01"],
      },
      {
        name: "Others",
        type: "select",
        proxies: ["DIRECT", "Proxy", "HK-01", "JP-01"],
      },
    ]);
  });
});

describe("buildRuleProviders", () => {
  it("builds local and remote whitelist providers", () => {
    expect(buildRuleProviders()).toMatchObject({
      AiDomain: {
        type: "http",
        behavior: "classical",
        format: "text",
        url: "https://raw.githubusercontent.com/233mawile/proxy-rules/main/rules/ai.list",
      },
      RcDomain: {
        type: "http",
        behavior: "classical",
        format: "text",
        path: "./ruleset/RcDomain.list",
        url: "https://raw.githubusercontent.com/233mawile/proxy-rules/main/rules/rc.list",
      },
      applications: {
        type: "http",
        behavior: "classical",
        path: "./ruleset/applications.yaml",
        url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/applications.txt",
      },
      private: {
        type: "http",
        behavior: "domain",
        path: "./ruleset/private.yaml",
        url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/private.txt",
      },
      reject: {
        type: "http",
        behavior: "domain",
        path: "./ruleset/reject.yaml",
        url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/reject.txt",
      },
      icloud: {
        type: "http",
        behavior: "domain",
        path: "./ruleset/icloud.yaml",
        url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/icloud.txt",
      },
      apple: {
        type: "http",
        behavior: "domain",
        path: "./ruleset/apple.yaml",
        url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/apple.txt",
      },
      google: {
        type: "http",
        behavior: "domain",
        path: "./ruleset/google.yaml",
        url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/google.txt",
      },
      proxy: {
        type: "http",
        behavior: "domain",
        path: "./ruleset/proxy.yaml",
        url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/proxy.txt",
      },
      direct: {
        type: "http",
        behavior: "domain",
        path: "./ruleset/direct.yaml",
        url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/direct.txt",
      },
      lancidr: {
        type: "http",
        behavior: "ipcidr",
        path: "./ruleset/lancidr.yaml",
        url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/lancidr.txt",
      },
      cncidr: {
        type: "http",
        behavior: "ipcidr",
        path: "./ruleset/cncidr.yaml",
        url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/cncidr.txt",
      },
      telegramcidr: {
        type: "http",
        behavior: "ipcidr",
        path: "./ruleset/telegramcidr.yaml",
        url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/telegramcidr.txt",
      },
    });
  });
});

describe("buildRules", () => {
  it("puts ai and rc rules ahead of whitelist rules and sends fallback to Others", () => {
    expect(buildRules()).toEqual([
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
    ]);
  });
});
