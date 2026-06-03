# 收快递 - Android App

公司内部快递收发登记 Android 客户端，配合[快递管理系统后端](../web/backend)使用。

## 功能

- 📷 扫描条形码 / 二维码自动填入快递单号（ML Kit）
- 📝 填写发货日期、到货日期、货品说明并提交到服务端
- 📋 查看收快递记录（支持三种状态筛选）
- 🔐 登录状态保持，服务器地址记住

## 构建 APK（GitHub Actions 自动构建）

1. Fork 或 Push 代码到 GitHub
2. 进入仓库 → **Actions** 标签页
3. 选择 **Build Android APK** → **Run workflow**
4. 等待约 3-5 分钟构建完成
5. 在 workflow 运行结果页面下载 `ExpressIn-debug-xxx.zip`，解压得到 `app-debug.apk`

> APK 保留 30 天，每次 push 到 main/master 自动触发构建。
>
> 目前 workflow 输出的是可直接安装的 `debug APK`。如果要生成可发布的 `release APK`，还需要补充签名证书和 `signingConfig`。

## 本地构建

需要：Android Studio Hedgehog+ 或 JDK 17 + Android SDK

```bash
chmod +x gradlew
./gradlew assembleDebug
# APK 在 app/build/outputs/apk/debug/app-debug.apk
```

## 使用配置

首次打开 App 填写：
- **服务器地址**：`http://[服务器IP]:5050`（例：`http://192.168.11.38:5050`）
- **用户名 / 密码**：与 Web 端账号相同

手机和服务器须在同一局域网。

## 技术栈

- Kotlin + ViewBinding
- CameraX 1.3.1（兼容各厂商相机）
- ML Kit Barcode Scanning 17.2.0
- OkHttp 4.12.0
- Material Components 1.11.0
- minSdk 24（Android 7.0+）
