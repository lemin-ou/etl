const AppSearchClient = require("@elastic/app-search-node");
const AWS = require("aws-sdk");
require("dotenv").config(); // parse env variables

const registeredEngines = {
  appSearch: {
    load: loadIntoES,
  },
  dynamodb: {
    load: loadIntoDynamodb,
  },
};

async function load(engines, data) {
  console.log("begin loading data ....");
  for (const engine in engines) {
    if (Object.hasOwnProperty.call(registeredEngines, engine)) {
      const engineData = data[engine];
      if (engineData && engineData.length) {
        if (Object.hasOwnProperty.call(engines[engine], "config")) {
          try {
            await registeredEngines[engine].load(
              engines[engine].config,
              engineData
            );
          } catch (error) {
            console.log(
              `Error while loading data into ${engine} engine:`,
              error
            );
          }
        } else throw Error(`Can't find configuration for ${engine} engine`);
      }
    } else throw Error(`${engine} engine isn't supported yet`);
  }
  console.log("loading process is completed");
}

const checkAttribute = (att) => att && Boolean(att.length); // check structure of an attribute

async function loadIntoES(config, data) {
  const length = data.length;
  console.debug(`initiate loading ${length} items into appSearch`, config);
  if (
    !checkAttribute(config.engineName) &&
    !checkAttribute(config.baseUrl) &&
    !checkAttribute(config.apiKey)
  )
    throw Error(
      "Can't proceed with loading until {engineName, baseUrl, apiKey} attributes are provided"
    );
  const client = new AppSearchClient(
    undefined,
    config.apiKey,
    () => config.baseUrl
  );
  return new Promise(async (resolve) => {
    let chunk = 0;
    const size = 100;
    while (chunk <= length) {
      const copy = [...data];
      let slice = copy.splice(chunk, size);
      const result = await client.indexDocuments(config.engineName, slice);
      console.debug(
        `${result.length} has been indexed from [${chunk}, ${chunk + size}]`,
        result
      );
      chunk += size;
    }
    resolve([]);
  });
}

async function loadIntoDynamodb(config, data) {
  const getClient = () => {
    AWS.config.update(config.config);
    return new AWS.DynamoDB.DocumentClient();
  };
  const getInstance = () => {
    AWS.config.update(config.config);
    return new AWS.DynamoDB();
  };
  // let createTable = void 0;
  // try {
  //   createTable = require("./dynamodb_create_table");
  // } catch (error) {
  //   console.error(
  //     "couldn't load the file responsible of creating your table {fileName : dynamodb_create_table.js }, please check the documentation",
  //     error
  //   );
  //   return;
  // }

  // await createTable(config.tableName, getInstance());

  const SLICE_SIZE = 25;
  let requests = Math.floor(data.length / SLICE_SIZE);
  console.log("begin inserting data into dynamodb ....");

  // data = data.splice(data.length - 41381);
  console.log("items to proceed: ", data.length);
  while (data.length) {
    const slice = data.splice(0, SLICE_SIZE);
    const requestItems = {};
    requestItems[config.tableName] = slice.map((Item) => ({
      PutRequest: {
        Item,
      },
    }));

    const params = {
      RequestItems: requestItems,
      ReturnConsumedCapacity: "TOTAL", // return consumed capacity
    };
    await getClient()
      .batchWrite(params, (err, res) => {
        if (err) {
          throw Error(err);
        } else {
          console.log(`request made successfully, result: `, res);
          console.log(`${data.length} items left `);
        }
      })
      .promise();
  }
}

module.exports = load;
