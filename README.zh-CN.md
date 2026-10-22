# wan-soroban-message-cross

[English](README.md) | [简体中文](README.zh-CN.md)

基于 Stellar Soroban 的跨链消息桥与 NFT 实验项目。

> [!WARNING]
> 本项目仍处于实验阶段，尚未经过独立安全审计。部署前请先阅读
> [SECURITY.md](SECURITY.md)。
>
> 任何曾经提交到本仓库的 Stellar 账户私钥和 secp256k1 私钥都必须视为
> **已泄露**。即使只用于测试网，也必须轮换这些密钥，并从 Git 历史中清除。

## 目录结构

| 路径 | 说明 |
| --- | --- |
| `contracts_soroban/` | Rust workspace：`message_bridge`、`nft`、`nft_market` 及对应接口 crate |
| `account/` | 自定义多签账户合约（`CustomAccountInterface`），支持按 token 设置限额 |
| `soroban_test/` | NFT、市场、跨链桥的端到端脚本，以及 Polygon 辅助脚本 |
| `soroban_dev/` | 精简版部署与调用脚本 |
| `study_sdk/` | Stellar SDK 实验代码，包含账户合约的使用示例 |
| `SECURITY.md` | 安全审计报告、已修复漏洞、残余风险与部署检查清单 |

## 工作原理

### 跨链桥

1. 链下验证者对 XDR 编码的 `EncodeInfo` 载荷签名。
2. 中继者调用 `inbound_bytes(network_id, encoded_info, encoded_proof)`。
3. 跨链桥会依次执行以下校验：
   - 要求合约已完成一次性初始化，且已配置验证者合约；
   - 校验 `network_id` 与合约中保存的目标链 ID 一致；
   - 调用验证者合约恢复 secp256k1 公钥、校验签名阈值，并拒绝未知或重复签名者；
   - 要求验证者返回的字节与传入的 `encoded_info` 完全一致；
   - 解码 `EncodeInfo`，校验目标链；
   - 校验源链 ID 和源合约是否与已配置的 peer 一致；
   - 拒绝空 `task_id` 和已执行过的 `task_id`；
   - 在发出 `inbound_bytes` 事件之前先把任务标记为已执行。
4. 链下服务监听该事件，完成 NFT 或资金释放。

`inbound_bytes` 采用**失败关闭**策略：在调用 `set_verifier` 和 `set_peer`
之前，所有入站消息都会被拒绝。`inbound_call` 作为向后兼容的别名保留。

验证者合约通过 `set_verifier` 配置，需要实现
`decode_and_verify(network_id, encoded_info, encoded_proof)`。本仓库中的阈值
签名恢复逻辑位于
`contracts/message_bridge/src/cross_chain_verifier.rs`。

> 目前 Rust 合约使用 SHA-256 和 `EncodeInfo` XDR 结构，而部分较新的脚本
> 使用 `keccak256` 和另一套载荷格式。正式部署前必须统一消息结构和哈希算法
> （参见 [SECURITY.md](SECURITY.md) 第 13 条）。

### 账户合约

`account/` 实现了一个基于 ed25519 签名者的智能账户，并带有按 token 的
支出策略：

- `init(signers)` 只能执行一次，拒绝空签名者集合和重复签名者；
- `add_limit(token, limit)` 为指定 token 保存支出限额；
- `__check_auth` 要求至少一个有效签名，拒绝未知和重复签名者，并执行支出策略：
  - 只有部分签名者签名时，仅允许转移已显式设置限额的 token；
  - 未设置限额时，必须所有签名者共同签名。

### NFT

`nft` 合约提供 `initialize`、`admin`、`set_admin`、`name`、`symbol`、
`token_uri`、`approve`、`approve_all`、`get_approve`、`is_approve`、
`balance`、`owner`、`transfer`、`transfer_from`、`mint` 和 `burn`。

## 环境要求

- Rust（stable）及 `wasm32-unknown-unknown` target
- Stellar CLI（`stellar` / `soroban`），用于构建和部署合约
- Node.js 18+ 与 npm，用于运行脚本

## 构建与测试

合约 workspace：

```bash
cd contracts_soroban
cargo check --workspace
cargo test --workspace
cargo build --target wasm32-unknown-unknown --release
```

账户合约：

```bash
cd account
cargo test
cargo build --target wasm32-unknown-unknown --release
```

也可以在单个合约目录中执行 `stellar contract build`。

## 配置

仓库中不保存任何私钥。每个 JavaScript 目录都提供了
`config.example.js`，将其复制为 `config.local.js`（已被 git 忽略），或者
直接导出环境变量。

```bash
cd soroban_test
cp config.example.js config.local.js
```

支持的环境变量：

| 变量 | 用途 |
| --- | --- |
| `STELLAR_USER1_SECRET` ... `STELLAR_USER3_SECRET` | Stellar 账户私钥（种子） |
| `SECP256K1_USER1_PRIVKEY` ... `SECP256K1_USER5_PRIVKEY` | 跨链桥验证者私钥 |

`config.js` 中只保留公钥、节点地址和测试网合约 ID（`scAddr`）。部署自己的
合约后需要更新 `scAddr`。

**切勿提交 `config.local.js`、`.env` 或任何密钥材料。**

## 运行脚本

```bash
cd soroban_test
npm install
cp config.example.js config.local.js   # 然后填写内容
node nft/1_init.js
```

脚本按编号顺序执行：

- `soroban_test/nft/` - 部署初始化、元数据、铸造、转账、销毁
- `soroban_test/market/` - 市场初始化、订单、证明、入站调用
- `soroban_test/message/` - 跨链桥初始化、验证者、阈值、peer、管理员
- `soroban_test/polygon/` - Polygon 余额查询辅助脚本
- `soroban_dev/` 和 `study_sdk/` - 更小的独立示例

脚本会打印已签名交易的 XDR 便于调试，请勿将这些日志粘贴到 issue 或公开
聊天中。

## 部署检查清单

1. 轮换所有曾出现在本仓库中的密钥，并从 Git 历史中清除。
2. 部署与初始化必须原子化完成（工厂合约或同一笔交易）；分开执行
   “先部署、再初始化” 会被抢跑。Soroban SDK 21 没有构造函数，实际可行
   的方式是使用工厂合约。
3. 初始化后立即设置验证者和 peer；在两者配置完成前，入站消息会失败关闭。
4. 使用大于 1 的签名阈值，并将验证者密钥保存在彼此隔离的安全签名设备中。
5. 跨链桥管理员应使用冷钱包或多签。
6. 进行独立安全审计，并为消息解析和签名验证补充模糊测试/不变量测试。

完整列表见 [SECURITY.md](SECURITY.md)。

## 许可证

Apache License 2.0，详见 [LICENSE](LICENSE)。
