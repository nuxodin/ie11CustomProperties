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

## How it works
The script makes use of the fact that IE has minimal custom properties support where properties can be defined and read out with the cascade in mind. This is not possible with properties starting with double dashes.
`.myEl {-ie-test:'aaa'} // only one dash allowed! "-"`  
then you can read it in IE with javascript:  
`getComputedStyle( querySelector('.myEl') )['-ie-test']`  
In the raw CSS, it replaces for example `--foo` with `-ie-foo`.
It searches for all rules containing variable getters and setter, remembers the affected selectors so future affected Elements can be found in a mutation observer.
Each affected Element gets a uniq class-attribute and its own style-sheet to draw the Element.
Here is an example with the different steps:  
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
3. find all affected Element and get its property-values
```js
querySelectorAll('li').forEach(function(){
    var color = getComputedStyle(this).getPropertyValue('--myColor');
    // getPropertyValue is extended to handle custom properties
    // draw_the_Element()
})
```
3. draw Elements, this leads in separate rules for each Element
```css
li.uniq1 { color:red; }
li.uniq2 { color:red; }
li.uniq3 { color:green; }
li.uniq4 { color:green; }
```
[![custom-properties-ie11.png](https://i.postimg.cc/bryMt02N/custom-properties-ie11.png)](https://postimg.cc/gX7N9ZDf)



## Help wanted!
Please test and report bugs.
And add a ⭐️ and tweet about if you like it.
