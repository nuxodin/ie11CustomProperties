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

## demo:
https://rawcdn.githack.com/nuxodin/ie11CustomProperties/0b993465d0d10d826b874ad1d4938f76f8093816/test.html?v12

## your improvement welcome!
