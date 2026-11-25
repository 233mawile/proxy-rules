import { extractProxyNames } from "./common.js";

/**
 * @typedef {import("subtrans/types").ClashConfig} ClashConfig
 * @typedef {import("subtrans/types").ProxyGroup} ProxyGroup
 */

/** Name of the injected url-test group that never selects Hong Kong nodes. */
export const NO_HK_AUTO = "NoHK-Auto";

/** Name of the injected url-test group for non-HK GPT-optimized nodes. */
export const GPT_AUTO = "GPT-Auto";

/** Airport group that carries ChatGPT traffic. */
const CHATGPT_GROUP = "ChatGPT";

/** Airport group that carries Gemini traffic. */
const GEMINI_GROUP = "Gemini";

/** Matches Hong Kong node names. */
const HK_PATTERN = /香港|🇭🇰|hong[ -]?kong|\bHK(?=\b|\d)/i;

/** Matches GPT-optimized node names. */
const GPT_PATTERN = /gpt/i;

/** Airport info pseudo-nodes that must not join auto groups. */
const INFO_NODE_BLACKLIST = ["剩余流量", "套餐到期", "过滤掉"];

/**
 * Builds a url-test group from candidate proxy names.
 *
 * @param {string} name
 * @param {string[]} candidates
 * @returns {ProxyGroup}
 */
function buildAutoGroup(name, candidates) {
  return {
    name,
    type: "url-test",
    proxies: candidates.length > 0 ? candidates : ["REJECT"],
    url: "https://www.gstatic.com/generate_204",
    interval: 300,
    tolerance: 80,
    lazy: true,
  };
}

/**
 * Keeps Mojie's own rules and groups, but adds HK-free and GPT-optimized auto
 * groups for ChatGPT and Gemini. Both default to GPT-Auto and offer the same
 * manual choices.
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

  const baseChoices = (chatgpt.proxies ?? []).filter(
    (name) => name !== NO_HK_AUTO && name !== GPT_AUTO,
  );
  const aiChoices = [GPT_AUTO, NO_HK_AUTO, ...baseChoices];

  const noHkProxies = proxyNames.filter((name) => !HK_PATTERN.test(name));
  const gptProxies = noHkProxies.filter((name) => GPT_PATTERN.test(name));

  /** @type {ProxyGroup[]} */
  const nextGroups = groups.map((group) => {
    if (group.name === CHATGPT_GROUP || group.name === GEMINI_GROUP) {
      return { ...group, type: "select", proxies: [...aiChoices] };
    }
    return group;
  });

  return {
    ...config,
    "proxy-groups": [
      ...nextGroups,
      buildAutoGroup(NO_HK_AUTO, noHkProxies),
      buildAutoGroup(GPT_AUTO, gptProxies),
    ],
  };
}
