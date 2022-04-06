// this script Extract SNDE data from local file
const __path = require("path");
const fs = require("fs");

module.exports = function extract(path) {
  const localStorage =
    path ||
    __path.join(__dirname, "..", "snde-data", `center-${91}`, "data.json");
  if (fs.existsSync(localStorage)) {
    console.log("getting data from this location: ", localStorage);
    const data = fs.readFileSync(localStorage);
    console.log("data successfully extracted.");
    return JSON.parse(data);
  } else {
    console.error(`can't load data from this location: ${localStorage}`);
  }
};
