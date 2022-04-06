// this script transform and map data
const extractFromCenter = require("./extract");
const fs = require("fs");

function transform(path, engines, extracted) {
  const data = extracted || extractFromCenter(path);
  if (data && Array.isArray(data)) {
    console.log(`begin transforming ${data.length} items ... `);
    const initial = { ...engines };
    Object.keys(initial).forEach((engine) => (initial[engine] = []));
    const transformed = TransformData(engines, data).reduce((prev, current) => {
      for (var engine in initial) {
        prev[engine] = prev[engine].concat(current[engine]);
      }
      return prev;
    }, initial);
    // for (var engine in initial)
    //   fs.writeFileSync(
    //     `${engine}.output.json`,
    //     JSON.stringify(transformed[engine])
    //   );
    console.log("transformation process is completed.");
    return transformed;
  } else {
    console.log("No data to be transformed.");
  }
}

function TransformData(engines, data) {
  // map and transform attributes
  return data.map((item, itemIndex) => {
    const processedEngines = { ...engines };
    for (var engine in processedEngines) {
      if (
        !processedEngines[engine].entities &&
        !Array.isArray(processedEngines[engine].entities)
      )
        throw Error(`Can't find ${engine} engine entities in the schema`);
      const loadedEntities = [];
      processedEngines[engine].entities.forEach((entity) => {
        let entityData = { ...entity };
        entityData = getEntityValues(entityData, item, itemIndex);
        entityData && loadedEntities.push(entityData);
      });
      processedEngines[engine] = loadedEntities;
    }

    // console.log(`processed entities: `, processedEngines);
    return processedEngines;
  });
}

function transformEntity(entity, index) {
  // transform entity and its attributes
  if (!entity.name) throw Error("Error in schema");
  if (!entity.transformations) {
    return;
  }
  Object.keys(entity.transformations).forEach((key) => {
    if (!entity.transformations[key].transform)
      throw Error(
        `item[${index}]: Couldn't find transform method for ${key} key`
      );

    try {
      entity[key] = entity.transformations[key].transform(entity);
    } catch (error) {
      console.log(
        `item[${index}]: error while transforming ${key} attribute, check the transform method`
      );
      return;
    }
  });
  delete entity.transformations; // delete transformation
  return entity;
}

function getEntityValues(entity, data, dataIndex) {
  if (!entity.name) throw Error("Error in schema");
  if (!entity.attributes)
    throw Error(
      `Couldn't find the 'attributes' property of entity '${entity.name}', please check your schema .`
    );
  // entity without this attribute should be skipped
  if (entity.skipIfNotExist && Array.isArray(entity.skipIfNotExist)) {
    if (
      entity.skipIfNotExist.length ===
      entity.skipIfNotExist.filter((it) => !data[it]).length
    ) {
      entity.skipIfNotExist; // delete this attribute no need for
      return null;
    }
  }
  // process each attributes
  Object.keys(entity.attributes).forEach((attribute) => {
    if (entity.attributes[attribute].required && !data[attribute])
      throw Error(
        `item [${dataIndex}]: the required attribute ${attribute} can't be found in data`
      );

    if (data[attribute]) {
      const attributeName = entity.attributes[attribute].mapTo || attribute;
      if (entity.attributes[attribute].map) {
        try {
          // due to appSearch doesn't accept field with Uppercase characters
          entity[attributeName.toLowerCase()] = entity.attributes[
            attribute
          ].map(data[attribute]);
        } catch (error) {
          console.error(
            `item [${dataIndex}]: can't transform attribute ${attributeName} due to:`,
            error
          );
        }
      }
      // due to appSearch doesn't accept field with Uppercase characters
      else entity[attributeName.toLowerCase()] = data[attribute];
    }
  });

  entity = transformEntity(entity, dataIndex);
  delete entity.attributes; // delete attributes
  delete entity.skipIfNotExist; // delete skipIfNotExist
  delete entity.name;
  return entity;
}

module.exports = transform;
