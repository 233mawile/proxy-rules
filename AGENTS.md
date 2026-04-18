# AGENTS

## 概览

这个仓库用来维护个人使用的 Clash 规则、`subtrans` 处理脚本，以及对应的发布产物。

在理解这个仓库或开始编写、修改任何处理脚本之前，必须先阅读：

- [233mawile/subtrans README](https://github.com/233mawile/subtrans/blob/main/README.md)

`subtrans` 脚本本身的写法和处理器约定，以这份 README 为准。

## 目录

- `subtrans/`
  处理脚本源码。需要发布的脚本放在这个目录顶层。

- `subtrans/common.js`
  共享逻辑，不单独发布。

- `subtrans/tests/`
  测试文件。

- `rules/`
  本地规则列表。

- `scripts/`
  本地构建脚本。

- `release/`
  打包后的发布产物，需要提交。

## 约定

- 新增脚本时，文件名放在 `subtrans/<name>.js`。
- 修改或新增 `subtrans/` 下的处理脚本、共享逻辑时，必须补上对应的 JSDoc；公共函数、常量、processor 默认导出都应有清晰的类型或职责说明。
- JSDoc 里的具体类型优先直接引用 `subtrans/types` 中已有的声明，例如 `ClashConfig`、`DnsConfig`、`ProxyGroup`；除非确实没有现成类型，否则不要自行重复定义或绕用不必要的推导类型。
- 只要更新了 `subtrans/` 目录下的任何文件，提交前都必须运行一次 `npm run release`，同步重建 `release/` 产物。
- `.env` 里需要有同名键 `<name>`，值为对应原始订阅地址。
- `npm run release` 会扫描 `subtrans/` 顶层脚本，忽略 `subtrans/common.js`，重建 `release/`，并生成 `release/sources.json`。
- `release/sources.json` 记录各发布脚本对应的 GitHub 原始文件地址（`raw.githubusercontent.com`）。
- `npm run subscription` 会先执行 `release`，再根据 `.env` 和 `release/sources.json` 生成 `subscription.json`。
- `subscription.json` 是本地生成文件，已加入 `.gitignore`，不提交。
