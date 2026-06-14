# CLAUDE.md

このファイルはAIエージェント（Claude Code等）向けのガイドラインです。

## 作業ルール

- **masterブランチへの直接pushは禁止**
- 必ずブランチを切って作業する
- 実装項目はIssueに起票し、ブランチと紐づける
- masterへのマージはPR経由で行う
- PR・IssueにはGitHubの適切なラベルを付ける

## ブランチ命名規則

| 種別 | パターン | 例 |
|------|----------|-----|
| 新機能 | `feature/****` | `feature/create-entry-point-for-api-XXX` |
| バグ修正 | `fix/****` | `fix/replace-typo-in-user-manual` |

## ドキュメント

- 実装時はドキュメントを `docs/` ディレクトリに整備する（仕様等）

## コミット前チェック

1. masterブランチ上で作業していないか確認する
2. 変更内容がIssueのスコープに収まっているか確認する
