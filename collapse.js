(function() {
  if (typeof tinymce !== "undefined") {
    tinymce.PluginManager.add("collapse", function(editor) {
      let collapsed = false;
      let eventAttached = false;
      // 多少高度需要折叠
      const collapseHeight = editor.getParam("collapse_height", 100);
      // 初始化
      const needCollapse = editor.getParam("need_collapse", false);
      // 折叠是否可以输入
      const collapseInputEnabled = editor.getParam("collapse_input_enabled", false);
      // 可以触发展开
      const toggleOnClick = editor.getParam("toggle_on_click", false);
      // 展开的默认结构
      const extraContent = editor.getParam(
        "collapse_extra",
        `<div class="tinyme_collapse tinyme_collapse_noselect">
          <svg t="1751265426151" class="icon tinyme_collapse_noselect" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1485" width="20" height="20">
            <path d="M143 544.6L512 175.8 881 544.6c18.5 18.5 46.8 18.5 65.3 0 18.3-18.5 18.3-46.8 0-65L544.1 78c-9.1-9.3-21.2-14-32.1-14-12 0-23.9 4.7-32.1 14l-402 401.6c-18.5 18.3-18.5 46.6 0 65 18.1 18.4 46.6 18.4 65.1 0z" fill="#dd1d35"></path>
            <path d="M479.9 479.5l-402.2 400.7c-18.3 18.5-18.3 46.9 0 65.2 18.3 18.3 46.8 18.3 65.3 0L512 576.6 881 946.3c18.3 18.3 47 18.3 65.1 0 18.5-18.5 18.5-46.8 0-65L544.1 479.6c-8.3-9.1-20.1-13.8-32.1-13.8-10.9 0-23 4.6-32.1 13.7z" fill="#dd1d35"></path>
          </svg>
          <div class="tinyme_collapse_noselect" style="color:#dd1d35">展开</div>
        </div>`
      );
      // 收起的默认结构
      const expandedContent = editor.getParam(
        "collapse_expand",
        `<div class="tinyme_expand tinyme_collapse_noselect">
          <svg t="1751266822721" class="icon tinyme_collapse_noselect" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1632" width="20" height="20">
            <path d="M172.912 472.272c11.088 0 22.24 3.808 31.296 11.632l307.808 264.96 307.792-264.96a48 48 0 1 1 62.624 72.752l-308 265.104c-35.16800001 32.032-89.712 32.032-125.872-0.896L141.584 556.64a47.984 47.984 0 0 1 31.328-84.368z" p-id="1633" fill="#dd1d35"></path>
            <path d="M851.088 152.544a47.984 47.984 0 0 1 31.328 84.368l-308 265.12c-35.168 32.016-89.696 32.016-125.856-0.88l-307.008-264.24a47.984 47.984 0 0 1-5.056-67.68 47.952 47.952 0 0 1 67.68-5.056L512.016 429.12 819.808 164.16a47.808 47.808 0 0 1 31.28-11.616z" p-id="1634" fill="#dd1d35"></path>
          </svg>
          <div class="tinyme_collapse_noselect" style="color:#dd1d35">收起</div>
        </div>`
      );
      let extraElement = null;
      let expandedElement = null;
      function createElementFromHTML(doc, html) {
        if (!html) return null;
        const wrapper = doc.createElement("div");
        wrapper.innerHTML = html;
        const el = wrapper.firstElementChild || null;
        if (el && !toggleOnClick) {
          // 禁止编辑，禁止聚焦，禁止选中，禁止鼠标事件
          el.setAttribute("contenteditable", "false");
          el.setAttribute("tabindex", "-1");
          el.style.userSelect = "none";
          el.style.webkitUserSelect = "none";
          el.style.mozUserSelect = "none";
          el.style.msUserSelect = "none";
          el.style.pointerEvents = "none";
        }
        return el;
      }
      function injectStyles(doc) {
        if (doc.querySelector("#tinyme_collapse_style")) return;
        const styleTag = doc.createElement("style");
        styleTag.id = "tinyme_collapse_style";
        styleTag.textContent = `
          .tinyme_collapse_noselect{
            user-select:none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
          }
          .tinyme_collapse,
          .tinyme_expand {
            display: flex;
            width: 100%;
            justify-content: center;
            gap: 10px;
            align-items: center;
          }
          .tinyme_collapsible,
          .tinyme_expand {
            transition: max-height 0.5s ease;
          }
        `;
        doc.head.appendChild(styleTag);
      }
      function setCollapseState() {
        const body = editor.getBody();
        // 当页面没有body不设置
        if (!body) return;
        injectStyles(editor.getDoc());
        const children = Array.from(body.children).filter(el => el !== extraElement && el !== expandedElement);
        let accumulatedHeight = 0;
        let reachedLimit = false;
        children.forEach(child => {
          child.style.display = "";
          child.style.maxHeight = "";
          child.style.overflow = "";
        });
        children.forEach(child => {
          if (reachedLimit) {
            child.style.display = collapsed ? "none" : "";
          } else {
            const rect = child.getBoundingClientRect();
            console.log('rect',rect)
            const style = getComputedStyle(child);
            const paddingTop = parseFloat(style.paddingTop);
            const paddingBottom = parseFloat(style.paddingBottom);
            const marginTop = parseFloat(style.marginTop);
            const marginBottom = parseFloat(style.marginBottom);
            const totalHeight = rect.height + paddingTop + paddingBottom + marginTop + marginBottom;
            accumulatedHeight += totalHeight;
            if (collapsed && accumulatedHeight >= collapseHeight) {
              const excess = accumulatedHeight - collapseHeight;
              const newHeight = totalHeight - excess;
              child.style.maxHeight = newHeight + "px";
              child.style.overflow = "hidden";
              reachedLimit = true;
            }
          }
        });
        // 初始化折叠结构
        if (!extraElement && extraContent) {
          extraElement = createElementFromHTML(editor.getDoc(), extraContent);
          if (extraElement) {
            editor.getBody().appendChild(extraElement);
            const { height } = extraElement.getBoundingClientRect();
            editor.getBody().style.height = collapseHeight + height + "px";
            editor.getBody().style.overflow = "hidden";
          }
        }
        // 初始化展开结构
        if (!expandedElement && expandedContent) {
          expandedElement = createElementFromHTML(editor.getDoc(), expandedContent);
          if (expandedElement) editor.getBody().appendChild(expandedElement);
        }
        if (toggleOnClick && !eventAttached) {
          eventAttached = true;
          extraElement.addEventListener("click", function(e) {
            collapsed = false;
            setCollapseState();
            requestAnimationFrame(() => {
              const firstEditable = Array.from(editor.getBody().children).find(el => el !== extraElement && el !== expandedElement && el.nodeType === 1 && editor.dom.isBlock(el));
              if (firstEditable) {
                const rng = editor.dom.createRng();
                rng.setStart(firstEditable, 0);
                rng.collapse(true);
                editor.selection.setRng(rng);
                editor.focus();
              }
            });
          });
          expandedElement.addEventListener("click", function(e) {
            collapsed = true;
            setCollapseState();
          });
        }
        if (extraElement) extraElement.style.display = collapsed ? "" : "none";
        if (expandedElement) expandedElement.style.display = collapsed ? "none" : "";
        if (collapsed) {
          extraElement.setAttribute("contenteditable", "false");
          extraElement.setAttribute("tabindex", "-1");
          editor.getBody().setAttribute("contenteditable", "false");
        } else {
          editor.getBody().setAttribute("contenteditable", "true");
          editor.getBody().style.height = "";
          editor.getBody().style.overflow = "";
        }
      }
      // 初始化
      editor.on("SkinLoaded", () => {
        const checkRendered = () => {
          const firstChild = editor.getBody() && editor.getBody().children[0];
          if (firstChild && firstChild.offsetHeight > 0) {
            collapsed = !collapsed;
            setCollapseState();
          } else {
            requestAnimationFrame(checkRendered);
          }
        };
        if (needCollapse) {
          checkRendered();
        }
      });

      editor.on("NodeChange", function(e) {
        if (!extraElement || !collapseInputEnabled) return;
        const body = editor.getBody();
        const rect = e.element.getBoundingClientRect();
        const bodyRect = body.getBoundingClientRect();
        const { height } = extraElement.getBoundingClientRect();
        const distance = rect.top - bodyRect.top;
        const rng = editor.selection.getRng();
        const currentContainer = rng.startContainer;
        if (currentContainer === extraElement.previousSibling || currentContainer === extraElement) return;
        if (distance > collapseHeight + height) {
          const range = editor.dom.createRng();
          range.setStartBefore(extraElement);
          range.collapse(true);
          editor.selection.setRng(range);
        }
      });
      function waitForContentRendered(callback) {
        const body = editor.getBody();
        if (!body) {
          requestAnimationFrame(() => waitForContentRendered(callback));
          return;
        }
        const firstChild = body.children[0];
        if (firstChild && firstChild.offsetHeight > 0) {
          callback();
        } else {
          requestAnimationFrame(() => waitForContentRendered(callback));
        }
      }

      // 调用方法
      editor.addCommand("toggleCollapse", function() {
        waitForContentRendered(() => {
          collapsed = !collapsed;
          setCollapseState();
        });
      });

      // 注册按钮
      editor.ui.registry.addButton("collapse", {
        icon: "outdent",
        onAction: function() {
          editor.execCommand("toggleCollapse");
        }
      });

      editor.ui.registry.addMenuItem("collapse", {
        text: "折叠/展开内容区域",
        onAction: function() {
          editor.execCommand("toggleCollapse");
        }
      });
    });
  }
})();
