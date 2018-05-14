class BaseRepository {
	model: any = undefined
	constructor(mongooseModel: any) {
		this.model = mongooseModel
	}
	public async findOne(query: any): Promise<any> {
		return this.model.findOne(query)
	}
	public async find(query: any = {}, paginate: any = {}): Promise<any> {
		let page = {
			items: [],
			total: 0,
			limit: paginate.limit || 0,
			page: paginate.page || 1,
			hasNext: false
		}
		if (query) {
			Object.keys(query).map(key => {
				if (typeof query[key] === 'string') {
					query[key] = query[key].split(',')
				}
			})
		}

		if (this.model.paginate && (paginate.page !== undefined && paginate.limit !== undefined)) {
			if (paginate.page < 1) throw new Error('page start with 1')
			let result = await this.model.paginate(query, {
				limit: +paginate.limit,
				page: +paginate.page,
				sort: paginate.sort
			})
			page.items = result.docs
			page.total = result.total
			page.limit = result.limit
			page.page = result.page
			page.hasNext = (result.page * result.limit) < result.total
			return page
		} else {
			let result = await this.model.find(query)
			page.items = result
			page.total = result.length
			return page
		}
    }
    public async create(data: any): Promise<any> {
        return this.model.create(data)
    }
    public async update(query: any, data: any): Promise<any> {
        return this.model.findOneAndUpdate(query, data, { new: true })
    }
    public async delete(data: any): Promise<any> {
        return this.model.remove(data)
    }
}

export default BaseRepository
