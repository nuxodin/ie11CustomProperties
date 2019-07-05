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
	const regFindSetters = /(--([^;}]+:[^;}]+))/g;
	const regFindGetters = /([{;][\s]*)(.+:.*var\(([^;}]*))/g;
	const regRuleIEGetters = /-ieVar-([^:]+):/g
	const regRuleIESetters = /-ie-([^};]+)/g
	const regHasVar = /var\(/;

	c1.onElement('link[rel="stylesheet"]', function (el) {
		fetchCss(el.href, function (css) {
			var newCss = rewriteCss(css);
			if (css === newCss) return;
			el.disabled = true;
			var style = document.createElement('style');
			el.after(style);
			activateStyleElement(style, newCss);
		});
	});
	c1.onElement('style', function (el) {
		if (el.hasAttribute('ie-polyfilled')) return;
		var css = el.innerHTML;
		var newCss = rewriteCss(css);
		if (css === newCss) return;
		activateStyleElement(el, newCss);
	});

	function rewriteCss(css) {
		//css = css.replace(regFindSetters, '-ie-$2; $1');
		//return css.replace(regFindGetters, '$1-ieVar-$2');
		css = css.replace(regFindSetters, '-ie-$2');
		return css.replace(regFindGetters, '$1-ieVar-$2; $2'); // keep the original, so chaining works "--x:var(--y)"
	}
	function activateStyleElement(style, css) {
		style.innerHTML = css;
		style.setAttribute('ie-polyfilled', true);
		var rules = style.sheet.rules || style.sheet.cssRules;
		for (var i = 0, rule; rule = rules[i++];) {
			var matchesGetters = rule.cssText.match(regRuleIEGetters);
			if (matchesGetters) {
				var properties = []; // eg. [border,color]
				for (var j = 0, match; match = matchesGetters[j++];) {
					properties.push(match.slice(7, -1));
				}
				addGettersSelector(rule.selectorText, properties);
			}
			var matchesSetters = rule.cssText.match(regRuleIESetters);
			if (matchesSetters) {
				var propVals = {};// beta eg. [--color:#fff, --padding:10px];
				for (var j = 0, match; match = matchesSetters[j++];) {
					var x = match.substr(4).split(':');
					propVals[x[0]] = x[1];
				}
				addSettersSelector(rule.selectorText, propVals);
			}
		}
	}

	function addGettersSelector(selector, properties) {
		c1.onElement(selector, function (el) {
			elementAddGetters(el, properties, selector)
		});
	}
	function elementAddGetters(el, properties, selector) {
		el.setAttribute('iecp-needed', true);
		if (!el.ieCPsNeeded) el.ieCPsNeeded = {};
		for (var i = 0, prop; prop = properties[i++];) {
			el.ieCPsNeeded[prop] = selector; // multiple selectors?
		}
	}
	function addSettersSelector(selector, propVals) {
		// var els = document.querySelectorAll(selector); // works without inheritance

		var parts = selector.split(':hover');
		if (parts.length > 1) {
			c1.onElement(parts[0], function (el) {
				el.addEventListener('mouseenter', drawTreeEvent);
				el.addEventListener('mouseleave', drawTreeEvent);
			});
		}
		var parts = selector.split(':focus');
		if (parts.length > 1) {
			c1.onElement(parts[0], function (el) {
				el.addEventListener('focusin', drawTreeFocusInEvent);
				el.addEventListener('focusout', drawTreeEvent);
			});
		}
		var parts = selector.split(':active');
		if (parts.length > 1) {
			c1.onElement(parts[0], function (el) {
				el.addEventListener('focusin', drawTreeFocusInEvent);
				el.addEventListener('focusout', drawTreeEvent);
			});
		}

		c1.onElement(selector, function (el) {
			elementAddSetters(el, propVals);
		});
	}
	function elementAddSetters(el, propVals) {
		if (!el.ieCP_setters) el.ieCP_setters = {};
		for (var prop in propVals) { // {foo:#fff, bar:baz}
			el.ieCP_setters['--' + prop] = 1;
		}
		drawTree(el);
	}

	var uniqueCounter = 0;

	function drawElement(el) {
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
		for (var prop in el.ieCPsNeeded) {
			var selector = el.ieCPsNeeded[prop]; // selector needed to make a style-rule with the same specificity
			var valueWithVar = style['-ieVar-' + prop];
			var value = styleComputeValueWidthVars(style, valueWithVar);
			el.ieCP_sheet.insertRule(selector.trim() + '.iecp-u' + el.ieCP_unique + ' {' + prop + ':' + value + '}', 0); // faster then innerHTML
			//el.style[prop] = value; // element inline-style: strong specificity
		}
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

	function drawTree(target) {
		requestAnimationFrame(function () {
			//console.time('test1')
			var els = target.querySelectorAll('[iecp-needed]');
			if (target.hasAttribute('iecp-needed')) drawElement(target); // self
			for (var i = 0, el; el = els[i++];) drawElement(el); // tree
			//console.timeEnd('test1')
		})
	}
	function drawTreeEvent(e) {
		drawTree(e.target)
	}
	function drawTreeFocusInEvent(e) {
		drawTree(e.target)
		setTimeout(function () {
			drawTree(e.target)
		}, 100);
	}

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
	// 	setInterval(function(){
	// 		drawTree(document.documentElement);
	// 	},200);

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
						var el = this.computedFor.parentNode;
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
					// drawTree(el); // todo
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
			} else {
				console.warn('an error was returned from:', url);
			}
		};
		request.onerror = function () {
			console.warn('we could not get anything from:', url);
		};
		request.send();
	}

}();
