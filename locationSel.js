/*
	require jQuery

	usage: $().locationSel({
		tabs : ["市","区"], // defaults
		cities : ["深圳市", "广州市"],
		districts : {
						"深圳市": ["南山区","罗湖区","福田区"],
						"广州市": ["越秀区","海珠区","白云区"]
		}
	})
*/

(function($){
	
	function LocationSel($el, settings){
		this.$el = $el;
		this.opts = $.extend({}, $.fn.locationSel.defaults, settings);
		this._result = {};
	}

	$.fn.locationSel = function(settings){
		var index = this.length;
		return this.each(function(index){
			var $el = $(this);
			var key = ('locationSel' + index > 1 ? ("-" + ++index) : "" );
			var instance;
			(instance = new LocationSel($el, settings)).initialize();
			$el.data(key, instance);
		});

	}


	LocationSel.prototype = {
		initialize: function(){

			var me = this;

			//对目标对象添加 class
			me.$el.addClass("wl_location_sel_target");

			//生成 modefied 后的 content
			me._modifyContent();


			//生成 tabs 列表
			me.genTabs();

			//绑定 tabs 事件
			me.addEventListeners();
		},

		genTabs: function(){
			var me = this;
			//提取 标签头、标签内容
			var tabsH = me._getTabsHead();
			var tabsContent = me._getTabContent();
			
			//构成选择列表
			var html = "<section class='wl_location_sel'>";

			// head tabs
			html += 		"<ul class='wl_location_sel_head'>";
			$.each(tabsH, function(index,el){
				html += 		"<li data-value='" + el + "'>" + el + "</li>";
			});
			html += 		"</ul>";

			//content tabs
			html += 		"<ul class='wl_location_sel_content'>";
			$.each(tabsContent, function(index,el){
				html += 		"<li data-value='" + el + "'>" + el + "</li>";
			});
			html += 		"</ul>";

			html +=    "</section>";

			me._locationSel = $(html);

			me.setTabDefault();

		},


		setTabDefault: function(){
			
			var me = this;

			me.setActiveTab();

			me.setTabsUpper();

			me.setSelectLevel();

			me.setLocation();
		},



		setActiveTab: function(){
			var me = this;
			me._locationSel
				.find(".wl_location_sel_head li")
				.eq(me.opts.activeTab - 1)
				.addClass("active");
		},

		//设置 head tab 所属上级行政单位
		setTabsUpper: function(){
			var me = this;
			var MAP = {
				"市" : "省",
				"区" : "市"
			};
			var $headTabs = me._locationSel.find(".wl_location_sel_head li");
			var key, val;
			$headTabs.each(function(index, el){
				key = MAP[$(el).data('value')];
				if(val = me.opts.defaultLocation[key]){
					$(el).data('upper', val);
				}
			});
			
			
		},

		setSelectLevel: function(){
			var me = this;
			var $headTabs = me._locationSel.find(".wl_location_sel_head li");

			$headTabs.each(function(index, el){
				var $el = $(el);
				if (index < me.opts.level - 1) {
					$el.addClass("has_next");
				};
			})

		},


		setLocation: function(){
			var me = this;
			me.$el.after(me._locationSel);

			//设定 tabs 列表位置
			me._locationSel.css({
				position: "absolute",
				left: me.$el.offset().left,
				top:me.$el.offset().top + me.$el.outerHeight(),
				display: "none"
			})
			
		},


		addEventListeners: function(){
			
			var me = this;

			//点击 el 切换列表可见性
			me.$el.on("click.locationSel", function(e){
				me._locationSel.toggle();
			});

			//监听 tabs 头 切换 tabs 内容
			me._locationSel.on("click.tabsH.li", ".wl_location_sel_head li", function(e){

				//设置相应 tabs 头 li active
				$(event.target).addClass("active");

				//根据已经选择好的上级内容生成自己这一级别的内容

				//TODO 一开始就选择区时，因为没有选择市，所以 显示空白
				if ($(event.target).data("upper")) {
					me.genCurTab($(event.target).data("upper"));
				}

				else {
					me.clearCurTab();
				}

			});

			//监听点击 tabs 内容，设置选定内容，决定下一步
			me._locationSel.on("click.tabsContent.li", ".wl_location_sel_content li", function(){

				//获取 active tabs head
				var $activeHead = me._locationSel.find(".wl_location_sel_head .active");

				//设置 head 与 selected item 键值对，如 市：广州市
				var selHead = $activeHead.data("value");
				var selItem = $(event.target).data("value");
				
				me._result[selHead] = selItem;


				//根据 tabs head 的 class 决定下一步
					//如果有 has_next
						//更新 head active tab
						//更新 content tab
					//如果没有 
						//认为选择结束

				if ($activeHead.hasClass("has_next")) {


					//TODO 暂时这样做，为免 DOM 结构对这个效果有影响，以后采用自己的 Index 
					$activeHead.removeClass("active");
					$activeHead.next().addClass("active");

					//设置 activeHead 的 upper 属性
					$activeHead.next().data("upper", selItem);

					//生成新列表内容
					me.genCurTab($(event.target).data("value"));
				}
				//结束选择
				else {
					me._endSel();
				}
			});
		},

		genCurTab: function(upper){

			var html = "";
			var content = this._getTabContent(upper);
			
			$.each(content, function(index, el){
				html += "<li data-value='" + el + "'>" + el + "</li>";
			});
			
			this._locationSel.find(".wl_location_sel_content").html(html);
		},

		clearCurTab: function(){
			this._locationSel.find(".wl_location_sel_content").html('');
		},

		_getTabContent: function(upper){
			upper = upper || "广东省";
			return this.modefiedContent[upper];
		},

		_endSel: function(){
			var me = this;
			var selectedVal = me._getValues(me._result);
			//隐藏 tabs
			me._locationSel.hide();
			//设置 target 值
			me.$el
				.text(selectedVal)
				.data("selectedVal",selectedVal);
		},

		_getTabsHead: function(){
			//直接来吧
			return this.opts.tabs;
		},

		_modifyContent: function(){
			var me = this;

			me.modefiedContent = $.extend({"广东省" : me.opts.cities}, me.opts.districts);
			
		},


		_getKeys: function(){

		},

		_getValues: function(obj){
			var value = [];
			$.each(obj, function(key, val){
				value.push(val);
			})
			return value;
		}


	}


	$.fn.locationSel.defaults = {
		activeTab : 1,
		level : 2,
		defaultLocation : {"省" : "广东省"}

	}
})(jQuery);
