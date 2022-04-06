## Simple ETL for extracting, transforming and loading data into engines

(for Now only dynamodb and appSearch engines are supported.)

## How it work ?

- use a schema Object to define the way your data should be mapped, transformed (see example below)
- once you define your schema pass it the Etl : `const ETL = new Etl(schema)`

- after that you could use one of the ETL methods : `extract`, `transform` or `load`

- call the `initiate` method to initiate the whole ETL process

## Schema Example :

// shape of data that should be submitted

```javascript
const entity1 = {
  name: "entity1",
  attributes: { // define your attributes from the data source attributes
    attribute1: {
      mapTo: "AttRibute1", // here you can change the name of the attribute
      required: true, // if this attribute isn't present stop the mapping
    },
    attribute2: {
      // omit the mapTo property to use the same attribute name as described in your data source.
      map: (value) => value.split(';')[0], // if you need some logic for mapping an attribute use the map method
    },
   ....
   ....
  },
  transformations: { // if you want to add no existing attributes to your data use the transformation block
    newAttribute1: {
      transform: (item) => item.attribute1 + item.attribute2,
    },
    ....
    ....
  },
  skipIfNotExist: ["attribute3", "attribute4"], // skip this entity if those attributes aren't exist in the data source
};

// you can define as many entities as you want
const entity2 = {
  ....
  ....
  },
};


// after defining your entities
// define your engines (Now we support only dynamodb and appSearch, we welcome you to be a collaborator)

const engines = {
  dynamodb: { // define dynamodb entities and configuration
    entities: [entity1, entity2], // entities
    config: {
      tableName: "table",// name of the table , Note: your table should be already created
      config: { // actual configuration
        region: "eu-west-3", // AWS region
        accessKeyId: "accessKeyId", // accessKeyId
        secretAccessKey: "secretAccessKey", // secretAccessKey
        // endpoint: "http://localhost:8000" // use this attribute if you're working locally
      },
    },
  },

  appSearch: {
    entities: [entity1],
    config: {
      baseUrl:
        "your-base-url/api/as/v1/",
      apiKey: "private-key", // private key
      engineName: "engine1", // name of your engine
    },
  },
};
```


## Notes:

if you want to add other custom engines feel free to collaborate to our/your library.
