function main(config) {
  const NEW_GROUPS = ['🤖 AI', '🇭🇰 Hong Kong', '🇸🇬 Singapore'];

  const filterNodes = keyword =>
    config.proxies?.filter(p => p.name.includes(keyword)).map(p => p.name) ?? [];

  config['proxy-groups'].forEach(group => {
    if (!NEW_GROUPS.includes(group.name)) {
      group.proxies?.unshift('🇭🇰 Hong Kong');
    }
  });

  config['proxy-groups'].push(
    {
      name: '🤖 AI',
      type: 'select',
      proxies: ['🇭🇰 Hong Kong', '🇸🇬 Singapore', 'DIRECT'],
    },
    {
      name: '🇭🇰 Hong Kong',
      type: 'fallback',
      proxies: filterNodes('Hong Kong'),
      url: 'http://1.0.0.1',
      interval: 300,
      tolerance: 50,
    },
    {
      name: '🇸🇬 Singapore',
      type: 'fallback',
      proxies: filterNodes('Singapore'),
      url: 'http://1.0.0.1',
      interval: 300,
      tolerance: 50,
    }
  );

  config['rule-providers'] ??= {};
  config['rule-providers']['AiDomain'] = {
    type: 'http',
    behavior: 'classical',
    format: 'text',
    url: 'https://raw.githubusercontent.com/233mawile/proxy-rules/refs/heads/main/rules/ai.list',
    path: './ruleset/AiDomain.list',
    interval: 86400,
  };

  config['rules'] ??= [];
  config['rules'].unshift('RULE-SET,AiDomain,🤖 AI');

  return config;
}