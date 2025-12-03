import { Aggregate } from "mongoose";

export class AggregationQueryBuilder {
    public pipeline: any[];
    public readonly query: Record<string, string>;

    constructor(pipeline: any[], query: Record<string, string>) {
        this.pipeline = pipeline;
        this.query = query;
    }

    // 🔍 Search inside aggregation
    search(fields: string[]) {
        const term = this.query.searchTerm?.trim();
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

        this.pipeline.push(
            {
                $facet: {
                    meta: [{ $count: "total" }],
                    data: [
                        { $skip: skip },
                        { $limit: limit }
                    ]
                }
            }
        );

        return this;
    }

    build(model: any) {
        return model.aggregate(this.pipeline);
    }
}
