# GitHub Actions 自动部署配置指南

## 📝 配置步骤

### 1. 生成 SSH 密钥（本地执行）

```bash
# 生成专用于部署的 SSH 密钥（不要密码）
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy

# 会生成两个文件：
# - github_actions_deploy (私钥)
# - github_actions_deploy.pub (公钥)
```

### 2. 添加公钥到服务器

```bash
# 复制公钥内容
cat ~/.ssh/github_actions_deploy.pub

# SSH 登录服务器，添加到授权文件
ssh root@your-server
echo "刚才复制的公钥内容" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 3. 配置 GitHub Secrets

访问你的 GitHub 仓库：
`Settings` → `Secrets and variables` → `Actions` → `New repository secret`

添加以下 3 个 Secrets：

| Name | Value | 说明 |
|------|-------|------|
| `SSH_PRIVATE_KEY` | 私钥内容 | 执行 `cat ~/.ssh/github_actions_deploy` 复制全部内容 |
| `REMOTE_HOST` | 服务器 IP | 例如：`123.456.789.0` |
| `REMOTE_USER` | SSH 用户名 | 通常是 `root` |

**如何添加私钥：**
```bash
# 复制私钥（包括 BEGIN 和 END 行）
cat ~/.ssh/github_actions_deploy

# 复制输出的全部内容，粘贴到 GitHub Secret
```

### 4. 服务器配置 sudo 免密（可选但推荐）

如果 Nginx 重启需要 sudo 权限：

```bash
# SSH 登录服务器
sudo visudo

# 在文件末尾添加（root 替换为你的用户名）
root ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload nginx
root ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx
```

### 5. 推送代码触发部署

```bash
git add .
git commit -m "feat: 配置自动部署"
git push origin main
```

## 🔍 查看部署状态

访问仓库的 `Actions` 标签页，查看部署进度和日志。

## ⚡ 工作流程

```
本地修改代码
    ↓
git push 到 GitHub
    ↓
GitHub Actions 自动触发
    ↓
在 GitHub 服务器上构建
    ↓
通过 SSH 上传 dist/ 到服务器
    ↓
自动重启 Nginx
    ↓
部署完成 ✅
```

## 🛠️ 故障排查

### 问题 1：SSH 连接失败
```bash
# 测试 SSH 连接
ssh -i ~/.ssh/github_actions_deploy root@your-server

# 如果失败，检查：
# 1. 公钥是否正确添加到服务器
# 2. 服务器 SSH 端口是否为 22（如果不是，需要在 workflow 中指定）
# 3. 防火墙是否允许 SSH 连接
```

### 问题 2：权限不足
```bash
# 确保目标目录存在且有写权限
sudo mkdir -p /www/wwwroot/meng-person-next-gate/dist
sudo chown -R root:root /www/wwwroot/meng-person-next-gate
```

### 问题 3：Nginx 重启失败
```bash
# 检查 Nginx 配置
sudo nginx -t

# 手动测试重启
sudo systemctl reload nginx
```

## 📋 进阶配置

### 仅在特定分支部署
```yaml
on:
  push:
    branches:
      - main      # 生产环境
      - develop   # 开发环境
```

### 添加构建缓存（加快速度）
```yaml
- name: Cache pnpm store
  uses: actions/cache@v3
  with:
    path: ~/.pnpm-store
    key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}
    restore-keys: |
      ${{ runner.os }}-pnpm-
```

### 部署通知（可选）
可以添加企业微信、钉钉、Telegram 等通知，在部署成功/失败时发送消息。

## 🎉 完成

现在每次 push 到 main 分支，都会自动构建并部署到服务器！
