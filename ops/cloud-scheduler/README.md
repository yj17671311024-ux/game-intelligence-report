# 游戏情报日报云端定时器

这套 Worker 是 GitHub Actions schedule 的外部备份闹钟。它不生成日报，只负责到点触发 GitHub workflow。

需要配置的密钥：

- `GH_TOKEN`：GitHub fine-grained token，只给 `yj17671311024-ux/game-intelligence-report` 仓库，权限选择 `Actions: Read and write`。
- `TRIGGER_SECRET`：可选，用于 `/run` 手动触发接口的简单保护。

Cloudflare Cron 使用 UTC 时间；上面的 cron 对应北京时间 10:08、10:27、10:47、11:17、13:17。

GitHub 仓库里还需要配置：

- Repository secret `OPENAI_API_KEY`：用于 AI 分析层。不要放在代码里。
- Repository variable `OPENAI_MODEL`：可选，默认 `gpt-4.1-mini`。

如果当天页面已经生成，workflow 会自动跳过后续补跑，避免重复消耗 API。
