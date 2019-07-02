# ie11 Custom Properties
Custom Properties polyfill for IE11



## it can
- handle dynamic added style, linke-elements
- handle dynamic added html-content
- cascade works
- inheritance works
- :focus
- js-integration: just call style.setProperty('--x','y'), style.getPropertyValue('--x')
- add the script, it just works!
- just 1.5k gziped, Who would have thought that?

## limitations
- dynamic added --variables are not inherited
- getComputedStyle(el).getPropertyValue() will not get inherited values yet
- styles in element-attributes not handled yet
- specificity for properties containing "var()" is always little highter, because each selector gets an additional class-selector

## demo:
https://rawcdn.githack.com/nuxodin/ie11CustomProperties/d4a0b13a5037e0a1f20a83b19c00bf92855e3c7f/test.html?v16

## your improvement welcome!
