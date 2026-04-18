import { describe, expect, it } from "vitest";
import process from "../flybit.js";

describe("flybit processor", () => {
  it("returns the original config when no named proxies exist", () => {
    const config = {
      proxies: [{ type: "ss" }],
      "proxy-groups": [{ name: "Old", type: "select", proxies: ["A"] }],
      rules: ["MATCH,DIRECT"],
    };

    expect(process(config)).toBe(config);
  });

  it("returns the original config when all named proxies are filtered by blacklist", () => {
    const config = {
      proxies: [
        { name: "邀请好友返现", type: "ss" },
        { name: "订阅地址发布页", type: "vmess" },
      ],
      "proxy-groups": [{ name: "Old", type: "select", proxies: ["A"] }],
      rules: ["MATCH,DIRECT"],
    };

    expect(process(config)).toBe(config);
  });

  it("replaces airport groups and writes local rules and providers", () => {
    const config = {
      proxies: [
        { name: "HK-01", type: "ss" },
        { name: "US-01", type: "vmess" },
      ],
      "proxy-groups": [
        {
          name: "Airport Auto",
          type: "url-test",
          proxies: ["HK-01", "US-01"],
        },
      ],
      "rule-providers": {
        old: {
          type: "http",
          behavior: "domain",
          format: "text",
          url: "https://example.com/old.txt",
          path: "./ruleset/old.yaml",
          interval: 86400,
        },
      },
      rules: ["MATCH,DIRECT"],
    };

    const result = process(config);

    expect(result).toMatchObject({
      proxies: config.proxies,
      "proxy-groups": [
        { name: "Proxy", type: "select", proxies: ["HK-01", "US-01"] },
        { name: "AI", type: "select", proxies: ["Proxy", "HK-01", "US-01"] },
        { name: "RC", type: "select", proxies: ["Proxy", "HK-01", "US-01"] },
        {
          name: "CN",
          type: "select",
          proxies: ["DIRECT", "Proxy", "HK-01", "US-01"],
        },
        {
          name: "Others",
          type: "select",
          proxies: ["DIRECT", "Proxy", "HK-01", "US-01"],
        },
      ],
      rules: [
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
      ],
    });

    expect(result["rule-providers"]).toMatchObject({
      old: config["rule-providers"].old,
      AiDomain: expect.any(Object),
      RcDomain: expect.any(Object),
      applications: expect.any(Object),
      private: expect.any(Object),
      reject: expect.any(Object),
      icloud: expect.any(Object),
      apple: expect.any(Object),
      google: expect.any(Object),
      proxy: expect.any(Object),
      direct: expect.any(Object),
      lancidr: expect.any(Object),
      cncidr: expect.any(Object),
      telegramcidr: expect.any(Object),
    });
  });
});
