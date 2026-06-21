# LRC 歌词展示系统

面向毕业典礼等现场活动的竖屏歌词与图片展示系统。管理端上传 LRC 歌词、控制播放进度，显示端以 1:3 竖屏实时同步展示；支持多主题切换与图片轮播队列。

## 功能概览

| 页面 | 路径 | 说明 |
|------|------|------|
| 首页 | `/` | 项目入口 |
| 管理端 | `/admin` | 上传歌词/图片、歌词库、播放控制、主题切换 |
| 显示端 | `/display` | 竖屏歌词滚动展示或全屏图片展示 |

**歌词**

- 上传 `.lrc` 文件或直接粘贴内容
- 解析后加载到显示端，或保存到歌词库（持久化至 OBS）
- 播放 / 暂停 / 重置 / 进度拖动
- 显示端逐字高亮、开场曲名/歌手介绍、进度条

**图片**

- 上传至图库（OBS），加入待展示队列
- 按顺序展示，支持上移/下移/移除
- 歌词与图片模式可切换

**主题**

黑金、极光、绯红、翠玉、紫霄、琥珀六种视觉主题，管理端切换后显示端实时同步。

## 技术栈

- [Nuxt 4](https://nuxt.com) + Vue 3
- 服务端内存态播放状态 + 前端轮询同步（约 500ms）
- [华为云 OBS](https://www.huaweicloud.com/product/obs.html) 存储歌词与图片（通过 `@aws-sdk/client-s3` 兼容接口）

## 快速开始

### 环境要求

- Node.js 18+ 或 [Bun](https://bun.sh)
- 华为云 OBS 存储桶及访问密钥（歌词库与图库功能需要）

### 安装依赖

```bash
bun install
# 或 npm install
```

### 配置环境变量

复制 `.env.example` 为 `.env` 并填写 OBS 凭证：

```bash
cp .env.example .env
```

| 变量 | 说明 |
|------|------|
| `OBS_ACCESS_KEY_ID` | 访问密钥 ID |
| `OBS_SECRET_ACCESS_KEY` | 访问密钥 |
| `OBS_BUCKET` | 存储桶名称 |
| `OBS_REGION` | 区域，如 `cn-north-4` |
| `OBS_ENDPOINT` | OBS 端点 URL |
| `OBS_PUBLIC_BASE_URL` | 对象公开访问基础 URL |
| `ADMIN_PASSWORD` | 管理端登录密码 |

启动后若日志出现 `[OBS] 已就绪` 表示配置成功；若出现「未配置凭证」，歌词库与图片上传功能不可用，但本地歌词解析与显示仍可正常使用。

### 开发

```bash
bun run dev
```

- 管理端：http://localhost:3000/admin
- 显示端：http://localhost:3000/display（建议在新窗口/竖屏设备打开）

首次打开管理端时需要输入 `.env` 中的 `ADMIN_PASSWORD`。登录会话缓存在服务端内存中，浏览器通过 HttpOnly Cookie 保持登录；服务重启后需重新登录。

### 生产构建

```bash
bun run build
node .output/server/index.mjs
```

部署时需在服务器项目根目录放置 `.env`，或在启动前 `export` 上述环境变量。`.env` 不会随 Git 提交。

## 现场使用建议

1. 在控制设备打开 `/admin`，在竖屏或大屏幕打开 `/display`
2. 上传或从歌词库加载 LRC，点击「解析并加载」
3. 在「播放控制」中开始播放，显示端自动同步
4. 需要展示图片时，从图库加入待展示队列，点击「展示下一张」
5. 可在「展示主题」中切换视觉风格

## 项目结构

```
app/
  pages/
    index.vue      # 首页
    admin.vue      # 管理端
    display.vue    # 显示端
  components/      # 粒子背景等 UI 组件
  composables/     # 播放状态轮询同步
server/
  api/             # REST 接口
  utils/           # 播放状态、OBS、歌词存储
  plugins/         # 环境变量与 OBS 就绪检查
shared/utils/      # LRC 解析、主题定义
public/            # 静态资源（含示例 sample.lrc）
```

## API 概览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/state` | 获取当前播放/展示状态 |
| POST | `/api/control` | 播放控制、图片队列、主题切换等 |
| GET/POST | `/api/external/play` | 外部 HTTP 触发开始播放字幕（适合 OBS 插件/脚本调用） |
| POST | `/api/lyrics` | 保存歌词到歌词库 |
| GET | `/api/lyrics` | 列出已保存歌词 |
| GET | `/api/lyrics/:id` | 读取指定歌词 |
| DELETE | `/api/lyrics/:id` | 删除指定歌词 |
| POST | `/api/upload` | 上传图片 |
| GET | `/api/images` | 列出图库图片 |

### OBS 外部播放触发

OBS 插件或脚本可通过 HTTP 请求开始播放当前已加载的字幕：

```bash
curl "http://localhost:3000/api/external/play"
```

常用参数：

- `reset=1`：从 0ms 重新开始播放，例如 `/api/external/play?reset=1`
- `time=30000`：从指定毫秒开始播放，例如 `/api/external/play?time=30000`

接口支持 `GET` 与 `POST`，调用后会自动切换到歌词显示模式；如果尚未加载歌词，会返回 `409`。

## License

Private — 仅供内部活动使用。
