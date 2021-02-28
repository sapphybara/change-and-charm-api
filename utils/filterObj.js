// filter an object to only contain values specified
module.exports = (obj, ...allowedFields) => {
  const restrictedObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      restrictedObj[el] = obj[el];
    }
  });
  return restrictedObj;
};
