class BaseRepository {
  model: any = undefined;
  constructor(mongooseModel: any) {
    this.model = mongooseModel;
  }
  public async findOne(query: any, options: any): Promise<any> {
    let option = { ...options };
    let populate = option.populate;
    delete option.populate;
    if (populate && populate !== undefined && populate !== "") {
      return this.model.findOne(query, option).populate(populate);
    } else {
      return this.model.findOne(query, option);
    }
  }
  public async find(query: any = {}, options: any): Promise<any> {
    let page = {
      items: [],
      total: 0,
      limit: options.limit || 0,
      page: options.page || 1,
      hasNext: false
    };
    if (query) {
      Object.keys(query).map(key => {
        if (typeof query[key] === "string") {
          query[key] = query[key].split(",");
        }
      });
    }

    if (
      this.model.paginate &&
      (options.page !== undefined && options.limit !== undefined)
    ) {
      if (options.page < 1) throw new Error("page start with 1");
      let result = null;
      if (
        options.populate &&
        options.populate !== undefined &&
        options.populate !== ""
      ) {
        result = await this.model.paginate(query, {
          limit: +options.limit,
          page: +options.page,
          sort: options.sort,
          populate: options.populate
        });
      } else {
        result = await this.model.paginate(query, {
          limit: +options.limit,
          page: +options.page,
          sort: options.sort
        });
      }
      page.items = result.docs;
      page.total = result.total;
      page.limit = result.limit;
      page.page = result.page;
      page.hasNext = result.page * result.limit < result.total;
      return page;
    } else {
      let result = null;
      if (
        options.populate &&
        options.populate !== undefined &&
        options.populate !== ""
      ) {
        result = await this.model.find(query).populate(options.populate);
      } else {
        result = await this.model.find(query);
      }
      page.items = result;
      page.total = result.length;
      return page;
    }
  }
  public async create(data: any): Promise<any> {
    return this.model.create(data);
  }
  public async update(query: any, data: any): Promise<any> {
    return this.model.findOneAndUpdate(query, data, { new: true });
  }
  public async upsert(query: any, data: any): Promise<any> {
    return this.model.findOneAndUpdate(query, data, {
      upsert: true,
      new: true
    });
  }
  public async delete(data: any): Promise<any> {
    return this.model.delete
      ? this.model.delete(data)
      : this.model.remove(data);
  }
}

export default BaseRepository
