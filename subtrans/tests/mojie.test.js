import { describe, expect, it } from "vitest";
import process, { GPT_AUTO, NO_HK_AUTO } from "../mojie.js";

const base = () => ({
  proxies: [
    { name: "剩余流量：54 GB", type: "ss" },
    { name: "香港-优化", type: "ss" },
    { name: "香港HK-HY2", type: "hysteria2" },
    { name: "新加坡-优化-GPT", type: "ss" },
    { name: "美国LA-优化-GPT", type: "ss" },
    { name: "日本-优化", type: "ss" },
  ],
  "proxy-groups": [
    { name: "节点选择", type: "select", proxies: ["自动选择", "香港-优化"] },
    { name: "ChatGPT", type: "select", proxies: ["节点选择", "新加坡-优化-GPT"] },
    { name: "Gemini", type: "select", proxies: ["节点选择"] },
    { name: "谷歌服务", type: "select", proxies: ["节点选择", "香港-优化", "日本-优化"] },
  ],
  rules: ["DOMAIN-SUFFIX,gemini.google.com,Gemini", "MATCH,节点选择"],
});

describe("mojie processor", () => {
  it("adds NoHK-Auto and GPT-Auto groups for ChatGPT and Gemini without changing Google", () => {
    const config = base();
    const result = process(config);
    const groups = result["proxy-groups"];
    const aiChoices = [GPT_AUTO, NO_HK_AUTO, "节点选择", "新加坡-优化-GPT"];

    expect(groups.find((g) => g.name === "ChatGPT").proxies).toEqual(aiChoices);
    expect(groups.find((g) => g.name === "Gemini").proxies).toEqual(aiChoices);
    expect(groups.find((g) => g.name === "谷歌服务")).toEqual(
      config["proxy-groups"].find((g) => g.name === "谷歌服务"),
    );
    expect(groups.find((g) => g.name === NO_HK_AUTO)).toMatchObject({
      type: "url-test",
      proxies: ["新加坡-优化-GPT", "美国LA-优化-GPT", "日本-优化"],
    });
    expect(groups.find((g) => g.name === GPT_AUTO)).toMatchObject({
      type: "url-test",
      proxies: ["新加坡-优化-GPT", "美国LA-优化-GPT"],
    });
    expect(groups[0]).toEqual(config["proxy-groups"][0]);
    expect(result.rules).toBe(config.rules);
  });

  it("returns the original config without a ChatGPT group", () => {
    const config = { ...base(), "proxy-groups": [] };
    expect(process(config)).toBe(config);
  });
});
