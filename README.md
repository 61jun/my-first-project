# 拾日 Daylight

个人生活手账，适配 iPhone 和 Windows 浏览器。包括日期切换、待办、心情日记、自定义习惯打卡、收支分类与月度汇总、日历回顾、JSON 备份导入导出。

## 开发

需要 Node.js 22.12+ 或 24。

```sh
npm ci
npm run dev
npm run build
npx playwright install chromium
npm test
```

首次使用无演示数据，记录默认保存在当前浏览器的 localStorage。清除网站数据会删除记录，请在“我的小天地”定期导出备份。项目默认包含个人 Supabase 项目的公开连接配置（`cloud-config.js`），因此部署时未设置环境变量也会显示登录入口。登录后的同步仍需可用的云端账户和表权限。部署时应使用 HTTPS；iPhone Safari 可通过分享菜单添加到主屏幕。支持添加到主屏幕、独立窗口、两套可切换主题以及离线应用外壳缓存；不提供系统推送提醒。主题只保存在当前设备，切换不影响生活记录。离线缓存只包含界面文件，不缓存云端认证或数据库接口响应。

## 私人云端同步配置

1. 创建自己的 Supabase 项目，在 SQL Editor 执行 `supabase.sql`，启用逐用户的行级权限。
2. 在 Authentication 设置关闭新用户注册，然后在用户管理中手动创建个人邮箱和密码账户。
3. 当前个人项目已在 `cloud-config.js` 配置公开 URL 和 publishable key。如需切换项目，将 `.env.example` 复制为 `.env.local`，填入新项目 URL 和公开 anon / publishable key。URL 与 key 必须一起配置才会覆盖默认项目。切勿填入 service_role 密钥。这两个 VITE 配置会包含在前端构建中，因此必须启用上述行级权限。
4. 重新启动开发服务或重新构建部署，在“我的小天地”登录。已有云端记录会覆盖本机记录，登录前先导出本机备份。
5. 在另一设备访问同一 HTTPS 部署地址，登录同一账户。启动时拉取云端数据，修改时按顺序保存整份记录；请勿在两台设备同时编辑。已登录账户的离线修改会标为待上传，再次启动不会自动用云端覆盖；联网后在设置中选择“上传本机记录”，或先备份再选择从云端刷新。当前不提供实时合并。

云服务创建、真实账户登录、跨设备同步与公开部署尚需实际配置验证。应用不开放注册，但本机模式本身不提供密码锁；共享设备需注意隐私。

## 主题和安装

顶部“外观主题”或设置中的主题卡可以选择“蝴蝶结小猫”和“奶油星星”。插画为本项目 SVG 绘制。iPhone 在 Safari 分享菜单选择“添加到主屏幕”；Windows 在 Edge / Chrome 使用安装网站为应用功能。安装后的本机存储和浏览器可能不同，请用同一云端账户登录并先备份未同步记录。当前交付为可安装的 PWA，并非 App Store 原生安装包。

`npm run build` 会生成包含当前构建版本的 Service Worker。首次联网访问完成缓存后可离线打开；新版本在旧窗口全部关闭后激活，不会主动刷新正在编辑的页面。应用图标 PNG 已随仓库提供；若修改 SVG，可运行 `CHROMIUM_PATH=/usr/bin/chromium node scripts/make-icons.mjs` 重新生成。

生产功能验证（包括实际断网重开与待上传记录保留）：

```sh
npm run build
TEST_PRODUCTION=1 CHROMIUM_PATH=/usr/bin/chromium npm test
```

`CHROMIUM_PATH` 是当前云环境系统浏览器路径；其他设备安装 Playwright Chromium 后可省略它。
