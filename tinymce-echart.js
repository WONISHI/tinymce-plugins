// 插件注册文件（chart-plugin.js）
(function() {
  tinymce.PluginManager.add("echart", function(editor) {
    // 获取参数
    const data_echart = editor.getParam("data_echart", "https://cdn.bootcdn.net/ajax/libs/echarts/5.5.0/echarts.min.js");
    const data_echart_title = editor.getParam("data_echart_title");
    const data_echart_grid = editor.getParam("data_echart_grid");
    const data_echart_legend = editor.getParam("data_echart_legend");
    const data_echart_tooltip = editor.getParam("data_echart_tooltip");
    let data_echart_options = null;
    let data_echart_el = null;
    // 添加右键菜单
    editor.ui.registry.addContextMenu("chartContext", {
      update: () => "insertChart"
    });

    editor.ui.registry.addMenuItem("insertChart", {
      text: "图表",
      onAction: () => {
        data_echart_el = editor.dom.getParent(editor.selection.getStart(), "div.custom-chart");
        if (data_echart_el) {
          data_echart_el.setAttribute("tabindex", "-1");
          editor.getBody().setAttribute("contenteditable", "false");
          data_echart_options = parseChartDataAttrs(data_echart_el);
        }
        openChartDialog(data_echart_el);
      }
    });

    // 解析参数
    function parseChartDataAttrs(el) {
      const data = {};
      Array.from(el.attributes).forEach(attr => {
        if (attr.name.startsWith("data-chart-")) {
          const key = attr.name.replace("data-chart-", "");
          try {
            data[key] = JSON.parse(attr.value);
          } catch (e) {
            data[key] = attr.value;
          }
        }
      });
      return data;
    }

    // 封装的nextTick函数
    const nextTick = (function() {
      let callbacks = [];
      let pending = false;
      function flushCallbacks() {
        const copies = callbacks.slice(0);
        callbacks.length = 0;
        pending = false;
        for (let i = 0; i < copies.length; i++) {
          copies[i]();
        }
      }
      let timerFunc;
      if (typeof Promise !== "undefined") {
        timerFunc = () => Promise.resolve().then(flushCallbacks);
      } else if (typeof MutationObserver !== "undefined") {
        const observer = new MutationObserver(flushCallbacks);
        const textNode = document.createTextNode("1");
        observer.observe(textNode, { characterData: true });
        let counter = 1;
        timerFunc = () => {
          counter = (counter + 1) % 2;
          textNode.data = counter;
        };
      } else {
        timerFunc = () => setTimeout(flushCallbacks, 0);
      }
      return function(cb) {
        callbacks.push(cb);
        if (!pending) {
          pending = true;
          timerFunc();
        }
      };
    })();
    loadEcharts();
    // 打开弹窗
    function openChartDialog(el) {
      const { type, width, height, x, y } = data_echart_options || { type: "", width: "", height: "", x: [], y: [] };
      editor.windowManager.open({
        title: !data_echart_el ? "插入图表" : "修改图表",
        initialData: {
          type: type || "bar",
          width: String(width),
          height: String(height)
        },
        body: {
          type: "panel",
          items: [
            {
              type: "selectbox",
              name: "type",
              label: "图表类型",
              items: [
                { text: "柱状图", value: "bar" },
                { text: "折线图", value: "line" }
              ]
            },
            {
              type: "input",
              name: "width",
              label: "宽度 (px)",
              inputMode: "numeric"
            },
            {
              type: "input",
              name: "height",
              label: "高度 (px)",
              inputMode: "numeric"
            },
            {
              type: "htmlpanel",
              name: "dataTable",
              html: `<style>
                  #data-input-table { width: 100%; border-collapse: collapse; margin-top:8px; }
                  #data-input-table th, #data-input-table td { border: 1px solid #ccc; padding: 4px; text-align: center; }
                  #data-input-table td[contenteditable] { background: #f9f9f9; cursor: text; }
                  #add-row-btn { margin-top: 6px; }
                  .remove-row-btn { color: red; cursor: pointer; border:none; background:none; font-weight: bold; }
                </style>
                <table id="data-input-table" contenteditable="false">
                  <thead>
                    <tr>
                      <th>序号</th>
                      <th>X轴</th>
                      <th>Y轴</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                     ${
                       !x.length
                         ? `<tr>
                            <td>1</td>
                            <td contenteditable="true"></td>
                            <td contenteditable="true"></td>
                            <td><button type="button" class="remove-row-btn" title="删除此行">删除</button></td>
                          </tr>`
                         : x
                             .map((val, index) => {
                               return `<tr>
                                        <td>${index + 1}</td>
                                        <td contenteditable="true">${val}</td>
                                        <td contenteditable="true">${y[index]}</td>
                                        <td><button type="button" class="remove-row-btn" title="删除此行">删除</button></td>
                                      </tr>`;
                             })
                             .join("")
                     }
                  </tbody>
                </table>
                <button type="button" id="add-row-btn">新增</button>`
            }
          ]
        },
        buttons: [
          { type: "submit", text: "插入" },
          { type: "cancel", text: "取消" }
        ],
        onSubmit: api => {
          const { type, width, height } = api.getData();
          try {
            const dialogs = document.querySelectorAll(".tox-dialog");
            if (!dialogs.length) return;
            const dialog = dialogs[dialogs.length - 1];
            const tr = dialog.querySelectorAll("#data-input-table tbody tr");
            const x = [];
            const y = [];
            tr.forEach(row => {
              const xVal = row.cells[1].textContent.trim();
              const yVal = parseFloat(row.cells[2].textContent.trim());
              if (xVal && !isNaN(yVal)) {
                x.push(xVal);
                y.push(yVal);
              }
            });
            if (!x.length || !y.length) {
              editor.windowManager.alert("请填写完整的数据！");
              return;
            }
            // 你的插入逻辑
            insertChart(el, {
              type,
              width: parseInt(width) || 600,
              height: parseInt(height) || 400,
              x,
              y
            });
            api.close();
          } catch (e) {
            editor.windowManager.alert("插入失败，请检查数据格式");
          }
        },
        oncancel: api => {
          console.log("api", api);
        }
      });
      // 弹窗打开后等待下一事件循环再绑定事件，且从弹窗内部查找
      nextTick(() => {
        // 找到所有弹窗，取最后一个（最新打开）
        const dialogs = document.querySelectorAll(".tox-dialog");
        if (!dialogs.length) return;
        const dialog = dialogs[dialogs.length - 1]; // 最新弹窗
        const addBtn = dialog.querySelector("#add-row-btn");
        const tbody = dialog.querySelector("#data-input-table tbody");
        if (addBtn && tbody) {
          addBtn.addEventListener("click", () => {
            const rowCount = tbody.rows.length;
            const newRow = document.createElement("tr");
            newRow.innerHTML = `
              <td>${rowCount + 1}</td>
              <td contenteditable="true"></td>
              <td contenteditable="true"></td>
              <td><button type="button" class="remove-row-btn" title="删除此行">删除</button></td>
            `;
            tbody.appendChild(newRow);
          });

          tbody.addEventListener("click", e => {
            if (e.target.classList.contains("remove-row-btn")) {
              const tr = e.target.closest("tr");
              if (tr) {
                tr.remove();
                [...tbody.rows].forEach((row, idx) => {
                  row.cells[0].textContent = idx + 1;
                });
              }
            }
          });
        }
      });
    }

    function insertChart(el, { type, width, height, x, y }) {
      let id = null;
      if (!el) {
        id = "chart-" + Date.now();
        editor.insertContent(
          `<p>
              <div
              class="custom-chart"
              data-chart-type="${type}"
              data-chart-x='${JSON.stringify(x)}'
              data-chart-y='${JSON.stringify(y)}'
              data-chart-width="${width}"
              data-chart-height="${height}"
              id="${id}"
              contenteditable="false"
              style="width:${width}px;height:${height}px;border:1px dashed #ccc;">
              </div>
          </p>`
        );
      } else {
        id = editor.dom.getAttrib(el, "id");
        editor.dom.setAttrib(el, "data-chart-type", type);
        editor.dom.setAttrib(el, "data-chart-x", JSON.stringify(x));
        editor.dom.setAttrib(el, "data-chart-y", JSON.stringify(y));
        editor.dom.setAttrib(el, "data-chart-width", width);
        editor.dom.setAttrib(el, "data-chart-height", height);
        editor.dom.setAttrib(el, "style", `width:${width}px;height:${height}px;border:1px dashed #ccc;`);
        editor
          .getBody()
          .querySelectorAll(".mce-offscreen-selection")
          .forEach(el => el.remove());
      }
      renderChart(id, { type, x, y });
    }

    function loadEcharts(callback) {
      if (window.echarts) {
        callback && callback();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdn.bootcdn.net/ajax/libs/echarts/5.5.0/echarts.min.js";
      document.head.appendChild(script);
    }

    function renderChart(id, { type, x, y }) {
      nextTick(() => {
        const el = editor.getDoc().getElementById(id);
        const chart = echarts.init(el);
        const option = {
          title: data_echart_title || {},
          tooltip: data_echart_tooltip || {},
          xAxis: {
            type: "category",
            data: x
          },
          yAxis: {
            type: "value"
          },
          series: [
            {
              data: y,
              type: type
            }
          ]
        };
        chart.setOption(option);
      });
    }
  });
})();
