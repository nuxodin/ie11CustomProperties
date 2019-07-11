/* Copyright (c) 2016 Tobias Buschor https://goo.gl/gl0mbf | MIT License https://goo.gl/HgajeK */
// Helpers / needed Polyfills
!function () {
    'use strict';

    if (!Element.prototype.matches) Element.prototype.matches = Element.prototype.msMatchesSelector;

    var w = window;
    if (!w.WeakSet) {
        w.WeakSet = function (iterable) {
            this.Map = new WeakMap();
            iterable && iterable.forEach(this.add, this);
        }
        WeakSet.prototype = {
            add: function (value) {
                this.Map.set(value, 1);
                return this;
            },
            delete: function (value) { return this.Map.delete(value); },
            has: function (value) { return this.Map.has(value); }
        }
    }

    if (!w.c1) w.c1 = {};
    var listeners = [],
        root = document,
        Observer;

    c1.onElement = function (selector, options/*, disconnectedCallback*/) {
        if (typeof options === 'function') {
            options = { parsed: options }
        }
        var listener = {
            selector: selector,
            immediate: options.immediate,
            //disconnectedCallback: disconnectedCallback,
            elements: new WeakSet(),
        };

        if (options.parsed) {
            listener.parsed = function (el) {
                requestAnimationFrame(function () {
                    options.parsed(el);
                });
            };
        }

        var els = root.querySelectorAll(listener.selector), i = 0, el;
        while (el = els[i++]) {
            listener.elements.add(el);
            listener.parsed && listener.parsed.call(el, el);
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
        var i = 0, el, els = [];
        target && target.matches(listener.selector) && els.push(target);
        if (loaded) { // ok? check inside node on innerHTML - only when loaded
            Array.prototype.push.apply(els, (target || root).querySelectorAll(listener.selector));
        }
        while (el = els[i++]) {
            if (listener.elements.has(el)) continue;
            listener.elements.add(el);
            //listener.connectedCallback.call(el, el);
            listener.parsed && listener.parsed.call(el, el);
            listener.immediate && listener.immediate.call(el, el);
        }
    }
    function checkListeners(inside) {
        var i = 0, listener;
        while (listener = listeners[i++]) checkListener(listener, inside);
    }
    function checkMutations(mutations) {
		var j = 0, i, mutation, nodes, target;
        while (mutation = mutations[j++]) {
            nodes = mutation.addedNodes, i = 0;
            while (target = nodes[i++]) target.nodeType === 1 && checkListeners(target);
        }
    }

    var loaded = false;
    document.addEventListener('DOMContentLoaded', function () {
        loaded = true;
    });

}();

// main logic
!function () {
	'use strict';
	var docElSty = document.documentElement.style;
	docElSty.setProperty('--x', 'y');
	if (docElSty.getPropertyValue('--x') === 'y') return;

	// cached regexps, better performance?
	const regFindSetters = /(--([^;}]+:[^;!}]+)(!important)?)/g;
	//const regFindGetters = /([{;]\s*)(.+:.*var\(([^;}]*))/g;
	const regFindGetters = /([{;]\s*)([^;}]+:[^;}]*var\([^;}]+)/g;
	const regRuleIEGetters = /-ieVar-([^:]+):/g
	const regRuleIESetters = /-ie-([^};]+)/g
	const regHasVar = /var\(/;
	const regPseudos = /:(hover|active|focus|target|:before|:after)/;

	c1.onElement('link[rel="stylesheet"]', {immediate:function (el) {
		fetchCss(el.href, function (css) {
			var newCss = rewriteCss(css);
			if (css === newCss) return;
			el.disabled = true;
			var style = document.createElement('style');
			el.after(style);
			activateStyleElement(style, newCss);
		});
	}});
	c1.onElement('style', {immediate:function (el) {
		if (el.hasAttribute('ie-polyfilled')) return;
		var css = el.innerHTML;
		var newCss = rewriteCss(css);
		if (css === newCss) return;
		activateStyleElement(el, newCss);
	}});
	c1.onElement('[ie-style]', {immediate:function (el) {
		var newCss = rewriteCss('{'+el.getAttribute('ie-style')).substr(1);
		el.style.cssText += ';'+ newCss;
		var found = parseRewrittenCss(newCss);
		if (found.getters) addGetterElement(el, found.getters, '%styleAttr');
		if (found.setters) addSetterElement(el, found.setters);
	}});

	// ie has a bug, where unknown properties at pseudo-selectors are computed at the element
	// #el::after { -content:'x'; } => getComputedStyle(el)['-content'] == 'x'
	// should we add something like -ieVar-pseudo_after-content:'x'?
	function rewriteCss(css) {
		//css = css.replace(regFindSetters, function(x, y, propVal, important){ return '-ie-'+propVal+(important?'ie-important':'')}); // todo: !imporant
		css = css.replace(regFindSetters, '-ie-$2');
		return css.replace(regFindGetters, '$1-ieVar-$2; $2'); // keep the original, so chaining works "--x:var(--y)"
	}
	function parseRewrittenCss(cssText){
		var matchesGetters = cssText.match(regRuleIEGetters);
		if (matchesGetters) {
			var getters = []; // eg. [border,color]
			for (var j = 0, match; match = matchesGetters[j++];) {
				getters.push(match.slice(7, -1));
			}
		}
		var matchesSetters = cssText.match(regRuleIESetters);
		if (matchesSetters) {
			var setters = {};// beta eg. [--color:#fff, --padding:10px];
			for (var j = 0, match; match = matchesSetters[j++];) {
				var x = match.substr(4).split(':');
				setters[x[0]] = x[1];
			}
		}
		return {getters:getters, setters:setters};
	}
	function activateStyleElement(style, css) {
		style.innerHTML = css;
		style.setAttribute('ie-polyfilled', true);
		var rules = style.sheet.rules || style.sheet.cssRules;
		for (var i = 0, rule; rule = rules[i++];) {
			const found = parseRewrittenCss(rule.cssText)
			if (found.getters) addGettersSelector(rule.selectorText, found.getters);
			if (found.setters) addSettersSelector(rule.selectorText, found.setters);
		}
	}

	function addGettersSelector(selector, properties) {
		selectorAddPseudoListeners(selector);
		var selectorWithoutPseudo = selector.replace(regPseudos,'');
		c1.onElement(selectorWithoutPseudo, function (el) {
			addGetterElement(el, properties, selector);
			drawElement(el);
		});
	}
	function addGetterElement(el, properties, selector) {
		el.setAttribute('iecp-needed', true);
		if (!el.ieCPSelectors) el.ieCPSelectors = {};
		for (var i = 0, prop; prop = properties[i++];) {
			const parts = selector.trim().split('::');
			if (!el.ieCPSelectors[prop]) el.ieCPSelectors[prop] = [];
			el.ieCPSelectors[prop].push({
				selector: parts[0],
				pseudo: parts[1] ? '::'+parts[1] : '',
			});
		}
	}
	function addSettersSelector(selector, propVals) {
		selectorAddPseudoListeners(selector);
		const selectorWithoutPseudo = selector.replace(regPseudos,'');
		c1.onElement(selectorWithoutPseudo, function (el) {
			addSetterElement(el, propVals);
			drawTree(el);
		});
	}
	function addSetterElement(el, propVals) {
		if (!el.ieCP_setters) el.ieCP_setters = {};
		for (var prop in propVals) { // {foo:#fff, bar:baz}
			el.ieCP_setters['--' + prop] = 1;
		}
	}

	const pseudos = {
		hover:{
			on:'mouseenter',
			off:'mouseleave'
		},
		focus:{
			on:'focusin',
			off:'focusout'
		}
	};
	function selectorAddPseudoListeners(selector){
		for (var pseudo in pseudos) {
			var parts = selector.split(':'+pseudo);
			if (parts.length > 1) {
				const listeners = pseudos[pseudo];
				c1.onElement(parts[0], function (el) {
					el.addEventListener(listeners.on, drawTreeEvent);
					el.addEventListener(listeners.off, drawTreeEvent);
				});
			}
		}
	}


	var uniqueCounter = 0;

	function _drawElement(el) {
		if (!el.ieCP_unique) { // use el.uniqueNumber? but needs class for the css-selector => test performance
			el.ieCP_unique = ++uniqueCounter;
			el.classList.add('iecp-u' + el.ieCP_unique);
		}
		if (!el.ieCP_sheet) {
			var tag = document.createElement('style');
			document.head.appendChild(tag);
			el.ieCP_sheet = tag.sheet;
		}
		var style = getComputedStyle(el);
		while (el.ieCP_sheet.rules[0]) el.ieCP_sheet.deleteRule(0);
		for (var prop in el.ieCPSelectors) {
			var valueWithVar = style['-ieVar-' + prop];
			if (!valueWithVar) continue;
			var value = styleComputeValueWidthVars(style, valueWithVar);

			for (var i=0, item; item=el.ieCPSelectors[prop][i++];) {
				if (item.selector === '%styleAttr') {
					el.style[prop] = value;
				} else {
					el.ieCP_sheet.insertRule(item.selector + '.iecp-u' + el.ieCP_unique + item.pseudo + ' {' + prop + ':' + value + '}', 0); // faster then innerHTML
				}
			}
		}
	}
	function drawTree(target) {
		if (!target) return;
		var els = target.querySelectorAll('[iecp-needed]');
		if (target.hasAttribute && target.hasAttribute('iecp-needed')) drawElement(target); // self
		for (var i = 0, el; el = els[i++];) drawElement(el); // tree
	}
	// draw queue
	let drawQueue = {};
	let collecting = false;
	let drawing = false;
	function drawElement(el){
		drawQueue[el.uniqueNumber] = el;
		if (collecting) return;
		collecting = true;
		requestAnimationFrame(function(){
			collecting = false;
			drawing = true;
			for (var nr in drawQueue) _drawElement(drawQueue[nr]);
			requestAnimationFrame(function(){ // mutationObserver will trigger delayed
				drawing = false;
			})
			drawQueue = {};
		})
	}


	function drawTreeEvent(e) {
		drawTree(e.target)
	}

	const regValueGetters = /var\(([^),]+)(\,(.+))?\)/g;
	function styleComputeValueWidthVars(style, valueWithVar){
		return valueWithVar.replace(regValueGetters, function (full, variable, x, fallback) {
			variable = variable.trim();
			var pValue = style.getPropertyValue(variable);
			if (pValue === undefined && fallback !== undefined) pValue = fallback.trim(); // fallback
			return pValue;
		});
	}

	// mutation listener
	var observer = new MutationObserver(function(mutations) {
		if (drawing) return;
		for (var i=0, mutation; mutation=mutations[i++];) {
			if (mutation.attributeName === 'ie-polyfilled') continue;
			if (mutation.attributeName === 'iecp-needed') continue;
			// recheck all selectors if it targets new elements?
			drawTree(mutation.target);
		}
	});
	setTimeout(function(){
		observer.observe(document,{attributes: true, subtree: true });
	})

	// :target listener
	var oldHash = location.hash
	addEventListener('hashchange',function(e){
		var newEl = document.getElementById(location.hash.substr(1));
		if (newEl) {
			var oldEl = document.getElementById(oldHash.substr(1));
			drawTree(newEl);
			drawTree(oldEl);
		} else {
			drawTree(document);
		}
		oldHash = location.hash;
	})
	/*
	// :active listener, on(de)activate, but wrong Elements can get activeElement
	var oldActive = false;
	document.addEventListener('activate',function(e){
		const el = e.target;
		if (
			'form' in el
			|| el.isContentEditable
			|| el.hasAttribute('tabindex')
			|| el.tagName === 'A'
		) {
			console.log(el)
			oldActive = el;
		}
	})
	*/

	// add owningElement to Element.style
	var descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'style');
	var styleGetter = descriptor.get;
	descriptor.get = function () {
		const style = styleGetter.call(this);
		style.owningElement = this;
		return style;
	}
	Object.defineProperty(HTMLElement.prototype, 'style', descriptor);

	// add computedFor to computed style-objects
	var originalGetComputed = getComputedStyle;
	window.getComputedStyle = function (el) {
		var style = originalGetComputed.apply(this, arguments);
		style.computedFor = el;
		//style.pseudoElt = pseudoElt; //not needed at the moment
		return style;
	}

	// getPropertyValue / setProperty hooks
	var CSSStyleDeclarationProto = CSSStyleDeclaration.prototype;

	const regStartingVar = /^--/;
	var original = CSSStyleDeclarationProto.getPropertyValue;
	Object.defineProperty(CSSStyleDeclarationProto, 'getPropertyValue', {
		value: function (property) {
			if (property.match(regStartingVar)) {
				var ieProperty = property.replace(regStartingVar, '-ie-');
				var value = this[ieProperty];
				if (this.computedFor) { // computedStyle
					if (value !== undefined) {
						if (regHasVar.test(value)) {
							value = styleComputeValueWidthVars(this, value);
						}
					} else {
						// inherited
						//let el = this.pseudoElt ? this.computedFor : this.computedFor.parentNode;
						let el = this.computedFor.parentNode;
						while (el.nodeType === 1) {
							// how slower would it be to getComputedStyle for every element, not just with defined ieCP_setters
							if (el.ieCP_setters && el.ieCP_setters[property]) {
								// i could make
								// value = el.nodeType ? getComputedStyle(this.computedFor.parentNode).getPropertyValue(property)
								// but i fear performance, stupid?
								var style = getComputedStyle(el);
								var tmpVal = style[ieProperty];
								if (tmpVal !== undefined) {
									value = tmpVal;
									if (regHasVar.test(value)) {
										// calculated style from current element not from the element the value was inherited from! (style, value)
										value = styleComputeValueWidthVars(this, value);
									}
									break;
								}
							}
							el = el.parentNode;
						}
					}
				}

				return value;
			}
			return original.apply(this, arguments);
		}
	});

	var originalSetProp = CSSStyleDeclarationProto.setProperty;
	Object.defineProperty(CSSStyleDeclarationProto, 'setProperty', {
		value: function (property, value, prio) {
			if (property.match(regStartingVar)) {

				if (this.owningElement) {
					const el = this.owningElement;
					if (!el.ieCP_setters) el.ieCP_setters = {};
					el.ieCP_setters[property] = 1;
					drawTree(el);
				}

				property = property.replace(regStartingVar, '-ie-');
				this.cssText += '; ' + property + ':' + value + ';';
				//this[property] = value;
			}
			return originalSetProp.apply(this, arguments);
		}
	});

	// utils
	function fetchCss(url, callback) {
		var request = new XMLHttpRequest();
		request.open('GET', url);
		request.overrideMimeType('text/css');
		request.onload = function () {
			if (request.status >= 200 && request.status < 400) {
				callback(request.responseText);
			}
		};
		request.send();
	}

}();
