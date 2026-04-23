import { describe, expect, it } from "vitest";
import {
  DEFAULT_DNS_CONFIG,
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

describe("DEFAULT_DNS_CONFIG", () => {
  it("stores the shared fake-ip dns config", () => {
    expect(DEFAULT_DNS_CONFIG).toEqual({
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
    });
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
        url: "https://gcore.jsdelivr.net/gh/217heidai/adblockfilters@main/rules/adblockmihomo.yaml",
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
