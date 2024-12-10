Presentation
ogc-client is a pure Javascript library made for interacting with geospatial web services relying on standard protocols, namely OGC standards.

Its purpose is to helps you interact with them in a user-friendly and consistent way.

Its main features include:

Support for WFS, WMS, WMTS and OGC API protocols
Elaborate cache system to minimize network requests
Fast parsing of XML documents using @rgrove/parse-xml
Detection of CORS-related issues
Usage
First, install ogc-client in your project:

$ npm install --save @camptocamp/ogc-client

Then, use it like so:

import { WfsEndpoint } from '@camptocamp/ogc-client';

new WfsEndpoint("https://my.server.org/ows")
  .isReady()
  .then(
    (endpoint) => console.log(endpoint.getFeatureTypes())
  )
    

Please refer to the API section for more details on how to use each functionality.

A note on text encoding
Even though UTF-8 is the most common text encoding in the web, some services might respond with other encodings such as UTF-16, ISO-8859-1, etc.

ogc-client will attempt to decode the responses using the information at its disposal, and in most case decoding should succeed. It may happen though that some unrecognized characters will remain; please open an issue if that is the case!

Why use it?
Many libraries are able to leverage OGC protocols for various specialized tasks, for instance downloading data or rendering maps. Often times though, the application code has the responsibility to specify the version to use, the coordinate system, the bounding box to query, etc.

ogc-client intends to assist applications in discovering OGC services and what they offer, without having to manually write code for parsing GetCapabilities documents for example.

When an network error is encountered, ogc-client will do an additional check to determine whether this is due to CORS limitations. This will help the application code in giving an appropriate feedback to the user, i.e. that the targeted resource is indeed reachable but does not allow cross-origin usage.

ogc-client also keeps a cache of all operations using the Cache API, thus offering almost limitless storage while also purging expired cache entries regularly. By default, all cache entries are kept for one hour.

What ogc-client currently does not do:

No GML geometry parsing: the OpenLayers GML parser offers extensive support of the GML format
Examples
Read a WMS layer extent
import { WmsEndpoint } from '@camptocamp/ogc-client';

async function readExtent() {
  const endpoint = await new WmsEndpoint('https://my.server.org/ows').isReady();
  const layer = endpoint.getLayerByName();
  const extent = layer.boundingBoxes['EPSG:4326'];
}

Compute a WFS GetFeature url
import { WfsEndpoint } from '@camptocamp/ogc-client';

async function getFeatureUrl() {
  const endpoint = await new WfsEndpoint('https://my.server.org/ows').isReady();
  const url = endpoint.getFeatureUrl('my:featureType', {
    asJson: true,
    maxFeatures: 1000
  });
}

Query the first 10 items of an OGC API Records collection
import { OgcApiEndpoint } from '@camptocamp/ogc-client';

async function getFirstTenRecords() {
  const endpoint = new OgcApiEndpoint('https://my.server.org/main');
  const firstCollection = (await endpoint.recordCollections)[0];
  return endpoint.getCollectionItems(firstCollection, 10, 0);
}

Add a WMTS layer to an OpenLayers map
import TileLayer from 'ol/layer/Tile';
import WMTS from 'ol/source/WMTS';
import { transformExtent } from 'ol/proj';
import { WmtsEndpoint } from '@camptocamp/ogc-client';

// create the OpenLayers map
// ...

async function addWmtsLayer() {
  const endpoint = await new WmtsEndpoint('https://my.server.org/wmts').isReady();
  const layer = endpoint.getLayers()[0];
  const matrixSet = layer.matrixSets[0];
  const tileGrid = await endpoint.getOpenLayersTileGrid(
    layer.name,
    matrixSet.identifier
  );
  const resourceLink = layer.resourceLinks[0];
  const dimensions = endpoint.getDefaultDimensions(layer.name);
  const layer = new TileLayer({
    source: new WMTS({
      layer: layer.name,
      style: layer.defaultStyle,
      matrixSet: matrixSet.identifier,
      format: resourceLink.format,
      url: resourceLink.url,
      requestEncoding: resourceLink.encoding,
      tileGrid,
      projection: matrixSet.crs,
      dimensions,
    }),
    // this will limit the rendering to the actual range where data is available
    maxResolution: tileGrid.getResolutions()[0],
    extent: transformExtent(
      layer.latLonBoundingBox,
      'EPSG:4326',
      openLayersMap.getView().getProjection()
    );
  });
  openLayersMap.addLayer(layer);
}

API

class
EndpointError
import { EndpointError } from '@camptocamp/ogc-client';
📦 constructor
new EndpointError(message: string, httpStatus: number, isCrossOriginRelated: boolean)
⚡ method
captureStackTrace(targetObject: object, constructorOpt: Function)
🌱️ returns
void
Create .stack property on a target object

#
class
OgcApiEndpoint
import { OgcApiEndpoint } from '@camptocamp/ogc-client';
📦 constructor
new OgcApiEndpoint(baseUrl: string)
Creates a new OGC API endpoint.

   property
allCollections: Promise<undefined[]>
A Promise which resolves to an array of all collection identifiers as strings.

   property
conformanceClasses: Promise<string[]>
A Promise which resolves to an array of conformance classes.

   property
featureCollections: Promise<string[]>
A Promise which resolves to an array of feature collection identifiers as strings.

   property
hasFeatures: Promise<boolean>
A Promise which resolves to a boolean indicating whether the endpoint offer feature collections.

   property
hasRecords: Promise<boolean>
A Promise which resolves to a boolean indicating whether the endpoint offer record collections.

   property
hasStyles: Promise<boolean>
A Promise which resolves to a boolean indicating whether the endpoint offer styles.

   property
hasTiles: Promise<boolean>
A Promise which resolves to a boolean indicating whether the endpoint offer tiles.

   property
info: Promise<OgcApiEndpointInfo>
A Promise which resolves to the endpoint information.

   property
mapTileCollections: Promise<string[]>
A Promise which resolves to an array of map tile collection identifiers as strings.

   property
recordCollections: Promise<string[]>
A Promise which resolves to an array of records collection identifiers as strings.

   property
tileMatrixSets: Promise<string[]>
Retrieve the tile matrix sets identifiers advertised by the endpoint. Empty if tiles are not supported

   property
vectorTileCollections: Promise<string[]>
A Promise which resolves to an array of vector tile collection identifiers as strings.

⚡ method
allStyles(collectionId: string)
🌱️ returns
Promise<OgcStyleBrief[]>
A Promise which resolves to an array of all style items. This includes the supported style formats.

⚡ method
getCollectionInfo(collectionId: string)
🌱️ returns
Promise<OgcApiCollectionInfo>
Returns a promise resolving to a document describing the specified collection.

⚡ method
getCollectionItem(collectionId: string, itemId: string)
🌱️ returns
Promise<OgcApiRecord>
Returns a promise resolving to a specific item from a collection.

⚡ method
getCollectionItems(collectionId: string, limit: number, offset: number, skipGeometry: boolean, sortby: string[], bbox: [number, number, number, number], properties: string[])
🌱️ returns
Promise<OgcApiRecord[]>
Returns a promise resolving to an array of items from a collection with the given query parameters.

⚡ method
getCollectionItemsUrl(collectionId: string, options: undefined)
🌱️ returns
Promise<string>
Asynchronously retrieves a URL for the items of a specified collection, with optional query parameters.

⚡ method
getMapTilesetUrl(collectionId: string, tileMatrixSet: string)
🌱️ returns
Promise<string>
Asynchronously retrieves a URL to render a specified collection as map tiles, with a given tile matrix set.

⚡ method
getStyle(styleId: string, collectionId: string)
🌱️ returns
Promise<OgcStyleFull | OgcStyleBrief>
Returns a promise resolving to a document describing the style. Looks for a relation of type "describedby" to fetch metadata. If no relation is found, only basic info will be returned.

⚡ method
getStylesheetUrl(styleId: string, mimeType: string, collectionId: string)
🌱️ returns
Promise<string>
Returns a promise resolving to a stylesheet URL for a given style and type.

⚡ method
getVectorTilesetUrl(collectionId: string, tileMatrixSet: string)
🌱️ returns
Promise<string>
Asynchronously retrieves a URL to render a specified collection as vector tiles, with a given tile matrix set.

Represents an OGC API endpoint advertising various collections and services.

#
class
ServiceExceptionError
import { ServiceExceptionError } from '@camptocamp/ogc-client';
📦 constructor
new ServiceExceptionError(message: string, requestUrl: string, code: string, locator: string, response: XmlDocument)
Constructor

⚡ method
captureStackTrace(targetObject: object, constructorOpt: Function)
🌱️ returns
void
Create .stack property on a target object

Representation of an Exception reported by an OWS service

This is usually contained in a ServiceExceptionReport or ExceptionReport document and represented as a ServiceException or Exception element

#
class
WfsEndpoint
import { WfsEndpoint } from '@camptocamp/ogc-client';
📦 constructor
new WfsEndpoint(url: string)
Creates a new WFS endpoint; wait for the isReady() promise before using the endpoint methods.

⚡ method
getCapabilitiesUrl()
🌱️ returns
string
Returns the Capabilities URL of the WMS

This is the URL reported by the service if available, otherwise the URL passed to the constructor

⚡ method
getFeatureTypeFull(name: string)
🌱️ returns
Promise<WfsFeatureTypeFull>
Returns the complete feature type. If a namespace is specified in the name, this will be used for matching; otherwise, matching will be done without taking namespaces into account.

⚡ method
getFeatureTypePropDetails(name: string)
🌱️ returns
Promise<WfsFeatureTypePropsDetails>
Returns a promise that will resolve with details on each of the feature type properties; for now, this consists of a list of unique values in the whole dataset.

⚡ method
getFeatureTypeSummary(name: string)
🌱️ returns
WfsFeatureTypeSummary
Returns the feature type in summary format. If a namespace is specified in the name, this will be used for matching; otherwise, matching will be done without taking namespaces into account.

⚡ method
getFeatureTypes()
🌱️ returns
WfsFeatureTypeBrief[]
Returns an array of feature types

⚡ method
getFeatureUrl(featureType: string, options: WfsGetFeatureOptions)
🌱️ returns
string
Returns a URL that can be used to query features from this feature type.

⚡ method
getOperationUrl(operationName: string, method: HttpMethod)
🌱️ returns
string
Returns the URL reported by the WFS for the given operation

⚡ method
getServiceInfo()
🌱️ returns
GenericEndpointInfo
A Promise which resolves to the endpoint information.

⚡ method
getSingleFeatureTypeName()
🌱️ returns
string
If only one single feature type is available, return its name; otherwise, returns null;

⚡ method
getVersion()
🌱️ returns
WfsVersion
Returns the highest protocol version that this WFS endpoint supports. Note that if the url used for initialization does specify a version (e.g. 1.0.0), this version will most likely be used instead of the highest supported one.

⚡ method
isReady()
🌱️ returns
Promise<WfsEndpoint>
Resolves when the endpoint is ready to use. Returns the same endpoint object for convenience.

⚡ method
supportsJson(featureType: string)
🌱️ returns
boolean
Returns true if the given feature type can be downloaded as GeoJSON

⚡ method
supportsStartIndex()
🌱️ returns
boolean
Returns true if the WFS service supports the startIndex parameter.

Represents a WFS endpoint advertising several feature types

#
class
WmsEndpoint
import { WmsEndpoint } from '@camptocamp/ogc-client';
📦 constructor
new WmsEndpoint(url: string)
⚡ method
getCapabilitiesUrl()
🌱️ returns
string
Returns the Capabilities URL of the WMS

This is the URL reported by the service if available, otherwise the URL passed to the constructor

⚡ method
getLayerByName(name: string)
🌱️ returns
WmsLayerFull
Returns the full layer information, including supported coordinate systems, available layers, bounding boxes etc. Layer name is case-sensitive.

⚡ method
getLayers()
🌱️ returns
WmsLayerSummary[]
Returns an array of layers in summary format; layers are organized in a tree structure with each having an optional children property

⚡ method
getMapUrl(layers: string[], options: undefined)
🌱️ returns
string
Returns a URL that can be used to query an image from one or several layers

⚡ method
getOperationUrl(operationName: string, method: HttpMethod)
🌱️ returns
string
Returns the URL reported by the WMS for the given operation

⚡ method
getServiceInfo()
🌱️ returns
GenericEndpointInfo
Returns the service information.

⚡ method
getSingleLayerName()
🌱️ returns
string
If only one single renderable layer is available, return its name; otherwise, returns null;

⚡ method
getVersion()
🌱️ returns
WmsVersion
Returns the highest protocol version that this WMS endpoint supports. Note that if the url used for initialization does specify a version (e.g. 1.1.0), this version will most likely be used instead of the highest supported one.

⚡ method
isReady()
🌱️ returns
Promise<WmsEndpoint>
Resolves when the endpoint is ready to use. Returns the same endpoint object for convenience.

Represents a WMS endpoint advertising several layers arranged in a tree structure.

#
class
WmtsEndpoint
import { WmtsEndpoint } from '@camptocamp/ogc-client';
📦 constructor
new WmtsEndpoint(url: string)
Creates a new WMTS endpoint; wait for the isReady() promise before using the endpoint methods.

⚡ method
getDefaultDimensions(layerName: string)
🌱️ returns
Record<string, string>
Return an object with all defined dimensions for the layer, as well as their default values.

⚡ method
getLayerByName(name: string)
🌱️ returns
WmtsLayer
Returns a complete layer based on its name Note: the first matching layer will be returned

⚡ method
getLayerResourceLink(layerName: string, formatHint: string)
🌱️ returns
WmtsLayerResourceLink
Returns a layer resource link. If no type hint is specified, the first resource will be returned. A resource link contains a URL as well as an image format and a request encoding (KVP or REST).

⚡ method
getLayers()
🌱️ returns
WmtsLayer[]
Returns the layers advertised in the endpoint.

⚡ method
getMatrixSetByIdentifier(identifier: string)
🌱️ returns
WmtsMatrixSet
Returns a matrix set by identifier

⚡ method
getMatrixSets()
🌱️ returns
WmtsMatrixSet[]
Returns the matrix sets available for that endpoint. Each matrix set contains a list of tile matrices as well as a supported CRS.

⚡ method
getOpenLayersTileGrid(layerName: string, matrixSetIdentifier: string)
🌱️ returns
Promise<WMTSTileGrid>
Creates a WMTSTileGrid instance from the 'ol' package, for a given layer. Optionally, a matrix set can be provided;

⚡ method
getServiceInfo()
🌱️ returns
WmtsEndpointInfo
A Promise which resolves to the endpoint information.

⚡ method
getSingleLayerName()
🌱️ returns
string
If only one single layer is available, return its name; otherwise, returns null;

⚡ method
getTileUrl(layerName: string, styleName: string, matrixSetName: string, tileMatrix: string, tileRow: number, tileCol: number, outputFormat: string)
🌱️ returns
string
Generates a URL for a specific tile of a specific layer

⚡ method
isReady()
🌱️ returns
Promise<WmtsEndpoint>
Resolves when the endpoint is ready to use. Returns the same endpoint object for convenience.

Represents a WMTS endpoint advertising several layers.

#
function
check(response: XmlDocument, url: string)
import { check } from '@camptocamp/ogc-client';
🌱 returns
XmlDocument
Check the response for a ServiceExceptionReport and if present throw one

#
function
clearCache()
import { clearCache } from '@camptocamp/ogc-client';
🌱 returns
Promise<void>
Remove all cache entries; will not prevent the creation of new ones

#
function
enableFallbackWithoutWorker()
import { enableFallbackWithoutWorker } from '@camptocamp/ogc-client';
Call once to disable Worker usage completely

#
function
resetFetchOptions()
import { resetFetchOptions } from '@camptocamp/ogc-client';
Resets advanced fetch() options to their defaults

#
function
setFetchOptions(options: FetchOptions)
import { setFetchOptions } from '@camptocamp/ogc-client';
Set advanced options to be used by all fetch() calls

#
function
sharedFetch(url: string, method: 'GET' | 'HEAD', asJson: boolean)
import { sharedFetch } from '@camptocamp/ogc-client';
🌱 returns
Promise<any>
Returns a promise equivalent to fetch(url) but guarded against identical concurrent requests Note: this should only be used for GET requests!

#
function
useCache<T>(factory: () => T | Promise<T>, ...keys: string[])
import { useCache } from '@camptocamp/ogc-client';
🌱 returns
Promise<T>
This will skip a long/expensive task and use a cached value if available, otherwise the task will be run normally Note: outside of a browser's main thread, caching will never happen!

#
type
Address
   property
administrativeArea: string
   property
city: string
   property
country: string
   property
deliveryPoint: string
   property
postalCode: string
#
type
CollectionParameter
   property
name: string
   property
title: string
   property
type: 'string' | 'number' | 'linestring' | 'polygon' | 'point' | 'integer' | 'date' | 'geometry'
#
type
Contact
   property
address: Address
   property
email: string
   property
fax: string
   property
name: string
   property
organization: string
   property
phone: string
   property
position: string
#
type
FetchOptions
   property
credentials: 'same-origin' | 'include' | 'omit'
   property
headers: Record<string, string>
   property
integrity: string
   property
mode: 'same-origin' | 'cors' | 'no-cors'
   property
redirect: 'error' | 'follow'
   property
referrer: string
#
type
LayerStyle
   property
abstract: string
   property
legendUrl: string
May not be defined; a GetLegendGraphic operation should work in any case

   property
name: string
   property
title: string
#
type
OgcApiCollectionInfo
   property
bulkDownloadLinks: Record<string, string>
Map between formats and bulk download links (no filtering, pagination etc.)

   property
crs: string[]
   property
description: string
   property
extent: BoundingBox
   property
id: string
   property
itemCount: number
   property
itemFormats: string[]
These mime types are available through the /items endpoint; use the getCollectionItemsUrl function to generate a URL using one of those formats

   property
itemType: 'feature' | 'record'
   property
jsonDownloadLink: string
Link to the first bulk download link using JSON-FG or GeoJSON; null if no link found

   property
keywords: string[]
   property
language: string
Language is Iso 2-letter code (e.g. 'en')

   property
license: string
   property
links: any
   property
mapTileFormats: string[]
   property
publisher: undefined
   property
queryables: CollectionParameter[]
   property
sortables: CollectionParameter[]
   property
storageCrs: string
   property
supportedTileMatrixSets: string[]
   property
title: string
   property
updated: Date
   property
vectorTileFormats: string[]
Contains all necessary information about a collection of items

#
type
OgcApiDocumentLink
   property
href: string
   property
rel: string
   property
title: string
   property
type: string
#
type
OgcApiEndpointInfo
   property
attribution: string
   property
description: string
   property
title: string
#
type
OgcApiRecordContact
   property
contactInstructions: string
   property
links: OgcApiDocumentLink[]
   property
name: string
   property
roles: string[]
#
type
OgcApiRecordLanguage
   property
alternate: string
   property
code: string
   property
dir: 'ltr' | 'rtl' | 'ttb' | 'btt'
   property
name: string
#
type
OgcApiRecordProperties
   property
contacts: OgcApiRecordContact[]
   property
created: Date
   property
description: string
   property
externalIds: OgcApiItemExternalId[]
   property
formats: string[]
   property
keywords: string[]
   property
language: OgcApiRecordLanguage
   property
languages: OgcApiRecordLanguage[]
   property
license: string
   property
providers: string[]
   property
resourceLanguages: OgcApiRecordLanguage[]
   property
rights: string
   property
themes: OgcApiRecordTheme[]
   property
title: string
   property
type: string
   property
updated: Date
#
type
Provider
   property
contact: Contact
   property
name: string
   property
site: string
#
type
TileMatrixSet
   property
id: string
   property
uri: string
#
type
WmtsEndpointInfo
   property
abstract: string
   property
constraints: string
   property
exceptionFormats: string[]
Contains a list of formats that can be used for Exceptions for WMS GetMap, or undefined for other services such as WFS

   property
fees: string
   property
getTileUrls: undefined
   property
infoFormats: string[]
Contains a list of formats that can be used for WMS GetFeatureInfo, or undefined for other services such as WFS

   property
keywords: string[]
   property
name: string
   property
outputFormats: string[]
Can contain the list of outputFormats from a WFS GetCapabilities, or the list of 'Formats' from a WMS GetCapabilities

   property
provider: Provider
   property
title: string
#
type
WmtsLayer
   property
defaultStyle: string
   property
dimensions: LayerDimension[]
   property
latLonBoundingBox: BoundingBox
   property
matrixSets: MatrixSetLink[]
   property
name: string
   property
resourceLinks: WmtsLayerResourceLink[]
   property
styles: LayerStyle[]
#
type
WmtsLayerResourceLink
   property
encoding: WmtsRequestEncoding
   property
format: string
   property
url: string
#
type
WmtsMatrixSet
   property
boundingBox: BoundingBox
   property
crs: string
   property
identifier: string
   property
tileMatrices: TileMatrix[]
   property
wellKnownScaleSet: string
#
type
BoundingBox
[number, number, number, number]
Expressed as minx, miny, maxx, maxy

#
type
CollectionParameterType
[object Object][number]
#
type
ConformanceClass
string
#
type
CrsCode
string
#
type
FeatureGeometryType
'linestring' | 'polygon' | 'point' | 'multilinestring' | 'multipolygon' | 'multipoint' | 'unknown'
#
type
FeaturePropertyType
string | number | boolean
#
type
GenericEndpointInfo
   property
abstract: string
   property
constraints: string
   property
exceptionFormats: MimeType[] | string[]
Contains a list of formats that can be used for Exceptions for WMS GetMap, or undefined for other services such as WFS

   property
fees: string
   property
infoFormats: MimeType[]
Contains a list of formats that can be used for WMS GetFeatureInfo, or undefined for other services such as WFS

   property
keywords: string[]
   property
name: string
   property
outputFormats: MimeType[]
Can contain the list of outputFormats from a WFS GetCapabilities, or the list of 'Formats' from a WMS GetCapabilities

   property
provider: Provider
   property
title: string
#
type
MetadataURL
   property
format: string
   property
type: string
   property
url: string
#
type
MimeType
string
#
type
OgcApiCollectionItem
OgcApiRecord
#
type
OgcApiDocument
& Record<string, unknown>
#
type
OgcApiRecord
   property
conformsTo: string[]
   property
geometry: Geometry
   property
id: string
   property
links: OgcApiDocumentLink[]
   property
properties: OgcApiRecordProperties
   property
time: OgcApiTime
   property
type: string
#
type
OgcApiStyleMetadata
   property
created: string
   property
description: string
   property
id: string
   property
keywords: string[]
   property
layers: undefined[]
   property
license: string
   property
links: OgcApiDocumentLink[]
   property
pointOfContact: string
   property
scope: 'style'
   property
stylesheets: OgcApiStylesheet[]
   property
title: string
   property
updated: string
   property
version: string
#
type
OgcApiStyleRecord
   property
id: string
   property
title: string
#
type
OgcApiStylesDocument
   property
links: OgcApiDocumentLink[]
   property
styles: StyleItem[]
#
type
OgcApiStylesheet
   property
link: OgcApiDocumentLink
   property
native: boolean
   property
specification: string
   property
title: string
   property
version: string
#
type
OgcStyleBrief
   property
formats: string[]
   property
id: string
   property
title: string
#
type
OgcStyleFull
& OgcApiStyleMetadata
#
type
StyleItem
   property
formats: string[]
   property
id: string
   property
links: OgcApiDocumentLink[]
   property
title: string
#
type
WfsFeatureTypeBrief
   property
abstract: string
   property
boundingBox: BoundingBox
Expressed in latitudes and longitudes

   property
name: string
   property
title: string
#
type
WfsFeatureTypeFull
   property
abstract: string
   property
boundingBox: BoundingBox
Expressed in latitudes and longitudes

   property
defaultCrs: CrsCode
   property
geometryName: string
Not defined if no geometry present

   property
geometryType: FeatureGeometryType
Not defined if no geometry present

   property
keywords: string[]
   property
name: string
   property
objectCount: number
Not defined if object count could not be determined

   property
otherCrs: CrsCode[]
   property
outputFormats: MimeType[]
   property
properties: Record<string, FeaturePropertyType>
These properties will not include the feature geometry

   property
title: string
#
type
WfsFeatureTypePropDetails
   property
uniqueValues: WfsFeatureTypeUniqueValue[]
#
type
WfsFeatureTypePropsDetails
Record<string, WfsFeatureTypePropDetails>
#
type
WfsFeatureTypeSummary
   property
abstract: string
   property
boundingBox: BoundingBox
Expressed in latitudes and longitudes

   property
defaultCrs: CrsCode
   property
keywords: string[]
   property
metadata: MetadataURL[]
   property
name: string
   property
otherCrs: CrsCode[]
   property
outputFormats: MimeType[]
   property
title: string
#
type
WfsFeatureTypeUniqueValue
   property
count: number
   property
value: number | boolean | string
#
type
WfsFeatureWithProps
   property
id: string
Feature id

   property
properties: Record<string, FeaturePropertyType>
Feature properties

#
type
WfsGetFeatureOptions
   property
asJson: boolean
if true, will ask for GeoJSON; will throw if the service does not support it

   property
attributes: string[]
if not defined, all attributes will be included; note that the fact that these attributes exist or not will not be checked!

   property
extent: BoundingBox
an extent to restrict returned objects

   property
extentCrs: CrsCode
if unspecified, extent should be in the data native projection

   property
hitsOnly: boolean
if true, will not return feature data, only hit count note: this might not work for WFS version < 2

   property
maxFeatures: number
No limit if undefined

   property
outputCrs: CrsCode
if unspecified, this will be the data native projection

   property
outputFormat: MimeType
a supported output format (overridden by asJson)

   property
startIndex: number
if the service supports it, this will be the index of the first feature to return

#
type
WfsVersion
'1.0.0' | '1.1.0' | '2.0.0'
#
type
WmsLayerAttribution
   property
logoUrl: string
   property
title: string
   property
url: string
#
type
WmsLayerFull
   property
abstract: string
   property
attribution: WmsLayerAttribution
   property
availableCrs: CrsCode[]
   property
boundingBoxes: Record<CrsCode, BoundingBox>
Dict of bounding boxes where keys are CRS codes

   property
children: WmsLayerFull[]
Not defined if the layer is a leaf in the tree

   property
keywords: string[]
   property
maxScaleDenominator: number
   property
metadata: MetadataURL[]
   property
minScaleDenominator: number
   property
name: string
The layer is renderable if defined

   property
opaque: boolean
   property
queryable: boolean
   property
styles: LayerStyle[]
   property
title: string
#
type
WmsLayerSummary
   property
abstract: string
   property
children: WmsLayerSummary[]
Not defined if the layer is a leaf in the tree

   property
name: string
The layer is renderable if defined

   property
title: string
#
type
WmsVersion
'1.1.0' | '1.1.1' | '1.3.0'
#
type
WmtsLayerDimensionValue
string