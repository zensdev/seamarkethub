"use server";
import natural from "natural";
import Vector from "vector-object";
// import Cart, { ICartSchema } from "@/lib/models/carts";
// import Favorite, { IFavoriteSchema } from "@/lib/models/favorites";
// import Order, { IOrderSchema } from "@/lib/models/orders";
import Product, { IProductSchema } from "@/lib/models/products";

type ProductDataItem = {
  _id: string;
  content: string;
};

type ProductData = ProductDataItem[];
type TrainedData = {
  [key: string]: ProductDataItem;
};

const processedDocs: ProductData = [];

export const getProductData = async () => {
  // const productData: ProductData = [];
  const products: IProductSchema[] = await Product.find();

  if (products.length > 0) {
    products.map((product) => {
      const data: ProductDataItem = {
        _id: "",
        content: "",
      };
      data._id = product._id;
      data.content = extractProductDescription(product);
      processedDocs.push(data);
    });
    return processedDocs;
  }
  return processedDocs;
};

const extractProductDescription = (product: IProductSchema): string => {
  const description = product.description || {};
  const blocks = description.blocks || [];
  const contentArray: string[] = [];

  // Duyệt qua từng khối văn bản và trích xuất nội dung text
  blocks.forEach((block) => {
    if (block.type === "header") {
      // Nếu là khối tiêu đề, chúng ta có thể thêm nó vào nội dung
      contentArray.push(block.data.text);
    } else if (block.type === "paragraph") {
      // Nếu là khối đoạn văn bản, cũng thêm nó vào nội dung
      contentArray.push(block.data.text);
    }
    // Các loại khối văn bản khác có thể được xử lý tương tự
  });

  // Kết hợp tất cả nội dung thành một chuỗi duy nhất
  const content = contentArray.join("\n");

  return content;
};

export const createVectorsFromDocs = async () => {
  const processedDocs: ProductData = await getProductData();
  const TfIdf = natural.TfIdf;
  const tfidf = new TfIdf();

  processedDocs.forEach((processedDocument) => {
    tfidf.addDocument(processedDocument.content);
  });

  const documentVectors = [];

  for (let i = 0; i < processedDocs.length; i += 1) {
    const processedDocument = processedDocs[i];
    const obj: { [key: string]: number } = {};

    const items = tfidf.listTerms(i);

    for (let j = 0; j < items.length; j += 1) {
      const item = items[j];
      obj[item.term] = item.tfidf;
    }

    const documentVector = {
      id: processedDocument._id,
      vector: new Vector(obj),
    };

    documentVectors.push(documentVector);
  }
  return documentVectors;
};

export const calcSimilarities = async () => {
  const docVectors = await createVectorsFromDocs();
  // number of results that you want to return.
  const MAX_SIMILAR = 20;
  // min cosine similarity score that should be returned.
  const MIN_SCORE = 0.2;
  const data: { [key: string]: any[] } = {};

  for (let i = 0; i < docVectors.length; i += 1) {
    const documentVector = docVectors[i];
    const { id } = documentVector;

    data[id] = [];
  }

  for (let i = 0; i < docVectors.length; i += 1) {
    for (let j = 0; j < i; j += 1) {
      const idi = docVectors[i].id;
      const vi = docVectors[i].vector;
      const idj = docVectors[j].id;
      const vj = docVectors[j].vector;
      const similarity = vi.getCosineSimilarity(vj);

      if (similarity > MIN_SCORE) {
        data[idi].push({ id: idj, score: similarity });
        data[idj].push({ id: idi, score: similarity });
      }
    }
  }

  Object.keys(data).forEach((id) => {
    data[id].sort((a, b) => b.score - a.score);

    if (data[id].length > MAX_SIMILAR) {
      data[id] = data[id].slice(0, MAX_SIMILAR);
    }
  });

  return data;
};

export const getSimilarDocuments = async (_id: string) => {
  console.log("getSimilarDocuments");
  if (!_id) {
    return [];
  }
  const trainedData = await calcSimilarities();
  let similarDocuments = trainedData[_id];

  if (similarDocuments === undefined) {
    return [];
  }
  return similarDocuments;
};

export const getSimilarProducts = async (_id: string) => {
  const productSimilarList = await getSimilarDocuments(_id);

  if (productSimilarList.length <= 0) {
    return [];
  }

  const productIds = productSimilarList.map((item) => item.id);
  try {
    const products = await Product.find({ _id: { $in: productIds } })
      .populate({
        path: "sellerId",
        select: "username image", // select username and image of the seller
      })
      .populate({
        path: "productType",
        select: "name", // select name of the product type
      })
      .select("name images price");

    const formattedProducts = products.map((product) => ({
      _id: product._id.toString(),
      productName: product.name,
      productTypeName: product.productType.name,
      sellerName: product.sellerId.username,
      sellerAvatar: product.sellerId.image,
      productImages: product.images,
      productPrice: product.price,
    }));
    return formattedProducts;
  } catch (error) {
    console.error("Lỗi truy vấn sản phẩm:", error);
    return [];
  }
};