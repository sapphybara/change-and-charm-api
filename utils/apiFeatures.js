const EXCLUDED_FIELDS = ['page', 'sort', 'limit', 'fields'];

// class to implement the features of our API
class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = this.queryString;
    const queryShallowCopy = { ...queryObj };
    EXCLUDED_FIELDS.forEach((element) => delete queryShallowCopy[element]);

    let queryString = JSON.stringify(queryShallowCopy);
    // replace operators with their mongo commands
    queryString = queryString.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`
    );

    // build query
    this.query = this.query.find(JSON.parse(queryString));
    return this;
  }

  sort() {
    const sorter = this.queryString.sort;
    if (sorter) {
      const sortBy = sorter.split(',');
      this.query = this.query.sort(sortBy.join(' '));
    } else {
      // default is to sort first newest to oldest, then by price
      this.query = this.query.sort('-createdOn -price');
    }
    return this;
  }

  limitFields() {
    const selectedFields = this.queryString.fields;
    if (selectedFields) {
      const fields = selectedFields.split(',');
      this.query = this.query.select(fields.join(' '));
    } else {
      // remove mongoose variable by default
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
