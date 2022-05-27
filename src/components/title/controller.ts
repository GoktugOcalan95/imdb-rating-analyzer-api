import { ITitleDoc, Title } from "./model";
import { logError } from "../../utils";
import { TitleQueryResult, TitleQueryOptions } from "./types";

export class TitleController {

  public static async getById(id: string): Promise<ITitleDoc | null> {
    return Title.findById(id);
  }

  public static async getByImdbId(imdbId: string): Promise<ITitleDoc | null> {
    return Title.findOne({imdbId});
  }

  public static async getAll(options: TitleQueryOptions): Promise<TitleQueryResult | null> {
    const page = options.page || 1;
    const itemPerPage = options.itemPerPage || 20;
    const skip = (page - 1) * itemPerPage;

    const query: TitleQueryOptions = {};
    if (options.imdbId){
      query.imdbId = options.imdbId;
    }
    try {
      const countPromise = Title.countDocuments(query);
      const itemsPromise = Title.find(query).limit(itemPerPage).skip(skip);
      const [count, items] = await Promise.all([countPromise, itemsPromise]);
  
      const pageCount = Math.ceil(count / itemPerPage);

      return {
        pagination: {
          count,
          pageCount,
        },
        items,
      };
    } catch (err) {
      logError(err, "Title - GetAll", options);
      return Promise.reject(null);
    }
  }
}
