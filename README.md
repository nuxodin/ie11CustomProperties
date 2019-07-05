# CSS Variables for ie11!
Custom Properties polyfill for IE11


## it can
- handle dynamic added `<style>`, `<link>`-elements
- handle dynamic added html-content
- cascade works
- inheritance works
- chaining `--bar:var(--foo)`
- fallback works `var(--color, blue)`
- :focus, :active, :hover
- js-integration:  
    - `style.setProperty('--x','y')`
    - `style.getPropertyValue('--x')`
    - `getComputedStyle(el).getPropertyValue('--inherited')` !!
- under 2k gziped, who would have thought that?

## todo
- ~~dynamic added --variables are not inherited yet~~
- ~~getComputedStyle(el).getPropertyValue() will not get inherited values yet~~
- ~~listen for mouseenter/mouseleave to support hover:~~

## limitations
- styles in element-attributes can not be handled `<div style="--color:blue">`, I could implement the following if someone needs it: `<div style="--color:blue; -ie-color:blue">`
- specificity for properties containing "var()" is always little highter, cause each selector gets an additional class-selector (eg. `#header` results in `#header.iecp_u44`)

## demo:
https://rawcdn.githack.com/nuxodin/ie11CustomProperties/49e4bc55408c81386cb2e627fe65cfa153b77bea/test.html?v4

## help needed!
Please test and report bugs
And add a ⭐️ or tweet about if you like it.
