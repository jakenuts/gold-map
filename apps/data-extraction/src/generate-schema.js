import { writeFileSync } from 'fs';

// Define the JSON schema for modern data representation
const schema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "USGS Mineral Resources Data System",
  "type": "object",
  "definitions": {
    "measurement": {
      "type": "object",
      "properties": {
        "value": { "type": "number" },
        "units": { "type": "string" }
      },
      "required": ["value", "units"]
    },
    "temporalRecord": {
      "type": "object",
      "properties": {
        "year": { "type": "string" },
        "modifier": { "type": "string" }
      }
    }
  },
  "properties": {
    "id": { "type": "string" },
    "name": { "type": "string" },
    "alternativeNames": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "status": { "type": "string" }
        }
      }
    },
    "location": {
      "type": "object",
      "properties": {
        "coordinates": {
          "type": "object",
          "properties": {
            "latitude": { "type": "number" },
            "longitude": { "type": "number" },
            "datum": { "type": "string" },
            "precision": { "type": "string" }
          }
        },
        "administrative": {
          "type": "object",
          "properties": {
            "country": { "type": "string" },
            "state": { "type": "string" },
            "county": { "type": "string" },
            "district": { "type": "string" }
          }
        },
        "physiography": {
          "type": "object",
          "properties": {
            "division": { "type": "string" },
            "province": { "type": "string" },
            "section": { "type": "string" }
          }
        },
        "plssCoordinates": {
          "type": "object",
          "properties": {
            "meridian": { "type": "string" },
            "township": { "type": "string" },
            "range": { "type": "string" },
            "section": { "type": "string" }
          }
        }
      }
    },
    "deposit": {
      "type": "object",
      "properties": {
        "type": { "type": "string" },
        "status": { "type": "string" },
        "discoveryYear": { "$ref": "#/definitions/temporalRecord" },
        "productionYears": { "type": "string" },
        "size": { "type": "string" },
        "model": {
          "type": "object",
          "properties": {
            "name": { "type": "string" },
            "code": { "type": "string" },
            "usgsNumber": { "type": "string" }
          }
        }
      }
    },
    "geology": {
      "type": "object",
      "properties": {
        "rocks": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": { "type": "string" },
              "type": { "type": "string" },
              "role": { "type": "string" },
              "description": { "type": "string" }
            }
          }
        },
        "ages": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "type": { "type": "string" },
              "age": { "type": "number" },
              "uncertainty": { "type": "number" },
              "method": { "type": "string" }
            }
          }
        },
        "structure": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "type": { "type": "string" },
              "description": { "type": "string" }
            }
          }
        },
        "alteration": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "type": { "type": "string" },
              "description": { "type": "string" }
            }
          }
        }
      }
    },
    "orebody": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "form": { "type": "string" },
          "dimensions": {
            "type": "object",
            "properties": {
              "area": { "$ref": "#/definitions/measurement" },
              "length": { "$ref": "#/definitions/measurement" },
              "width": { "$ref": "#/definitions/measurement" },
              "depth": {
                "type": "object",
                "properties": {
                  "top": { "$ref": "#/definitions/measurement" },
                  "bottom": { "$ref": "#/definitions/measurement" }
                }
              }
            }
          }
        }
      }
    },
    "commodities": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "code": { "type": "string" },
          "type": { "type": "string" },
          "group": { "type": "string" },
          "importance": { "type": "string" }
        }
      }
    },
    "production": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "year": { "type": "string" },
          "amount": { "$ref": "#/definitions/measurement" },
          "material": { "type": "string" },
          "details": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "commodity": { "type": "string" },
                "recovery": { "$ref": "#/definitions/measurement" },
                "grade": { "$ref": "#/definitions/measurement" }
              }
            }
          }
        }
      }
    },
    "resources": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "year": { "type": "string" },
          "type": { "type": "string" },
          "amount": { "$ref": "#/definitions/measurement" },
          "details": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "commodity": { "type": "string" },
                "grade": { "$ref": "#/definitions/measurement" }
              }
            }
          }
        }
      }
    },
    "workings": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": { "type": "string" },
          "name": { "type": "string" },
          "dimensions": {
            "type": "object",
            "properties": {
              "area": { "$ref": "#/definitions/measurement" },
              "length": { "$ref": "#/definitions/measurement" },
              "width": { "$ref": "#/definitions/measurement" },
              "depth": { "$ref": "#/definitions/measurement" }
            }
          }
        }
      }
    },
    "ownership": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "owner": { "type": "string" },
          "type": { "type": "string" },
          "percentage": { "type": "number" },
          "period": {
            "type": "object",
            "properties": {
              "start": { "type": "string" },
              "end": { "type": "string" }
            }
          }
        }
      }
    },
    "references": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "database": { "type": "string" },
          "recordId": { "type": "string" },
          "agency": { "type": "string" }
        }
      }
    },
    "metadata": {
      "type": "object",
      "properties": {
        "reporters": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": { "type": "string" },
              "type": { "type": "string" },
              "date": { "type": "string" },
              "affiliation": { "type": "string" }
            }
          }
        },
        "lastUpdated": { "type": "string" },
        "comments": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "category": { "type": "string" },
              "text": { "type": "string" }
            }
          }
        }
      }
    }
  },
  "required": ["id", "name", "location", "deposit"]
};

// Write the schema to a file
writeFileSync('schema.json', JSON.stringify(schema, null, 2));

console.log('Generated modern JSON schema for USGS MRDS data');
