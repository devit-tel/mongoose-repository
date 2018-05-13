class BaseRepository {
	constructor(mongooseModel) {
		this.model = mongooseModel
	}
	async findOne(query) {
		return this.model.findOne(query)
	}
	async find(query = {}, paginate = {}) {
		let page = {
			items: [],
			total: 0,
			limit: paginate.limit || 0,
			page: paginate.page || 1,
			hasNext: false
		}
		// handle query like example: name=john,yana,george
		// console.log('find query >>>> ', query)
		if (query) {
			Object.keys(query).map(key => {
				if (typeof query[key] === 'string') {
					query[key] = query[key].split(',')
				}
			})
		}

		if (model.paginate && (paginate.page !== undefined && paginate.limit !== undefined)) {
			if (paginate.page < 1) throw new BadRequestError('page start with 1')
			let result = await model.paginate(query, {
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
			let result = await model.find(query)
			page.items = result
			page.total = result.length
			return page
		}
    }
    async create(data) {
        return this.model.create(data)
    }
    async update(query, data) {
        return this.model.findOneAndUpdate(query, data, { new: true })
    }
    async delete(data) {
        return this.model.remove(data)
    }
}

export default BaseRepository
