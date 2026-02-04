import { FilterQuery, Query } from "mongoose";
import { excludeField } from "../../shared/constrant";


export class QueryBuilder<T> {
  public modelQuery: Query<T[], T>;
  public readonly query: Record<string, string>;

  constructor(modelQuery: Query<T[], T>, query: Record<string, string>) {
    this.modelQuery = modelQuery;
    this.query = query;
  }

  // 🔍 Search
  search(searchableField: string[]): this {
    const searchTerm = this.query.searchTerm?.trim();
    if (searchTerm) {
      const searchQuery = {
        $or: searchableField.map((field) => ({
          [field]: { $regex: searchTerm, $options: "i" },
        })),
      };
      this.modelQuery = this.modelQuery.find(searchQuery as FilterQuery<T>);
    }
    return this;
  }

  // 🧩 Filter
  filter(): this {
    const filter = { ...this.query };
    for (const field of excludeField) delete filter[field];
    this.modelQuery = this.modelQuery.find(filter as FilterQuery<T>);
    return this;
  }

  // 📅 Date Range (weekly, monthly, yearly)
  dateRange(): this {
    const now = new Date();
    const range = this.query.dateRange;

    if (range) {
      let startDate: Date | null = null;

      if (range === "weekly") {
        startDate = new Date();
        startDate.setDate(now.getDate() - 7);
      } else if (range === "monthly") {
        startDate = new Date();
        startDate.setMonth(now.getMonth() - 1);
      } else if (range === "yearly") {
        startDate = new Date();
        startDate.setFullYear(now.getFullYear() - 1);
      }

      if (startDate) {
        const dateCondition = { createdAt: { $gte: startDate, $lte: now } };

        this.modelQuery = this.modelQuery.find({
          ...((this.modelQuery as any)._conditions || {}),
          ...dateCondition,
        } as FilterQuery<T>);
      }
    }

    return this;
  }

  // 🔃 Sort
  sort(): this {
    const sort = this.query.sort || "eventDate";
    this.modelQuery = this.modelQuery.sort(sort);
    return this;
  }


  // 📋 Fields selection
  fields(defaultFields: string[] = []): this {
    let fieldsStr = this.query.fields?.split(",").join(" ");

    if (!fieldsStr && defaultFields.length > 0) {
      fieldsStr = defaultFields.join(" ");
    }
    if (fieldsStr) {
      this.modelQuery = this.modelQuery.select(fieldsStr);
    }

    return this;
  }


  // 📄 Pagination
  paginate(): this {
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const skip = (page - 1) * limit;

    this.modelQuery = this.modelQuery.skip(skip).limit(limit);
    return this;
  }

  // 🚀 Execute final query
  async build() {
    return await this.modelQuery.exec();
  }

  // 📊 Meta info (for pagination)
  async getMeta() {
    const countQuery = this.modelQuery.clone();

    const totalDocuments = await countQuery.countDocuments();

    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const totalPage = Math.ceil(totalDocuments / limit);

    return {
      page,
      limit,
      total: totalDocuments,
      totalPage,
    };
  }
}
