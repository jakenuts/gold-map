## React prerequisites[](https://react-leaflet.js.org/docs/start-introduction/#react-prerequisites "Direct link to React prerequisites")

This documentation assumes you are already familiar with [React](https://react.dev/) and have a project setup. If it is not the case, you should read [React's Getting Started documentation](https://react.dev/learn) first.

## Leaflet prerequisites[](https://react-leaflet.js.org/docs/start-introduction/#leaflet-prerequisites "Direct link to Leaflet prerequisites")

This documentation assumes you are already familiar with [Leaflet](https://leafletjs.com/). React Leaflet **does not replace Leaflet**, it only provides bindings between React and Leaflet.

This documentation **is not a replacement** for [Leaflet's documentation](https://leafletjs.com/reference.html), it only focuses on aspects specific to React Leaflet.

## Adding React Leaflet[](https://react-leaflet.js.org/docs/start-introduction/#adding-react-leaflet "Direct link to Adding React Leaflet")

### Using ESM imports[](https://react-leaflet.js.org/docs/start-introduction/#using-esm-imports "Direct link to Using ESM imports")

React Leaflet exports [ES Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) that can be imported by URL, notably from CDNs such as [esm.sh](https://esm.sh/):

```
<span><span>import</span><span> </span><span>{</span><span> </span><span>MapContainer</span><span> </span><span>}</span><span> </span><span>from</span><span> </span><span>'https://cdn.esm.sh/react-leaflet/MapContainer'</span><span></span><br></span><span><span></span><span>import</span><span> </span><span>{</span><span> </span><span>TileLayer</span><span> </span><span>}</span><span> </span><span>from</span><span> </span><span>'https://cdn.esm.sh/react-leaflet/TileLayer'</span><span></span><br></span><span><span></span><span>import</span><span> </span><span>{</span><span> useMap </span><span>}</span><span> </span><span>from</span><span> </span><span>'https://cdn.esm.sh/react-leaflet/hooks'</span><br></span>
```

Or importing the full library at once:

```
<span><span>import</span><span> </span><span>{</span><span></span><br></span><span><span>  </span><span>MapContainer</span><span>,</span><span></span><br></span><span><span>  </span><span>TileLayer</span><span>,</span><span></span><br></span><span><span>  useMap</span><span>,</span><span></span><br></span><span><span></span><span>}</span><span> </span><span>from</span><span> </span><span>'https://cdn.esm.sh/react-leaflet'</span><br></span>
```

### Using a package registry[](https://react-leaflet.js.org/docs/start-introduction/#using-a-package-registry "Direct link to Using a package registry")

A package registry such as [npm](https://www.npmjs.com/) can be used to install React Leaflet and its dependencies.

React, React DOM and Leaflet are required peer dependencies. You must add them to your project if they are not already installed:

-   npm
-   yarn

```
<span><span>npm install react react-dom leaflet</span><br></span>
```

Then you can install React Leaflet:

-   npm
-   yarn

```
<span><span>npm install react-leaflet</span><br></span>
```

Modules can then be imported using bare specifiers when supported by a bundler such as [webpack](https://webpack.js.org/).

```
<span><span>import</span><span> </span><span>{</span><span> </span><span>MapContainer</span><span> </span><span>}</span><span> </span><span>from</span><span> </span><span>'react-leaflet/MapContainer'</span><span></span><br></span><span><span></span><span>import</span><span> </span><span>{</span><span> </span><span>TileLayer</span><span> </span><span>}</span><span> </span><span>from</span><span> </span><span>'react-leaflet/TileLayer'</span><span></span><br></span><span><span></span><span>import</span><span> </span><span>{</span><span> useMap </span><span>}</span><span> </span><span>from</span><span> </span><span>'react-leaflet/hooks'</span><br></span>
```

Alternatively, all the components and hooks can be imported from the module entry-point:

```
<span><span>import</span><span> </span><span>{</span><span> </span><span>MapContainer</span><span>,</span><span> </span><span>TileLayer</span><span>,</span><span> useMap </span><span>}</span><span> </span><span>from</span><span> </span><span>'react-leaflet'</span><br></span>
```

## TypeScript support[](https://react-leaflet.js.org/docs/start-introduction/#typescript-support "Direct link to TypeScript support")

### Dependencies[](https://react-leaflet.js.org/docs/start-introduction/#dependencies "Direct link to Dependencies")

React Leaflet provides TypeScript definitions in the installed packages, but needs Leaflet's definitions to be present. If you have not installed them yet, you will need to add them:

-   npm
-   yarn

```
<span><span>npm install -D @types/leaflet</span><br></span>
```

### Imports[](https://react-leaflet.js.org/docs/start-introduction/#imports "Direct link to Imports")

TypeScript definitions are only exported from the package entry-point, so you should import from it directly when using TypeScript:

```
<span><span>// ⚠️ No types available here</span><span></span><br></span><span><span></span><span>import</span><span> </span><span>{</span><span> MapContainer </span><span>}</span><span> </span><span>from</span><span> </span><span>'react-leaflet/MapContainer'</span><span></span><br></span><span><span></span><br></span><span><span></span><span>// ✅ Types are available here</span><span></span><br></span><span><span></span><span>import</span><span> </span><span>{</span><span> MapContainer </span><span>}</span><span> </span><span>from</span><span> </span><span>'react-leaflet'</span><br></span>
```