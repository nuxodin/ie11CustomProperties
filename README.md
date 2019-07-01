# ie11CustomProperties
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

## limitations / bugs
- overwride a custom-property in a style-tag with the same specificity does not work
- dynamic added --variables are not inherited
- getComputedStyle(el).getPropertyValue() // will not get inherited values at the moment
- styles in element-attributes not handled yet
- specificity for properties containing "var()" is always little highter, because each selector gets an additional class-selector

## your improvement welcome!
