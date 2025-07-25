## TinyMCE 图表插件使用说明

本插件用于在 TinyMCE 编辑器中插入柱状图或折线图，支持用户通过表单输入图表数据，并在编辑器中渲染图表。

### 📦 安装与引入

将插件文件 chart-plugin.js 引入页面或 TinyMCE 配置中：

```HTML
<script src="/your/path/chart-plugin.js"></script>
```

初始化 TinyMCE 编辑器时注册插件：

```js
tinymce.init({
  selector: "#editor",
  plugins: "echart",
  toolbar: "insertChart",
  contextmenu: "insertChart",
  data_echart: "https://cdn.bootcdn.net/ajax/libs/echarts/5.5.0/echarts.min.js", // 可选，自定义 ECharts CDN
  data_echart_title: {
    text: "图表示例"
  }, // 可选，ECharts 标题配置
  data_echart_grid: {},         // 可选，ECharts grid 配置
  data_echart_legend: {},       // 可选，ECharts legend 配置
  data_echart_tooltip: {},      // 可选，ECharts tooltip 配置
});
```

### ✨ 功能说明

#### ✅ 插入图表

1. 右键菜单 或 工具栏按钮 点击「插入图表」。
2. 弹出图表配置窗口：
   - 图表类型：柱状图或折线图
   - 宽度、高度：输入图表尺寸（单位 px）
   - 数据输入表格：
   - 每一行代表一组数据，输入 X 轴 和 Y 轴 数据
   - 支持新增 / 删除行，自动排序
   - 点击「插入」后：
   - 插入一个图表占位 div 到编辑器中

#### 自动渲染 ECharts 图表

📊 图表结构示例（插入后的 HTML）
```HTML
<div class="custom-chart"
     data-chart-type="bar"
     data-chart-x='["苹果","香蕉","梨"]'
     data-chart-y='[5,3,7]'
     data-chart-width="600"
     data-chart-height="400"
     id="chart-1698657860000"
     style="width:600px;height:400px;border:1px dashed #ccc;">
</div>
```

### 🔧 插件结构概览

#### 插件注册
```JS
tinymce.PluginManager.add("echart", function(editor) { ... });
```

#### 主要模块

- openChartDialog: 打开弹窗用于数据输入
- insertChart: 向编辑器插入图表 HTML
- renderChart: 使用 ECharts 渲染图表
- loadEcharts: 动态加载 ECharts 脚本
- nextTick: 类似 Vue 的微任务实现，确保渲染时 DOM 已准备好

### 🖼 图表编辑方式
目前插件不支持编辑已插入图表，如需修改请手动删除重新插入。

### 🔧 自定义配置参数

| 参数名                | 类型   | 默认值   | 说明                              |
| --------------------- | ------ | -------- | --------------------------------- |
| `data_echart`         | string | CDN 链接 | 自定义 ECharts 的脚本链接         |
| `data_echart_title`   | object | `{}`     | 图表标题配置（参考 ECharts 配置） |
| `data_echart_grid`    | object | `{}`     | 网格配置                          |
| `data_echart_legend`  | object | `{}`     | 图例配置                          |
| `data_echart_tooltip` | object | `{}`     | 提示框配置                        |

### 后续计划
- 行号校验、错误提示增强
- 弹窗中实时预览 ECharts 图表
- 标题、网格、图例、堆叠开关
- 图表销毁
