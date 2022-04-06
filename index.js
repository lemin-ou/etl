const extractData = require("./extract");
const transformData = require("./transform");
const loadData = require("./load");

class Etl {
  #schema = null;
  constructor(schema) {
    this.#checkSchema(schema);
  }

  // * initialize an ETL process
  initialize(path) {
    const data = this.extract(path);
    const transformed = this.transform(data);
    const response = this.load(transformed);
    return response;
  }
  #checkSchema(schema) {
    if (schema) {
      this.#schema = schema;
    } else throw Error("can't find the schema");
  }

  extract(path) {
    return extractData(path);
  }

  transform(data) {
    return transformData(null, this.#schema, data);
  }

  async load(data) {
    await loadData(this.#schema, data);
    return "successfully loaded";
  }
}

module.exports = Etl;
