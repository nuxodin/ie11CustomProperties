// c1.onElement - helper
!function(){ 'use strict';
	var w = window;
	if (!w.WeakSet) {
	    w.WeakSet = function(iterable){
		this.Map = new WeakMap();
		iterable && iterable.forEach(this.add, this);
	    }
	    WeakSet.prototype = {
		add:function(value){
		    this.Map.set(value, 1);
		    return this;
		},
		delete:function(value){ return this.Map.delete(value); },
		has:function(value){ return this.Map.has(value); }
	    }
	}

	if (!w.c1) w.c1 = {};
	var listeners = [],
	    root = document.documentElement,
	    Observer;

	c1.onElement = function(selector, options/*, disconnectedCallback*/) {
		if (typeof options === 'function') {
			options = { parsed:options }
		}
	    var listener = {
		selector: selector,
			immediate: options.immediate,
		//disconnectedCallback: disconnectedCallback,
		elements: new WeakSet(),
	    };
		if (options.parsed) {
		listener.parsed = function(el){
				requestAnimationFrame(function(){
					options.parsed(el);
				});
			}
		}

	    var els = root.querySelectorAll(listener.selector), i=0, el;
	    while (el = els[i++]) {
		listener.elements.add(el);
		listener.parsed    && listener.parsed.call(el, el);
		listener.immediate && listener.immediate.call(el, el);
	    }

	    listeners.push(listener);
	    if (!Observer) {
		Observer = new MutationObserver(checkMutations);
		Observer.observe(root, {
		    childList: true,
		    subtree: true
		});
	    }
	    checkListener(listener);
	};
	function checkListener(listener, target) {
	    var i=0, el, els = [];
	    target && target.matches(listener.selector) && els.push(target);
	    if (loaded) { // ok? check inside node on innerHTML - only when loaded
		Array.prototype.push.apply(els, (target||root).querySelectorAll(listener.selector));
	    }
	    while (el = els[i++]) {
		if (listener.elements.has(el)) continue;
		listener.elements.add(el);
		//listener.connectedCallback.call(el, el);
		listener.parsed    && listener.parsed.call(el, el);
		listener.immediate && listener.immediate.call(el, el);
	    }
	}
	function checkListeners(inside) {
	    var i=0, listener;
	    while (listener = listeners[i++]) checkListener(listener, inside);
	}
	function checkMutations(mutations) {
	    var j=0, i, mutation, nodes, target;
	    while (mutation = mutations[j++]) {
		nodes = mutation.addedNodes, i=0;
		while (target=nodes[i++]) target.nodeType === 1 && checkListeners(target);
	    }
	}

	var loaded = false;
	document.addEventListener('DOMContentLoaded',function(){
	    loaded = true;
	});

}();

// main logic
!function(){ 'use strict';
	var docElSty = document.documentElement.style;
	docElSty.setProperty('--x','y');
	if (docElSty.getPropertyValue('--x') === 'y') return;


	c1.onElement('link[rel="stylesheet"]',function(el){
		fetchCss(el.href, function(css){
			var newCss = rewriteCss(css);
			if (css === newCss) return;
			el.disabled = true;
			var style = document.createElement('style');
			el.parentNode.insertAfter(style, el);
			activateStyleElement(style, newCss);
		});
	});
	c1.onElement('style',function(el){
		if (el.hasAttribute('ie-polyfilled')) return;
		var css = el.innerHTML;
		var newCss = rewriteCss(css);
		if (css === newCss) return;
		activateStyleElement(el, newCss);
	});

	function rewriteCss(css){
		css = css.replace(/(--([^;}]+:[^;}]+))/g, '-ie-$2; $1');
		// css.replace(/([{;][\s]*)(.+:.*var\(([^;}]*))/g, function(full,bevore,propVal){ console.log(propVal) });
		return css.replace(/([{;][\s]*)(.+:.*var\(([^;}]*))/g, '$1-ieVar-$2');
	}
	function activateStyleElement(style, css){
		style.innerHTML = css;
		style.setAttribute('ie-polyfilled',true);
		var rules = style.sheet.rules || style.sheet.cssRules;
		for (var i=0, rule; rule = rules[i++];){
			var matchesGetters = rule.cssText.match(/-ieVar-([^:]+):/g);
			if (matchesGetters) {
				var properties = []; // eg. [border,color]
				for (var j=0, match; match=matchesGetters[j++];) {
					properties.push(match.slice(7,-1));
				}
				addGettersSelector(rule.selectorText, properties);
			}
			var matchesSetters = rule.cssText.match(/-ie-([^};]+)/g);
			if (matchesSetters) {
				var propVals = {};// beta eg. [--color:#fff, --padding:10px];
				for (var j=0, match; match=matchesSetters[j++];) {
					var x = match.substr(4).split(':');
					propVals[x[0]] = x[1];
				}
				addSettersSelector(rule.selectorText, propVals);
			}
		}
	}

    function addGettersSelector(selector, properties) {
        c1.onElement(selector, function(el){
            elementAddGetters(el, properties, selector)
        });
    }
    function elementAddGetters(el, properties, selector){
		el.setAttribute('iecp-needed',true);
		if (!el.ieCPsNeeded) el.ieCPsNeeded = {};
        for (var i=0, prop; prop = properties[i++];) {
			el.ieCPsNeeded[prop] = selector;
		}
    }
    function addSettersSelector(selector, propVals) {
		// var els = document.querySelectorAll(selector); // works without inheritance
		// for (var j=0, el; el=els[j++];) drawTree(el);
		// todo handle :hover, ,:focus
        c1.onElement(selector, function(el){
            elementAddSetters(el, propVals);
        });
    }
    function elementAddSetters(el, propVals){ // beta
		for (var prop in propVals) {
			//el.setAttribute('iecp--'+prop, propVals[prop]) // value not needed!?
			el.setAttribute('iecp--'+prop) // value not needed!?
		}
		drawTree(el);
    }

	var uniqueCounter = 0;

	function drawElement(el){
		if (!el.ieCP_unique) {
			el.ieCP_unique = ++uniqueCounter;
			el.classList.add('iecp-'+el.ieCP_unique);
		}
		if (!el.ieCP_sheet) {
			var tag = document.createElement('style');
			document.head.appendChild(tag);
			el.ieCP_sheet = tag.sheet;
		}

        var style = getComputedStyle(el);
		while (el.ieCP_sheet.rules[0]) el.ieCP_sheet.deleteRule(0);
		for (var prop in el.ieCPsNeeded) {
			var selector = el.ieCPsNeeded[prop]; // selector needed to make a style-rule with the same specificity
            var propWithVar = style['-ieVar-'+prop];
            var value = propWithVar.replace(/var\(([^)]+)\)/, function(full, variable){ // todo: fallback
                //return style.getPropertyValue(variable);
				var value = style.getPropertyValue(variable);
				if (value!==undefined) return value;
				var servingEl = el.closest('[iecp'+variable+']');
				if (!servingEl) {
					console.log('serving el for '+variable+' not found at ',el);
					return;
				}
				return getComputedStyle(servingEl).getPropertyValue(variable);
            });

			el.ieCP_sheet.insertRule(selector.trim()+'.iecp-'+el.ieCP_unique+' {'+prop+':'+value+'}', 0); // faster then innerHTML
            //el.style[prop] = value; // element inline-style: strong specificity

        }
	}
	function drawTree(target){
		requestAnimationFrame(function(){
//console.time('test')
			var els = target.querySelectorAll('[iecp-needed]');
			if (target.hasAttribute('iecp-needed')) drawElement(target); // self
			for (var i=0, el; el=els[i++];) drawElement(el); // tree
//console.timeEnd('test')
		})
	}
	function drawTreeEvent(e){
		drawTree(e.target)
	}

	// :focus
	document.addEventListener('focusin', drawTreeEvent, true);
	document.addEventListener('focusout', drawTreeEvent, true);
	// listeners, todo
	// var observer = new MutationObserver(function(mutations) {
	// 	for (var i, mutation; mutation=mutations[i++];) {
	// 		drawTree(mutation.target)
	// 	}
	// });
	// observer.observe(document.documentElement, {
	// 	attributes: true,
	// 	subtree: true
	// });
	/* *
	setInterval(function(){
		drawTree(document.documentElement);
	},200);
	/* */


	// getPropertyValue / setProperty hooks
    var CSSStyleDeclarationProto = CSSStyleDeclaration.prototype;

    var original = CSSStyleDeclarationProto.getPropertyValue;
    Object.defineProperty(CSSStyleDeclarationProto, 'getPropertyValue', {
        value:function(property) {
            if (property.match(/^--/)) {
                property = property.replace(/^--/, '-ie-');
                return this[property];
            }
            return original.apply(this, arguments);
        }
    });

    var originalSetProp = CSSStyleDeclarationProto.setProperty;
    Object.defineProperty(CSSStyleDeclarationProto, 'setProperty', {
        value:function(property, value, prio) {
            if (property.match(/^--/)) {
                property = property.replace(/^--/, '-ie-');
                this.cssText += '; '+property+':'+value+';';
                //this[property] = value;
            }
            return originalSetProp.apply(this, arguments);
        }
    });

	// utils
	function fetchCss(url, success) {
        var request = new XMLHttpRequest();
        request.open('GET', url);
        request.overrideMimeType('text/css');
        request.onload = function() {
            if (request.status >= 200 && request.status < 400) {
                if (typeof success === 'function') {
                    success(request.responseText);
                }
            } else {
                console.warn('an error was returned from:', url);
            }
        };
        request.onerror = function() {
            console.warn('we could not get anything from:', url);
        };
        request.send();
    }

}();
