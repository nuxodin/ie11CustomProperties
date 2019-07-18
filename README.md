# CSS Variables for IE11
A realy comprehensive polyfill for Custom Properties in IE11


## It can:
- chaining `--bar:var(--foo)`
- fallback `var(--color, blue)`
- :focus, :target, :hover
- handle dynamic added html-content
- handle dynamic added `<style>`, `<link>`-elements
- js-integration:
    - `style.setProperty('--x','y')`
    - `style.getPropertyValue('--x')`
    - `getComputedStyle(el).getPropertyValue('--inherited')`
    - `CSS.registerProperty({name:'--red', inherit:false, initialValue:'#e33'})`
- style-attributes `<div ie-style="--foo:bar"...`
- cascade works
- inheritance works
- under 3k (min+gzip) and dependency-free

## Demo:
https://rawcdn.githack.com/nuxodin/ie11CustomProperties/298e5d0ec4f3b01d2022022b9cf6278b5ac174db/test.html

## Limitations
#### styles in element-attributes
There is no way to get the raw content of style-attributes in IE11.
Use `<div style="--color:blue" ie-style="--color:blue">` for it

#### specificity for properties containing "var()"
...is always little highter, cause each selector gets an additional class-selector
eg. `#header` results in `#header.iecp_u44`


## Help wanted!
Please test and report bugs.
And add a ⭐️ and tweet about if you like it.
