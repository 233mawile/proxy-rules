import { describe, expect, it } from "vitest";
import { DEFAULT_DNS_CONFIG } from "../common.js";
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
      "unified-delay": true,
      "proxy-groups": [
        { name: "Proxy", type: "select", proxies: ["Auto", "HK-Auto", "HK-01", "US-01"], "default-selected": "Auto" },
        { name: "AI", type: "select", proxies: ["AI-Auto", "HK-Auto", "HK-01", "US-01"], "default-selected": "AI-Auto" },
        { name: "RC", type: "select", proxies: ["Auto", "HK-Auto", "Proxy", "HK-01", "US-01"], "default-selected": "Proxy" },
        {
          name: "CN",
          type: "select",
          proxies: ["Auto", "HK-Auto", "DIRECT", "Proxy", "HK-01", "US-01"],
          "default-selected": "DIRECT",
        },
        {
          name: "Others",
          type: "select",
          proxies: ["Auto", "HK-Auto", "DIRECT", "Proxy", "HK-01", "US-01"],
          "default-selected": "DIRECT",
        },
        { name: "Auto", type: "url-test", tolerance: 120, proxies: ["HK-Auto"] },
        { name: "AI-Auto", type: "fallback", proxies: ["REJECT"] },
        { name: "HK-Auto", type: "url-test", tolerance: 40, proxies: ["HK-01"] },
      ],
      rules: [
        "RULE-SET,AiDomain,AI",
        "RULE-SET,RcDomain,RC",
        "RULE-SET,ExternalSteamCnDomain,DIRECT",
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

    expect(result.dns).toBe(DEFAULT_DNS_CONFIG);
  });

  it("builds ordered regional groups with distinct switching tolerances", () => {
    const names = ["JP01", "🇵🇭 菲律宾 01", "TW-01", "Singapore 01", "香港 01", "HK02", "US01"];
    const result = process({ proxies: names.map((name) => ({ name, type: "ss" })) });
    const groups = result["proxy-groups"];
    const find = (name) => groups.find((group) => group.name === name);

    expect(find("Auto")).toMatchObject({
      type: "url-test", tolerance: 120, proxies: ["HK-Auto", "SG-Auto", "TW-Auto"],
    });
    expect(find("AI-Auto")).toMatchObject({
      type: "fallback", proxies: ["PH-Auto", "SG-Auto", "JP-Auto"],
    });
    expect(find("HK-Auto")).toMatchObject({ tolerance: 40, proxies: ["香港 01", "HK02"] });
    expect(find("SG-Auto")).toMatchObject({ tolerance: 80, proxies: ["Singapore 01"] });
    expect(find("TW-Auto")).toMatchObject({ tolerance: 80, proxies: ["TW-01"] });
    expect(find("PH-Auto")).toMatchObject({ tolerance: 80, proxies: ["🇵🇭 菲律宾 01"] });
    expect(find("JP-Auto")).toMatchObject({ tolerance: 80, proxies: ["JP01"] });
    expect(find("AI").proxies).not.toContain("Proxy");
    expect(find("AI").proxies).not.toContain("Auto");
    for (const name of ["Proxy", "RC", "CN", "Others"]) {
      expect(find(name).proxies.slice(0, 6)).toEqual([
        "Auto", "HK-Auto", "SG-Auto", "TW-Auto", "PH-Auto", "JP-Auto",
      ]);
    }
    expect(find("AI").proxies.slice(0, 6)).toEqual([
      "AI-Auto", "PH-Auto", "SG-Auto", "JP-Auto", "HK-Auto", "TW-Auto",
    ]);

    for (const group of groups.filter((group) => group.type !== "select")) {
      expect(group).toMatchObject({
        url: "https://www.gstatic.com/generate_204", interval: 300, lazy: true,
      });
    }
  });

  it("omits missing regions and never falls back to unrelated countries", () => {
    const groups = process({ proxies: [{ name: "US01", type: "ss" }] })["proxy-groups"];
    expect(groups.map((group) => group.name)).toEqual(["Proxy", "AI", "RC", "CN", "Others", "Auto", "AI-Auto"]);
    expect(groups.find((group) => group.name === "Auto").proxies).toEqual(["REJECT"]);
    expect(groups.find((group) => group.name === "AI-Auto").proxies).toEqual(["REJECT"]);
  });
});
