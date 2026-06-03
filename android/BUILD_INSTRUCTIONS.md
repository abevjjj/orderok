# 收快递 Android App — 构建说明

## 一、环境要求

| 工具 | 版本要求 | 下载地址 |
|------|----------|----------|
| Android Studio | Hedgehog (2023.1.1) 或更新 | https://developer.android.com/studio |
| JDK | 17（Android Studio 自带） | — |
| Android SDK | API 34（首次打开时自动提示安装） | — |

---

## 二、构建步骤

### 1. 解压项目
```
解压项目源码到任意目录
```

### 2. 打开项目
```
Android Studio → File → Open → 选择 `android/` 目录 → OK
```

### 3. 等待 Gradle 同步
首次打开会自动下载依赖（需要网络，约 200MB），等待底部进度条完成。

### 4. 构建 Debug APK
```
菜单栏：Build → Build Bundle(s) / APK(s) → Build APK(s)
```
等待构建完成，右下角弹出通知：
```
APK(s) generated successfully  [locate]
```
点击 **locate** 找到 APK 文件，位于：
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### 5. 安装到手机
- **USB 调试方式**：手机开启开发者模式 → USB 连接 → Android Studio 顶部选择设备 → 点击 ▶ Run
- **直接传文件**：把 `app-debug.apk` 传到手机 → 手机文件管理器点击安装（需开启"允许安装未知来源"）

---

## 三、首次使用配置

1. 打开 App，输入：
   - **服务器地址**：`http://[Armbian设备IP]:5050`（例：`http://192.168.1.100:5050`）
   - **用户名**、**密码**：与 Web 端相同账号
2. 点击登录，成功后自动保存，下次打开直接进入主界面

---

## 四、功能说明

| 功能 | 说明 |
|------|------|
| 扫码 | 点击底部蓝色扫码按钮 → 对准条形码/二维码 → 自动识别填入 |
| 手动输入 | 直接在"快递单号"框中输入 |
| 日期选择 | 点击日期框 → 弹出日历选择器 |
| 提交 | 填写完所有必填项（*号）→ 点击"确认登记" |
| 重复提示 | 单号已存在时弹出提示，不会重复录入 |
| 查看记录 | 右上角菜单 → "收快递记录" |
| 退出登录 | 右上角菜单 → "退出登录" |

---

## 五、相机权限说明

- 首次点击扫码按钮会请求相机权限
- 若拒绝，App 会引导跳转到系统设置手动开启
- 拒绝权限后仍可手动输入快递单号，不影响其他功能

---

## 六、兼容性

- **最低系统**：Android 7.0 (API 24)
- **目标系统**：Android 14 (API 34)
- **厂商兼容**：使用 CameraX 统一接口，兼容华为、小米、OPPO、vivo、三星等主流厂商
- **扫码格式**：支持所有常见 1D 条形码（Code 128、Code 39、EAN 等）和 2D 码（QR码）

---

## 七、已知注意事项

1. 服务器地址必须用 `http://`，不要用域名（局域网环境），确保手机和服务器在同一 WiFi
2. 第一次启动 Gradle 同步较慢（需翻墙或配置国内镜像），后续构建很快
3. 如 Gradle 同步失败，在 `gradle/wrapper/gradle-wrapper.properties` 中将 distributionUrl 改为国内镜像：
   ```
   distributionUrl=https\://mirrors.cloud.tencent.com/gradle/gradle-8.4-bin.zip
   ```

## 八、GitHub Actions 构建 APK

- workflow 文件位于仓库根目录的 `.github/workflows/build-android.yml`
- 构建产物是可直接安装的 `debug APK`
- 如果要生成 `release APK`，需要额外配置签名证书
