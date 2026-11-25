import { extractProxyNames } from "./common.js";

/**
 * @typedef {import("subtrans/types").ClashConfig} ClashConfig
 * @typedef {import("subtrans/types").ProxyGroup} ProxyGroup
 */

/** Name of the injected url-test group that never selects Hong Kong nodes. */
export const NO_HK_AUTO = "NoHK-Auto";

/** Airport group that carries Google traffic, including Gemini. */
const GOOGLE_GROUP = "谷歌服务";

/** Airport group that carries ChatGPT traffic. */
const CHATGPT_GROUP = "ChatGPT";

/** Matches Hong Kong node names. */
const HK_PATTERN = /香港|🇭🇰|hong[ -]?kong|\bHK(?=\b|\d)/i;

/** Airport info pseudo-nodes that must not join auto groups. */
const INFO_NODE_BLACKLIST = ["剩余流量", "套餐到期", "过滤掉"];

/**
 * Builds the Hong Kong-free url-test group.
 *
 * @param {string[]} proxyNames
 * @returns {ProxyGroup}
 */
function buildNoHkAutoGroup(proxyNames) {
  const candidates = proxyNames.filter((name) => !HK_PATTERN.test(name));
  return {
    name: NO_HK_AUTO,
    type: "url-test",
    proxies: candidates.length > 0 ? candidates : ["REJECT"],
    url: "https://www.gstatic.com/generate_204",
    interval: 300,
    tolerance: 80,
    lazy: true,
  };
}

/**
 * Keeps Mojie's own rules and groups, but makes Google (Gemini) and ChatGPT
 * default to a Hong Kong-free auto group. Google offers the same manual
 * choices as ChatGPT.
 *
 * @type {import("subtrans/types").Processor}
 */
export default function process(config) {
  const groups = Array.isArray(config["proxy-groups"]) ? config["proxy-groups"] : [];
  const chatgpt = groups.find((group) => group.name === CHATGPT_GROUP);
  const proxyNames = extractProxyNames(config, { blacklist: INFO_NODE_BLACKLIST });

  if (!chatgpt || proxyNames.length === 0) {
    return config;
  }

  const chatgptChoices = [NO_HK_AUTO, ...(chatgpt.proxies ?? []).filter((name) => name !== NO_HK_AUTO)];

  /** @type {ProxyGroup[]} */
  const nextGroups = groups.map((group) => {
    if (group.name === CHATGPT_GROUP || group.name === GOOGLE_GROUP) {
      return { ...group, type: "select", proxies: [...chatgptChoices] };
    }
    return group;
  });

  return {
    ...config,
    "proxy-groups": [...nextGroups, buildNoHkAutoGroup(proxyNames)],
  };
}
