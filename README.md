# data-server
使用nodejs搭建的数据处理服务器（nodejs/pm2）
### 安装
通过`npm`安装本地服务第三方依赖模块
```
npm i
```
### 启动
```
npm run dev
```
### 服务器上启动
#### 首先安装pm2
```
npm i -g pm2
```
#### 启动当前项目
```
npm run product
或者
pm2 start bin/www
```
#### 当前项目pm2配置参照ecosysytem.json文件
