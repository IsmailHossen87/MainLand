"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregationQueryBuilder = void 0;
class AggregationQueryBuilder {
    constructor(pipeline, query) {
        this.pipeline = pipeline;
        this.query = query;
    }
    // 🔍 Search inside aggregation
    search(fields) {
        var _a;
        const term = (_a = this.query.searchTerm) === null || _a === void 0 ? void 0 : _a.trim();
        if (term) {
            this.pipeline.push({
                $match: {
                    $or: fields.map(f => ({
                        [f]: { $regex: term, $options: "i" }
                    }))
                }
            });
        }
        return this;
    }
    // 🔃 Sort
    sort() {
        const sort = this.query.sort || "_id";
        this.pipeline.push({ $sort: { [sort]: 1 } });
        return this;
    }
    // 📄 Pagination
    paginate() {
        const page = Number(this.query.page) || 1;
        const limit = Number(this.query.limit) || 10;
        const skip = (page - 1) * limit;
        this.pipeline.push({
            $facet: {
                meta: [{ $count: "total" }],
                data: [
                    { $skip: skip },
                    { $limit: limit }
                ]
            }
        });
        return this;
    }
    build(model) {
        return model.aggregate(this.pipeline);
    }
}
exports.AggregationQueryBuilder = AggregationQueryBuilder;
