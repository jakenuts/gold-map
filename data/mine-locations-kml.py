import requests
from xml.etree import ElementTree as ET
import simplekml
from datetime import datetime

def get_mine_points(bbox=(-124.5, 40.0, -122.3, 41.5)):
    """
    Get mine points from USGS WFS service for a specific bounding box.
    
    Args:
        bbox: (west, south, east, north) coordinates
    Returns:
        List of dictionaries containing point data
    """
    base_url = "https://mrdata.usgs.gov/services/wfs/usmin"
    
    # WFS 1.1.0 GetFeature request parameters
    params = {
        "service": "WFS",
        "version": "1.1.0",
        "request": "GetFeature",
        "typename": "points",
        "srsName": "EPSG:4326",
        "bbox": f"{bbox[1]},{bbox[0]},{bbox[3]},{bbox[2]},EPSG:4326"
    }
    
    response = requests.get(base_url, params=params)
    
    if response.status_code != 200:
        raise Exception(f"Failed to get data: {response.status_code}")
    
    # Parse the GML response
    root = ET.fromstring(response.content)
    
    # Define namespace dictionary for XML parsing
    ns = {
        'gml': 'http://www.opengis.net/gml',
        'usmin': 'http://mrdata.usgs.gov/usmin'
    }
    
    points = []
    
    # Extract point features
    for feature in root.findall('.//usmin:points', ns):
        try:
            # Extract coordinates from GML point
            pos = feature.find('.//gml:pos', ns)
            if pos is not None:
                lat, lon = map(float, pos.text.split())
                
                # Get feature properties
                props = {
                    'name': feature.find('.//usmin:name', ns).text if feature.find('.//usmin:name', ns) is not None else 'Unknown',
                    'type': feature.find('.//usmin:type', ns).text if feature.find('.//usmin:type', ns) is not None else 'Unknown',
                    'state': feature.find('.//usmin:state', ns).text if feature.find('.//usmin:state', ns) is not None else 'CA'
                }
                
                points.append({
                    'lat': lat,
                    'lon': lon,
                    'properties': props
                })
        except Exception as e:
            print(f"Error processing feature: {e}")
            continue
    
    return points

def create_kml(points, output_file="norcal_mines.kml"):
    """
    Create a KML file from mine point data.
    
    Args:
        points: List of dictionaries containing point data
        output_file: Name of output KML file
    """
    kml = simplekml.Kml()
    
    # Create a folder for all points
    folder = kml.newfolder(name="Northern California Mines")
    
    # Add each point to the KML
    for point in points:
        pnt = folder.newpoint(
            name=point['properties']['name'],
            description=f"Type: {point['properties']['type']}\nState: {point['properties']['state']}"
        )
        pnt.coords = [(point['lon'], point['lat'])]  # KML uses (lon, lat) order
        
        # Style the point
        pnt.style.iconstyle.icon.href = 'http://maps.google.com/mapfiles/kml/shapes/mining.png'
        pnt.style.iconstyle.scale = 1.0
    
    # Save the KML file
    kml.save(output_file)

def main():
    """
    Main function to get mine data and create KML file.
    """
    print("Fetching mine location data for Northern California...")
    
    try:
        # Get points for Northern California coastal region
        points = get_mine_points()
        
        if not points:
            print("No points found in the specified region.")
            return
        
        # Create KML file
        output_file = f"norcal_mines_{datetime.now().strftime('%Y%m%d')}.kml"
        create_kml(points, output_file)
        
        print(f"Successfully created KML file: {output_file}")
        print(f"Total points processed: {len(points)}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
