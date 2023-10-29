"use client";
import { FC, useEffect, useState } from "react";
import CardItem from "@/components/card/CardItem";
import { Card, CardBody, CardFooter, Listbox, ListboxItem, Pagination, Skeleton } from "@nextui-org/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { getProductsSpecialty } from "@/actions/products";
import { categories } from '@/lib/constant/CategoriesDefault'

type IProps = {
  params: {
    slug: string;
  };
};

const ProductsOCOPPage: FC<IProps> = ({ params }) => {
  const router = useRouter()
  const [data, setData] = useState<IProductsResponse>();
  const [page, setPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      const slug = decodeURIComponent(params.slug);
      const response = await getProductsSpecialty(slug, page);
      setData(response);
      setIsLoading(false)
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.slug]);

  return (
    <div className="flex flex-row items-start gap-3">
      <div>
        <Listbox
          items={categories}
          aria-label="Danh sách đặc sản"
          onAction={(key) => router.push(`/products/ocop/${encodeURIComponent(key)}`)}
        >
          {(item) => (
            <ListboxItem
              key={item.lable}
            >
              {item.lable}
            </ListboxItem>
          )}
        </Listbox>
      </div>
      <motion.div
        className="flex flex-col items-center gap-4 w-full"
        initial={{ width: "100%", height: 0, opacity: 0 }}
        animate={{ width: "100%", height: "auto", opacity: 1 }}
        exit={{ width: "100%", height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence mode="wait">
          <div className="mt-5 w-full grid items-center sm:grid-cols-2 grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4 xl:gap-5">
            {
              isLoading ? (
                Array.from({ length: 15 }).map((_, index) => (
                  <motion.div
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 15, opacity: 0 }}
                    transition={{ duration: 0.3, delay: index / 10 }}
                    key={index}
                  >
                    <Card shadow="sm" >
                      <Skeleton isLoaded={!isLoading} className="rounded-lg">
                        <CardBody className="overflow-visible p-0">
                          <div className="w-full h-[140px]"></div>
                        </CardBody>
                      </Skeleton>

                      <CardFooter className="flex flex-col text-small justify-between">
                        <Skeleton isLoaded={!isLoading} className="rounded-lg">
                          <b className="line-clamp-2">productname</b>
                        </Skeleton>
                        <Skeleton isLoaded={!isLoading} className="rounded-lg mt-2">
                          <p className="text-default-500">productprice</p>
                        </Skeleton>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))
              ) : data && data.products.length > 0 ? data.products.map((product, index) => (
                <motion.div
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 15, opacity: 0 }}
                  transition={{ duration: 0.3, delay: index / 10 }}
                  key={product?._id}
                >
                  <CardItem data={product} />
                </motion.div>
              )) : <span>Không có sản phẩm</span>
            }
          </div>
        </AnimatePresence>

        <Pagination showControls total={data?.totalPages || 1} initialPage={page} onChange={setPage} />
      </motion.div>
    </div>
  );
};

export default ProductsOCOPPage;
