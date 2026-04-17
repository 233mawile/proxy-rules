export default function process(config) {
  const proxyGroups = Array.isArray(config["proxy-groups"])
    ? config["proxy-groups"]
    : [];

  if (proxyGroups.length === 0) {
    return config;
  }

  const baseGroup = proxyGroups[0];
  const aiGroupName = "AI";
  const aiRuleProviderName = "AiDomain";
  const aiRule = `RULE-SET,${aiRuleProviderName},${aiGroupName}`;
  const rcGroupName = "RC";
  const rcRules = [
    `DOMAIN-SUFFIX,ringcentral.com,${rcGroupName}`,
    `DOMAIN-SUFFIX,glip.com,${rcGroupName}`,
  ];

  const nextProxyGroups = proxyGroups.filter(
    (group) => group.name !== aiGroupName && group.name !== rcGroupName
  );

  nextProxyGroups.push({
    ...baseGroup,
    name: aiGroupName,
  });

  nextProxyGroups.push({
    ...baseGroup,
    name: rcGroupName,
  });

  const ruleProviders = {
    ...(config["rule-providers"] ?? {}),
    [aiRuleProviderName]: {
      type: "http",
      behavior: "classical",
      format: "text",
      url: "https://raw.githubusercontent.com/233mawile/proxy-rules/refs/heads/main/rules/ai.list",
      path: "./ruleset/AiDomain.list",
      interval: 86400,
    },
  };

  const rules = Array.isArray(config.rules)
    ? config.rules.filter((rule) => rule !== aiRule && !rcRules.includes(rule))
    : [];

  rules.unshift(...rcRules);
  rules.unshift(aiRule);

  return {
    ...config,
    "proxy-groups": nextProxyGroups,
    "rule-providers": ruleProviders,
    rules,
  };
}
