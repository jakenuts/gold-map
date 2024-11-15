## Interfaces and types[](https://react-leaflet.js.org/docs/start-introduction/#interfaces-and-types "Direct link to Interfaces and types")

### ControlledLayer[](https://react-leaflet.js.org/docs/start-introduction/#controlledlayer "Direct link to ControlledLayer")

```
<span><span>type</span><span> </span><span>ControlledLayer</span><span> </span><span>=</span><span> </span><span>{</span><span></span><br></span><span><span>  </span><span>addLayer</span><span>(</span><span>layer</span><span>:</span><span> Layer</span><span>)</span><span>:</span><span> </span><span>void</span><span></span><br></span><span><span>  </span><span>removeLayer</span><span>(</span><span>layer</span><span>:</span><span> Layer</span><span>)</span><span>:</span><span> </span><span>void</span><span></span><br></span><span><span></span><span>}</span><br></span>
```

### LeafletContextInterface[](https://react-leaflet.js.org/docs/start-introduction/#leafletcontextinterface "Direct link to LeafletContextInterface")

```
<span><span>type</span><span> </span><span>LeafletContextInterface</span><span> </span><span>=</span><span> Readonly</span><span>&lt;</span><span>{</span><span></span><br></span><span><span>  map</span><span>:</span><span> Map</span><br></span><span><span>  layerContainer</span><span>?</span><span>:</span><span> ControlledLayer </span><span>|</span><span> LayerGroup</span><br></span><span><span>  layersControl</span><span>?</span><span>:</span><span> Control</span><span>.</span><span>Layers</span><br></span><span><span>  overlayContainer</span><span>?</span><span>:</span><span> Layer</span><br></span><span><span>  pane</span><span>?</span><span>:</span><span> </span><span>string</span><span></span><br></span><span><span></span><span>}</span><span>&gt;</span><br></span>
```

### LeafletElement[](https://react-leaflet.js.org/docs/start-introduction/#leafletelement "Direct link to LeafletElement")

```
<span><span>type</span><span> </span><span>LeafletElement</span><span>&lt;</span><span>T</span><span>,</span><span> </span><span>C</span><span> </span><span>=</span><span> </span><span>any</span><span>&gt;</span><span> </span><span>=</span><span> Readonly</span><span>&lt;</span><span>{</span><span></span><br></span><span><span>  instance</span><span>:</span><span> </span><span>T</span><span></span><br></span><span><span>  context</span><span>:</span><span> LeafletContextInterface</span><br></span><span><span>  container</span><span>?</span><span>:</span><span> </span><span>C</span><span> </span><span>|</span><span> </span><span>null</span><span></span><br></span><span><span></span><span>}</span><span>&gt;</span><br></span>
```

### ElementHook[](https://react-leaflet.js.org/docs/start-introduction/#elementhook "Direct link to ElementHook")

```
<span><span>type</span><span> </span><span>ElementHook</span><span>&lt;</span><span>E</span><span>,</span><span> </span><span>P</span><span>&gt;</span><span> </span><span>=</span><span> </span><span>(</span><span></span><br></span><span><span>  props</span><span>:</span><span> </span><span>P</span><span>,</span><span></span><br></span><span><span>  context</span><span>:</span><span> LeafletContextInterface</span><span>,</span><span></span><br></span><span><span></span><span>)</span><span> </span><span>=&gt;</span><span> MutableRefObject</span><span>&lt;</span><span>LeafletElement</span><span>&lt;</span><span>E</span><span>&gt;&gt;</span><br></span>
```

### DivOverlay[](https://react-leaflet.js.org/docs/start-introduction/#divoverlay "Direct link to DivOverlay")

```
<span><span>type</span><span> </span><span>DivOverlay</span><span> </span><span>=</span><span> Popup </span><span>|</span><span> Tooltip</span><br></span>
```

### SetOpenFunc[](https://react-leaflet.js.org/docs/start-introduction/#setopenfunc "Direct link to SetOpenFunc")

```
<span><span>type</span><span> </span><span>SetOpenFunc</span><span> </span><span>=</span><span> </span><span>(</span><span>open</span><span>:</span><span> </span><span>boolean</span><span>)</span><span> </span><span>=&gt;</span><span> </span><span>void</span><br></span>
```

### DivOverlayLifecycleHook[](https://react-leaflet.js.org/docs/start-introduction/#divoverlaylifecyclehook "Direct link to DivOverlayLifecycleHook")

```
<span><span>type</span><span> </span><span>DivOverlayLifecycleHook</span><span>&lt;</span><span>E</span><span>,</span><span> </span><span>P</span><span>&gt;</span><span> </span><span>=</span><span> </span><span>(</span><span></span><br></span><span><span>  element</span><span>:</span><span> LeafletElement</span><span>&lt;</span><span>E</span><span>&gt;</span><span>,</span><span></span><br></span><span><span>  context</span><span>:</span><span> LeafletContextInterface</span><span>,</span><span></span><br></span><span><span>  props</span><span>:</span><span> </span><span>P</span><span>,</span><span></span><br></span><span><span>  setOpen</span><span>:</span><span> SetOpenFunc</span><span>,</span><span></span><br></span><span><span></span><span>)</span><span> </span><span>=&gt;</span><span> </span><span>void</span><br></span>
```

### DivOverlayHook[](https://react-leaflet.js.org/docs/start-introduction/#divoverlayhook "Direct link to DivOverlayHook")

```
<span><span>type</span><span> </span><span>DivOverlayHook</span><span>&lt;</span><span>E</span><span> </span><span>extends</span><span> DivOverlay</span><span>,</span><span> </span><span>P</span><span>&gt;</span><span> </span><span>=</span><span> </span><span>(</span><span></span><br></span><span><span>  useElement</span><span>:</span><span> ElementHook</span><span>&lt;</span><span>E</span><span>,</span><span> </span><span>P</span><span>&gt;</span><span>,</span><span></span><br></span><span><span>  useLifecycle</span><span>:</span><span> DivOverlayLifecycleHook</span><span>&lt;</span><span>E</span><span>,</span><span> </span><span>P</span><span>&gt;</span><span>,</span><span></span><br></span><span><span></span><span>)</span><span> </span><span>=&gt;</span><span> </span><span>(</span><span>props</span><span>:</span><span> </span><span>P</span><span>,</span><span> setOpen</span><span>:</span><span> SetOpenFunc</span><span>)</span><span> </span><span>=&gt;</span><span> ReturnType</span><span>&lt;</span><span>ElementHook</span><span>&lt;</span><span>E</span><span>,</span><span> </span><span>P</span><span>&gt;&gt;</span><br></span>
```

### EventedProps[](https://react-leaflet.js.org/docs/start-introduction/#eventedprops "Direct link to EventedProps")

```
<span><span>type</span><span> </span><span>EventedProps</span><span> </span><span>=</span><span> </span><span>{</span><span></span><br></span><span><span>  eventHandlers</span><span>?</span><span>:</span><span> LeafletEventHandlerFnMap</span><br></span><span><span></span><span>}</span><br></span>
```

### LayerProps[](https://react-leaflet.js.org/docs/start-introduction/#layerprops "Direct link to LayerProps")

```
<span><span>interface</span><span> </span><span>LayerProps</span><span> </span><span>extends</span><span> </span><span>EventedProps</span><span>,</span><span> LayerOptions </span><span>{</span><span>}</span><br></span>
```

### PathProps[](https://react-leaflet.js.org/docs/start-introduction/#pathprops "Direct link to PathProps")

```
<span><span>interface</span><span> </span><span>PathProps</span><span> </span><span>extends</span><span> </span><span>EventedProps</span><span> </span><span>{</span><span></span><br></span><span><span>  pathOptions</span><span>?</span><span>:</span><span> PathOptions</span><br></span><span><span></span><span>}</span><br></span>
```

### CircleMarkerProps[](https://react-leaflet.js.org/docs/start-introduction/#circlemarkerprops "Direct link to CircleMarkerProps")

```
<span><span>interface</span><span> </span><span>CircleMarkerProps</span><span> </span><span>extends</span><span> </span><span>CircleMarkerOptions</span><span>,</span><span> PathProps </span><span>{</span><span></span><br></span><span><span>  center</span><span>:</span><span> LatLngExpression</span><br></span><span><span>  children</span><span>?</span><span>:</span><span> ReactNode</span><br></span><span><span></span><span>}</span><br></span>
```

### MediaOverlayProps[](https://react-leaflet.js.org/docs/start-introduction/#mediaoverlayprops "Direct link to MediaOverlayProps")

```
<span><span>interface</span><span> </span><span>MediaOverlayProps</span><span> </span><span>extends</span><span> </span><span>ImageOverlayOptions</span><span>,</span><span> EventedProps </span><span>{</span><span></span><br></span><span><span>  bounds</span><span>:</span><span> LatLngBoundsExpression</span><br></span><span><span></span><span>}</span><br></span>
```

### PropsWithChildren[](https://react-leaflet.js.org/docs/start-introduction/#propswithchildren "Direct link to PropsWithChildren")

```
<span><span>type</span><span> </span><span>PropsWithChildren</span><span> </span><span>=</span><span> </span><span>{</span><span></span><br></span><span><span>  children</span><span>?</span><span>:</span><span> ReactNode</span><br></span><span><span></span><span>}</span><br></span>
```

### EventedWithChildrenProps[](https://react-leaflet.js.org/docs/start-introduction/#eventedwithchildrenprops "Direct link to EventedWithChildrenProps")

```
<span><span>interface</span><span> </span><span>EventedWithChildrenProps</span><span> </span><span>extends</span><span> </span><span>EventedProps</span><span>,</span><span> PropsWithChildren </span><span>{</span><span>}</span><br></span>
```

### PathWithChildrenProps[](https://react-leaflet.js.org/docs/start-introduction/#pathwithchildrenprops "Direct link to PathWithChildrenProps")

```
<span><span>interface</span><span> </span><span>PathWithChildrenProps</span><span> </span><span>extends</span><span> </span><span>PathProps</span><span>,</span><span> PropsWithChildren </span><span>{</span><span>}</span><br></span>
```

## Utilities[](https://react-leaflet.js.org/docs/start-introduction/#utilities "Direct link to Utilities")

### createElementObject[](https://react-leaflet.js.org/docs/start-introduction/#createelementobject "Direct link to createElementObject")

**Type parameters**

1.  `T`: Leaflet's element class type
2.  `C = any`: the element's container, if relevant

**Arguments**

1.  `instance: t`
2.  [`context: LeafletContextInterface`](https://react-leaflet.js.org/docs/start-introduction/#leafletcontextinterface)
3.  `container?: C`

**Returns** [`LeafletElement<T, C>`](https://react-leaflet.js.org/docs/start-introduction/#leafletelement)

### extendContext[](https://react-leaflet.js.org/docs/start-introduction/#extendcontext "Direct link to extendContext")

**Arguments**

1.  [`source: LeafletContextInterface`](https://react-leaflet.js.org/docs/start-introduction/#leafletcontextinterface)
2.  [`extra: Partial<LeafletContextInterface>`](https://react-leaflet.js.org/docs/start-introduction/#leafletcontextinterface)

**Returns** [`LeafletContextInterface`](https://react-leaflet.js.org/docs/start-introduction/#leafletcontextinterface)

## Context[](https://react-leaflet.js.org/docs/start-introduction/#context "Direct link to Context")

### LeafletContext[](https://react-leaflet.js.org/docs/start-introduction/#leafletcontext "Direct link to LeafletContext")

[React Context](https://react.dev/reference/react/createContext) used by React Leaflet, implementing the [`LeafletContextInterface`](https://react-leaflet.js.org/docs/start-introduction/#leafletcontextinterface)

### LeafletProvider[](https://react-leaflet.js.org/docs/start-introduction/#leafletprovider "Direct link to LeafletProvider")

`LeafletContext.Provider` component.

### createLeafletContext[](https://react-leaflet.js.org/docs/start-introduction/#createleafletcontext "Direct link to createLeafletContext")

**Arguments**

1.  `map: Map`

**Returns** [`LeafletContextInterface`](https://react-leaflet.js.org/docs/start-introduction/#leafletcontextinterface)

### useLeafletContext[](https://react-leaflet.js.org/docs/start-introduction/#useleafletcontext "Direct link to useLeafletContext")

[React Hook](https://react.dev/reference/react/hooks) returning the [`LeafletContext`](https://react-leaflet.js.org/docs/start-introduction/#leafletcontext). Calling this hook will throw an error if the context is not provided.

## Hook factories[](https://react-leaflet.js.org/docs/start-introduction/#hook-factories "Direct link to Hook factories")

The following functions return [React hooks](https://react.dev/reference/react/hooks) for specific purposes.

### createElementHook[](https://react-leaflet.js.org/docs/start-introduction/#createelementhook "Direct link to createElementHook")

**Type parameters**

1.  `E`: Leaflet's element class type
2.  `P`: the component's props
3.  `C = any`: the element's container, if relevant

**Arguments**

1.  `createElement: (props: P, context: LeafletContextInterface) => LeafletElement<E>`
2.  `updateElement?: (instance: E, props: P, prevProps: P) => void`

**Returns** [`ElementHook<E, P>`](https://react-leaflet.js.org/docs/start-introduction/#elementhook)

### createControlHook[](https://react-leaflet.js.org/docs/start-introduction/#createcontrolhook "Direct link to createControlHook")

**Type parameters**

1.  `E extends Control`: Leaflet's element class type
2.  `P extends ControlOptions`: the component's props

**Arguments**

1.  `useElement: ElementHook<E, P>`

**Returns** [`ElementHook<E, P>`](https://react-leaflet.js.org/docs/start-introduction/#elementhook)

### createDivOverlayHook[](https://react-leaflet.js.org/docs/start-introduction/#createdivoverlayhook "Direct link to createDivOverlayHook")

**Type parameters**

1.  `E extends DivOverlay`: Leaflet's element class type
2.  `P extends EventedProps`: the component's props

**Arguments**

1.  `useElement: ElementHook<E, P>`
2.  `useLifecycle: DivOverlayLifecycleHook<E, P>`

**Returns** [`ElementHook<E, P>`](https://react-leaflet.js.org/docs/start-introduction/#elementhook)

### createLayerHook[](https://react-leaflet.js.org/docs/start-introduction/#createlayerhook "Direct link to createLayerHook")

**Type parameters**

1.  `E extends Layer`: Leaflet's element class type
2.  `P extends LayerProps`: the component's props

**Arguments**

1.  `useElement: ElementHook<E, P>`

**Returns** [`ElementHook<E, P>`](https://react-leaflet.js.org/docs/start-introduction/#elementhook)

### createPathHook[](https://react-leaflet.js.org/docs/start-introduction/#createpathhook "Direct link to createPathHook")

**Type parameters**

1.  `E extends FeatureGroup | Path`: Leaflet's element class type
2.  `P extends PathProps`: the component's props

**Arguments**

1.  `useElement: ElementHook<E, P>`

**Returns** [`ElementHook<E, P>`](https://react-leaflet.js.org/docs/start-introduction/#elementhook)

## Lifecycle hooks[](https://react-leaflet.js.org/docs/start-introduction/#lifecycle-hooks "Direct link to Lifecycle hooks")

These hooks implement specific pieces of logic used by multiple components.

### useEventHandlers[](https://react-leaflet.js.org/docs/start-introduction/#useeventhandlers "Direct link to useEventHandlers")

This hook adds support for the `eventHandlers` prop, adding and removing event listeners as needed.

**Arguments**

1.  `element: LeafletElement<Evented>`
2.  `eventHandlers: LeafletEventHandlerFnMap | null | undefined`

**Returns** `void`

### useLayerLifecycle[](https://react-leaflet.js.org/docs/start-introduction/#uselayerlifecycle "Direct link to useLayerLifecycle")

This hook adds support for adding and removing the layer to/from its parent container or the map.

**Arguments**

1.  `element: LeafletElement<Layer>`
2.  `context: LeafletContextInterface`

**Returns** `void`

### usePathOptions[](https://react-leaflet.js.org/docs/start-introduction/#usepathoptions "Direct link to usePathOptions")

This hook adds support for the `pathOptions` prop, updating the layer as needed.

**Arguments**

1.  `element: LeafletElement<FeatureGroup | Path>`
2.  `props: PathProps`

**Returns** `void`

## Update functions[](https://react-leaflet.js.org/docs/start-introduction/#update-functions "Direct link to Update functions")

Shared update logic for different components.

### updateCircle[](https://react-leaflet.js.org/docs/start-introduction/#updatecircle "Direct link to updateCircle")

Updates the circle's `center` and `radius` if the props change.

**Type parameters**

1.  `E extends CircleMarker`: Leaflet's element class type
2.  `P extends CircleMarkerProps`: the component's props

**Arguments**

1.  `layer: E`
2.  `props: P`
3.  `prevProps: P`

**Returns** `void`

### updateGridLayer[](https://react-leaflet.js.org/docs/start-introduction/#updategridlayer "Direct link to updateGridLayer")

Updates the layer's `opacity` and `zIndex` if the props change.

**Type parameters**

1.  `E extends GridLayer`: Leaflet's element class type
2.  `P extends GridLayerOptions`: the component's props

**Arguments**

1.  `layer: E`
2.  `props: P`
3.  `prevProps: P`

**Returns** `void`

### updateMediaOverlay[](https://react-leaflet.js.org/docs/start-introduction/#updatemediaoverlay "Direct link to updateMediaOverlay")

Updates the overlay's `bounds`, `opacity` and `zIndex` if the props change.

**Type parameters**

1.  `E extends ImageOverlay | SVGOverlay | VideoOverlay`: Leaflet's element class type
2.  `P extends MediaOverlayProps`: the component's props

**Arguments**

1.  `overlay: E`
2.  `props: P`
3.  `prevProps: P`

**Returns** `void`

## DOM interactions[](https://react-leaflet.js.org/docs/start-introduction/#dom-interactions "Direct link to DOM interactions")

Utility functions to change the class of a `HTMLElement`.

### addClassName[](https://react-leaflet.js.org/docs/start-introduction/#addclassname "Direct link to addClassName")

**Arguments**

1.  `element: HTMLElement`
2.  `className: string`

**Returns** `void`

### removeClassName[](https://react-leaflet.js.org/docs/start-introduction/#removeclassname "Direct link to removeClassName")

**Arguments**

1.  `element: HTMLElement`
2.  `className: string`

**Returns** `void`

### updateClassName[](https://react-leaflet.js.org/docs/start-introduction/#updateclassname "Direct link to updateClassName")

**Arguments**

1.  `element?: HTMLElement`
2.  `prevClassName?: string`
3.  `nextClassName?: string`

**Returns** `void`

## Component factories[](https://react-leaflet.js.org/docs/start-introduction/#component-factories "Direct link to Component factories")

These functions create components from the provided element hook.

### createContainerComponent[](https://react-leaflet.js.org/docs/start-introduction/#createcontainercomponent "Direct link to createContainerComponent")

**Type parameters**

1.  `E`: Leaflet's element class type
2.  `P extends PropsWithChildren`: the component's props

**Arguments**

1.  `useElement: ElementHook<E, P>`

**Returns** `ForwardRefExoticComponent<PropsWithoutRef<P> & RefAttributes<E>>`

### createDivOverlayComponent[](https://react-leaflet.js.org/docs/start-introduction/#createdivoverlaycomponent "Direct link to createDivOverlayComponent")

**Type parameters**

1.  `E extends DivOverlay`: Leaflet's element class type
2.  `P extends PropsWithChildren`: the component's props

**Arguments**

1.  `useElement: ReturnType<DivOverlayHook<E, P>>`

**Returns** `ForwardRefExoticComponent<PropsWithoutRef<P> & RefAttributes<E>>`

### createLeafComponent[](https://react-leaflet.js.org/docs/start-introduction/#createleafcomponent "Direct link to createLeafComponent")

**Type parameters**

1.  `E`: Leaflet's element class type
2.  `P`: the component's props

**Arguments**

1.  `useElement: ElementHook<E, P>`

**Returns** `ForwardRefExoticComponent<PropsWithoutRef<P> & RefAttributes<E>>`

## High-level component factories[](https://react-leaflet.js.org/docs/start-introduction/#high-level-component-factories "Direct link to High-level component factories")

These functions combine hooks and component factories to provide high-level factories for common component types.

### createControlComponent[](https://react-leaflet.js.org/docs/start-introduction/#createcontrolcomponent "Direct link to createControlComponent")

**Type parameters**

1.  `E extends Control`: Leaflet's element class type
2.  `P extends ControlOptions`: the component's props

**Arguments**

1.  `createInstance: (props: P) => E`

**Returns** `ForwardRefExoticComponent<PropsWithoutRef<P> & RefAttributes<E>>`

### createLayerComponent[](https://react-leaflet.js.org/docs/start-introduction/#createlayercomponent "Direct link to createLayerComponent")

**Type parameters**

1.  `E extends Layer`: Leaflet's element class type
2.  `P extends EventedWithChildrenProps`: the component's props

**Arguments**

1.  `createElement: (props: P, context: LeafletContextInterface) => LeafletElement<E>`
2.  `updateElement?: (instance: E, props: P, prevProps: P) => void`

**Returns** `ForwardRefExoticComponent<PropsWithoutRef<P> & RefAttributes<E>>`

### createOverlayComponent[](https://react-leaflet.js.org/docs/start-introduction/#createoverlaycomponent "Direct link to createOverlayComponent")

**Type parameters**

1.  `E extends DivOverlay`: Leaflet's element class type
2.  `P extends EventedWithChildrenProps`: the component's props

**Arguments**

1.  `createElement: (props: P, context: LeafletContextInterface) => LeafletElement<E>`
2.  `useLifecycle: DivOverlayLifecycleHook<E, P>`

**Returns** `ForwardRefExoticComponent<PropsWithoutRef<P> & RefAttributes<E>>`

### createPathComponent[](https://react-leaflet.js.org/docs/start-introduction/#createpathcomponent "Direct link to createPathComponent")

**Type parameters**

1.  `E extends FeatureGroup | Path`: Leaflet's element class type
2.  `P extends PathWithChildrenProps`: the component's props

**Arguments**

1.  `createElement: (props: P, context: LeafletContextInterface) => LeafletElement<E>`
2.  `updateElement?: (instance: E, props: P, prevProps: P) => void`

**Returns** `ForwardRefExoticComponent<PropsWithoutRef<P> & RefAttributes<E>>`

### createTileLayerComponent[](https://react-leaflet.js.org/docs/start-introduction/#createtilelayercomponent "Direct link to createTileLayerComponent")

**Type parameters**

1.  `E extends Layer`: Leaflet's element class type
2.  `P extends EventedProps`: the component's props

**Arguments**

1.  `createElement: (props: P, context: LeafletContextInterface) => LeafletElement<E>`
2.  `updateElement?: (instance: E, props: P, prevProps: P) => void`

**Returns** `ForwardRefExoticComponent<PropsWithoutRef<P> & RefAttributes<E>>`