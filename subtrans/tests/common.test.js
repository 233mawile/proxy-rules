import { describe, expect, it } from "vitest";
import {
  buildBlacklistRules,
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
});

describe("buildProxyGroups", () => {
  it("builds the four local select groups in order", () => {
    expect(buildProxyGroups(["HK-01", "JP-01"])).toEqual([
      { name: "Proxy", type: "select", proxies: ["HK-01", "JP-01"] },
      { name: "AI", type: "select", proxies: ["Proxy", "HK-01", "JP-01"] },
      { name: "RC", type: "select", proxies: ["Proxy", "HK-01", "JP-01"] },
      {
        name: "Others",
        type: "select",
        proxies: ["DIRECT", "Proxy", "HK-01", "JP-01"],
      },
    ]);
  });
});

describe("buildRuleProviders", () => {
  it("builds local and jsdelivr blacklist providers", () => {
    expect(buildRuleProviders()).toMatchObject({
      AiDomain: {
        type: "http",
        behavior: "classical",
        format: "text",
        url: "https://cdn.jsdelivr.net/gh/233mawile/proxy-rules@main/rules/ai.list",
      },
      RcDomain: {
        type: "http",
        behavior: "classical",
        format: "text",
        path: "./ruleset/RcDomain.list",
        url: "https://cdn.jsdelivr.net/gh/233mawile/proxy-rules@main/rules/rc.list",
      },
      "tld-not-cn": {
        type: "http",
        behavior: "domain",
        format: "text",
        url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/tld-not-cn.txt",
      },
      gfw: {
        type: "http",
        behavior: "domain",
        format: "text",
        url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/gfw.txt",
      },
      telegramcidr: {
        type: "http",
        behavior: "ipcidr",
        format: "text",
        url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/telegramcidr.txt",
      },
    });
  });
});

describe("buildBlacklistRules", () => {
  it("puts ai and rc rules ahead of blacklist and sends fallback to Others", () => {
    expect(buildBlacklistRules()).toEqual([
      "RULE-SET,AiDomain,AI",
      "RULE-SET,RcDomain,RC",
      "RULE-SET,tld-not-cn,Proxy",
      "RULE-SET,gfw,Proxy",
      "RULE-SET,telegramcidr,Proxy",
      "MATCH,Others",
    ]);
  });
});
