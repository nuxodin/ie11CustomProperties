# CSS Variables Polyfill for IE11
A real Custom Properties polyfill for Internet Explorer 11.  
Used on about 11'000 [Live Websites](https://publicwww.com/websites/ie11CustomProperties/ "source")  
  
**[See the demo!](https://rawcdn.githack.com/nuxodin/ie11CustomProperties/6c465d21a8c043a45cba939995bb434966048377/demo.html)**  

**New in v4.0.0: Very fast now**


## Features
- chaining `--bar:var(--foo)`
- fallback `var(--color, blue)`
- :focus, :target, :hover
- handle dynamically added html-content
- handle dynamically added `<style>`, `<link>`-elements
- js-integration:
    - `style.setProperty('--x','y')`
    - `style.getPropertyValue('--x')`
    - `getComputedStyle(el).getPropertyValue('--inherited')`
- Houdini’s new API: `CSS.registerProperty({name:'--red', inherit:false, initialValue:'#e33'})` (of course not animatable)
- style-attributes `<div ie-style="--foo:bar"...`
- cascade works
- inheritance works
- `!important` on setters and getters
- `inherit`, `initial`, `unset` and `revert` keyword for variables
- SVG support
- media-queries (redraw on media-changes)
- transform relative to absolute urls
- under 4k (min+gzip) and dependency-free

## Usage
You only want IE11 to load the polyfill, use this snippet in the head of your html file, it just works:
```html
<script>window.MSInputMethodContext && document.documentMode && document.write('<script src="https://cdn.jsdelivr.net/gh/nuxodin/ie11CustomProperties@4.0.1/ie11CustomProperties.min.js"><\x2fscript>');</script>
```

## Help wanted!
- Add a ⭐️
- Vote for this solution at stackoverflow   
https://stackoverflow.com/a/57000437/4865307 and  
https://stackoverflow.com/a/57000620/4865307
- Test, report bugs and send pull requests.
- Tweet about if you like it.

## How it works
The script makes use of the fact that IE has minimal custom properties support where properties can be defined and read out with the cascade in mind. This is not possible with properties starting with double dashes.
`.myEl {-ie-test:'aaa'} // only one dash allowed! "-"`
then you can read it in IE with javascript:
`getComputedStyle( querySelector('.myEl') )['-ie-test']`
In the raw CSS, it replaces for example `--foo` with `-ie-foo`.
It searches for all rules containing variable getters and setter, remembers the affected selectors so future affected Elements can be found in a mutation observer.
Each affected Element gets a uniq class-attribute and its own style-sheet to draw the Element.
These are the steps that the script does:
1. given the CSS
```css
header { --myColor:red; }
main { --myColor:green; }
li { color:var(--myColor); }
```
2. rewritten CSS
```css
header { -ie-myColor:red; }
main { -ie-myColor:green; }
li { -ieHasVar-color:var(-ie-myColor); }
```
3. find all affected Elements and get their property-values
```js
querySelectorAll('li').forEach(function(){
    var color = getComputedStyle(this).getPropertyValue('--myColor');
    // getPropertyValue is extended to handle custom properties
    // draw_the_Element()
})
```
3. draw Elements, this leads in separate rules for each Element
```css
li.iecp-u1 { color:red; }
li.iecp-u2 { color:red; }
li.iecp-u3 { color:green; }
li.iecp-u4 { color:green; }
```
[![custom-properties-ie11.png](https://i.postimg.cc/bryMt02N/custom-properties-ie11.png)](https://postimg.cc/gX7N9ZDf)


## Small limitations
#### Styles in element-attributes
There is no way to get the raw content of style-attributes in IE11.
Use `<div style="--color:blue" ie-style="--color:blue">` for this.

#### Specificity for properties containing "var()"
...is ~~always little~~ higher if vars are not served by root, because each selector gets an additional class-selector
eg. `#header` results in `#header.iecp_u44`

## Tests
[See the tests](https://rawcdn.githack.com/nuxodin/ie11CustomProperties/6c465d21a8c043a45cba939995bb434966048377/tests.html)  
PRs welcome
