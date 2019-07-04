# CSS Variables for ie11!
Custom Properties polyfill for IE11


## it can
- handle dynamic added `<style>`, `<link>`-elements
- handle dynamic added html-content
- cascade works
- inheritance works
- fallback works `var(--color, blue)`
- :focus, :active
- js-integration: just call `style.setProperty('--x','y')`, `style.getPropertyValue('--x')`
- under 2k gziped, who would have thought that?

## todo
- ~~dynamic added --variables are not inherited yet~~
- ~~getComputedStyle(el).getPropertyValue() will not get inherited values yet~~
- listen for mouseenter/mouseleave to support `hover:`

## limitations
- styles in element-attributes can not be handled `<div style="--color:blue">`, I could implement that if someone needs it: `<div style="--color:blue; -ie-color:blue">`
- specificity for properties containing "var()" is always little highter, cause each selector gets an additional class-selector (eg. `#header` results in `#header.iecp_u44`)

## demo:
https://rawcdn.githack.com/nuxodin/ie11CustomProperties/0d9deadf602f6a8d5bd91364c0f17a9cb7257845/test.html?v2

## help needed!
Please test and report bugs / future requests
